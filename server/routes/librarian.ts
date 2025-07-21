import { Request, Response } from "express";
import { User, requireLibrarian } from "./auth";
import { Book } from "./admin";
import mongoose from "mongoose";
import { logActivity } from "../utils/activityLogger";

// Loan Schema
const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Librarian who issued
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  renewalCount: { type: Number, default: 0 },
  maxRenewals: { type: Number, default: 2 },
  status: { 
    type: String, 
    enum: ['active', 'returned', 'overdue', 'lost', 'damaged'], 
    default: 'active' 
  },
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

// Reservation Schema
const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  requestDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'ready', 'fulfilled', 'cancelled', 'expired'], 
    default: 'pending' 
  },
  priority: { type: Number, default: 1 },
  notificationSent: { type: Boolean, default: false },
  expiryDate: Date,
  notes: String
}, { timestamps: true });

// Fine Schema
const fineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  amount: { type: Number, required: true },
  reason: { 
    type: String, 
    enum: ['overdue', 'damage', 'lost', 'replacement', 'other'], 
    required: true 
  },
  description: String,
  dateIssued: { type: Date, default: Date.now },
  datePaid: Date,
  paidAmount: { type: Number, default: 0 },
  waived: { type: Boolean, default: false },
  waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  waivedReason: String,
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'partial', 'waived', 'cancelled'], 
    default: 'pending' 
  }
}, { timestamps: true });

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['overdue', 'reservation_ready', 'fine', 'general', 'book_reminder'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sent: { type: Boolean, default: false },
  sentDate: Date,
  read: { type: Boolean, default: false },
  readDate: Date,
  relatedLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  relatedReservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  relatedFineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fine' }
}, { timestamps: true });

// Inventory Audit Schema
const inventoryAuditSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  auditDate: { type: Date, default: Date.now },
  expectedCount: { type: Number, required: true },
  actualCount: { type: Number, required: true },
  discrepancy: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['match', 'shortage', 'surplus', 'damaged', 'missing'], 
    required: true 
  },
  notes: String,
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedDate: Date
}, { timestamps: true });

const Loan = mongoose.model("Loan", loanSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);
const Fine = mongoose.model("Fine", fineSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const InventoryAudit = mongoose.model("InventoryAudit", inventoryAuditSchema);

// Helper function to calculate due date (default 14 days)
function calculateDueDate(days: number = 14): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Helper function to calculate overdue fine
function calculateOverdueFine(dueDate: Date, returnDate: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / msPerDay);
  return overdueDays > 0 ? overdueDays * 0.50 : 0; // $0.50 per day
}

// Helper function to handle reservation cleanup when book availability changes
async function handleReservationCleanup(bookId: string, bookTitle: string, reason: string) {
  try {
    // Find all pending reservations for this book
    const pendingReservations = await Reservation.find({
      bookId,
      status: 'pending'
    }).populate('userId', 'name email');

    // Cancel all pending reservations
    for (const reservation of pendingReservations) {
      reservation.status = 'cancelled';
      reservation.notes = reason;
      await reservation.save();

      // Create notification for user
      await Notification.create({
        userId: reservation.userId._id,
        type: 'general',
        title: 'Reservation Cancelled',
        message: `Your reservation for "${bookTitle}" has been cancelled: ${reason}`,
        relatedReservationId: reservation._id
      });
    }

    return pendingReservations.length;
  } catch (error) {
    console.error('Error handling reservation cleanup:', error);
    return 0;
  }
}

// GET /api/librarian/dashboard - Get librarian dashboard stats
export async function getLibrarianDashboard(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Get dashboard statistics
    const totalBooks = await Book.countDocuments();
    const totalLoans = await Loan.countDocuments({ status: 'active' });
    const overdueLoans = await Loan.countDocuments({ 
      status: 'active',
      dueDate: { $lt: new Date() }
    });
    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });
    const totalFines = await Fine.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const stats = {
      totalBooks,
      totalLoans,
      overdueLoans,
      pendingReservations,
      totalFines: totalFines[0]?.total || 0,
      systemStatus: 'healthy' as const
    };

    res.json(stats);
  } catch (error) {
    console.error('Librarian dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/books - Get books for librarian management
export async function getLibrarianBooks(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { isbn: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const books = await Book.find(query)
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(query);

    const booksWithLoanInfo = await Promise.all(
      books.map(async (book) => {
        const activeLoans = await Loan.countDocuments({ 
          bookId: book._id, 
          status: 'active' 
        });
        
        return {
          id: book._id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          genre: book.genre,
          publisher: book.publisher,
          publishedYear: book.publishedYear,
          description: book.description,
          coverImage: book.coverImage,
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
          currentLoans: activeLoans,
          location: book.location,
          language: book.language,
          pages: book.pages,
          hasDownload: book.hasDownload,
          hasReadOnline: book.hasReadOnline,
          categories: book.categories,
          addedDate: book.addedDate,
          status: book.availableCopies === 0 ? 'out-of-stock' : 
                  book.availableCopies <= 2 ? 'low-stock' : 'available'
        };
      })
    );

    res.json({
      books: booksWithLoanInfo,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get librarian books error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/librarian/loans/issue - Issue a book to a user
export async function issueBook(req: Request, res: Response) {
  try {
    const librarian = (req as any).user;
    const { userId, bookId, loanDays = 14 } = req.body;

    if (!userId || !bookId) {
      return res.status(400).json({ message: 'User ID and Book ID are required' });
    }

    // Find user by userId (custom ID), email, or MongoDB ObjectId
    let user;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ 
        $or: [
          { userId: userId },
          { email: userId }
        ]
      });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please check the Student ID.' });
    }

    // Find book by ISBN, title, or MongoDB ObjectId
    let book;
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      book = await Book.findById(bookId);
    } else {
      book = await Book.findOne({ 
        $or: [
          { isbn: bookId },
          { title: { $regex: bookId, $options: 'i' } }
        ]
      });
    }
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found. Please check the Book ID/ISBN.' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book is not available for loan' });
    }

    // Check if user already has this book
    const existingLoan = await Loan.findOne({
      userId: user._id,
      bookId: book._id,
      status: 'active'
    });

    if (existingLoan) {
      return res.status(400).json({ message: 'User already has this book on loan' });
    }

    // Check user's borrowing limit
    const currentLoans = await Loan.countDocuments({ 
      userId: user._id, 
      status: 'active' 
    });

    const borrowingLimit = 5; // Standard limit for students
    if (currentLoans >= borrowingLimit) {
      return res.status(400).json({ 
        message: `User has reached their borrowing limit of ${borrowingLimit} books. Please return some books before borrowing more.` 
      });
    }

    // Check for outstanding fines
    const outstandingFines = await Fine.aggregate([
      { $match: { userId: user._id, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalFines = outstandingFines[0]?.total || 0;
    if (totalFines > 0) {
      return res.status(400).json({ 
        message: `User has outstanding fines of $${totalFines.toFixed(2)}. Please pay fines before borrowing books.` 
      });
    }

    // Check for overdue books
    const overdueBooks = await Loan.countDocuments({
      userId: user._id,
      status: 'active',
      dueDate: { $lt: new Date() }
    });

    if (overdueBooks > 0) {
      return res.status(400).json({ 
        message: `User has ${overdueBooks} overdue book(s). Please return overdue books before borrowing new ones.` 
      });
    }

    // Create loan record
    const loan = await Loan.create({
      userId: user._id,
      bookId: book._id,
      issuedBy: librarian._id,
      dueDate: calculateDueDate(loanDays)
    });

    // Update book availability
    await Book.findByIdAndUpdate(book._id, {
      $inc: { availableCopies: -1 }
    });

    // Log the activity
    await logActivity('loan_issued', `Book "${book.title}" issued to ${user.name}.`, librarian._id, book._id);

    // Populate loan with user and book details
    const populatedLoan = await Loan.findById(loan._id)
      .populate('userId', 'name email userId')
      .populate('bookId', 'title author isbn');

    res.status(201).json({
      message: 'Book issued successfully',
      loan: populatedLoan
    });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/librarian/loans/return - Return a book
export async function returnBook(req: Request, res: Response) {
  try {
    const { loanId, condition = 'good', notes } = req.body;

    if (!loanId) {
      return res.status(400).json({ message: 'Loan ID is required' });
    }

    const loan = await Loan.findById(loanId)
      .populate('userId', 'name email')
      .populate('bookId', 'title author');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({ message: 'Book is not currently on loan' });
    }

    const returnDate = new Date();
    let fine = 0;

    // Calculate overdue fine if applicable
    if (returnDate > loan.dueDate) {
      fine = calculateOverdueFine(loan.dueDate, returnDate);
    }

    // Update loan record
    loan.returnDate = returnDate;
    loan.status = condition === 'damaged' ? 'damaged' : 'returned';
    loan.fineAmount = fine;
    if (notes) loan.notes = notes;
    await loan.save();

    // Update book availability
    if (condition !== 'lost' && condition !== 'damaged') {
      await Book.findByIdAndUpdate(loan.bookId, {
        $inc: { availableCopies: 1 }
      });
    }

    // Log the activity
    const librarianId = (req.user as any)?._id;
    if (librarianId) {
      await logActivity('loan_returned', `Book "${(loan.bookId as any).title}" returned by ${(loan.userId as any).name}.`, librarianId, (loan.bookId as any)._id);
    }

    // Create fine record if applicable
    if (fine > 0) {
      await Fine.create({
        userId: loan.userId,
        loanId: loan._id,
        amount: fine,
        reason: 'overdue',
        description: `Overdue fine for "${(loan.bookId as any).title}"`
      });
    }

    res.json({
      message: 'Book returned successfully',
      loan,
      fine: fine > 0 ? fine : null
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/loans - Get all loans
export async function getLoans(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query = { status };
    }

    const loans = await Loan.find(query)
      .populate('userId', 'name email')
      .populate('bookId', 'title author isbn')
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments(query);

    res.json({
      loans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/overdue - Get overdue books
export async function getOverdueBooks(req: Request, res: Response) {
  try {
    const overdueLoans = await Loan.find({
      status: 'active',
      dueDate: { $lt: new Date() }
    })
      .populate('userId', 'name email')
      .populate('bookId', 'title author isbn')
      .sort({ dueDate: 1 });

    // Calculate overdue days and potential fines
    const overdueWithFines = overdueLoans.map(loan => {
      const overdueDays = Math.ceil((Date.now() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000));
      const potentialFine = overdueDays * 0.50;
      
      return {
        ...loan.toObject(),
        overdueDays,
        potentialFine
      };
    });

    res.json(overdueWithFines);
  } catch (error) {
    console.error('Get overdue books error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/reservations - Get all reservations
export async function getReservations(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    let query = {};
    if (status) {
      query = { status };
    }

    // Check for expired ready reservations and mark them as expired
    const expiredReservations = await Reservation.find({
      status: 'ready',
      expiryDate: { $lt: new Date() }
    });

    for (const reservation of expiredReservations) {
      reservation.status = 'expired';
      reservation.notes = 'Reservation expired - not picked up within 7 days';
      await reservation.save();

      // Create notification for user
      await Notification.create({
        userId: reservation.userId,
        type: 'general',
        title: 'Reservation Expired',
        message: `Your reservation for "${(reservation.bookId as any).title}" has expired because it was not picked up within 7 days.`,
        relatedReservationId: reservation._id
      });
    }

    const reservations = await Reservation.find(query)
      .populate('userId', 'name email')
      .populate('bookId', 'title author isbn')
      .sort({ requestDate: 1 });

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/users/search - Search users
export async function searchUsers(req: Request, res: Response) {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { userId: { $regex: q, $options: 'i' } }
      ],
      role: { $ne: 'admin' } // Don't show admin users
    })
      .select('name email userId role department createdAt lastLogin profilePicture')
      .limit(20);

    // Get loan info for each user
    const usersWithLoans = await Promise.all(
      users.map(async (user) => {
        const activeLoans = await Loan.countDocuments({ 
          userId: user._id, 
          status: 'active' 
        });
        const overdueLoans = await Loan.countDocuments({ 
          userId: user._id, 
          status: 'active',
          dueDate: { $lt: new Date() }
        });
        const totalFines = await Fine.aggregate([
          { $match: { userId: user._id, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
          ...user.toObject(),
          activeLoans,
          overdueLoans,
          totalFines: totalFines[0]?.total || 0
        };
      })
    );

    res.json(usersWithLoans);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/users/:id/loans - Get user's loan history
export async function getUserLoans(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const loans = await Loan.find({ userId: id })
      .populate('bookId', 'title author isbn')
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 });

    res.json(loans);
  } catch (error) {
    console.error('Get user loans error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/users/:id/activity - Get user's full activity log
export async function getUserActivity(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Fetch all loans for the user
    const loans = await Loan.find({ userId: id })
      .populate('bookId', 'title author isbn')
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 });

    // Fetch all fines for the user
    const fines = await Fine.find({ userId: id })
      .populate('loanId', 'bookId issueDate returnDate')
      .sort({ dateIssued: -1 });

    // Fetch all reservations for the user
    const reservations = await Reservation.find({ userId: id })
      .populate('bookId', 'title author isbn')
      .sort({ requestDate: -1 });

    // Fetch all inventory audits performed by the user (if librarian)
    const audits = await InventoryAudit.find({ auditedBy: id })
      .populate('bookId', 'title author isbn')
      .sort({ auditDate: -1 });

    // Build activity log entries
    const activity: any[] = [];

    // Loans (borrowed/returned)
    for (const loan of loans) {
      activity.push({
        type: 'loan-issued',
        date: loan.issueDate,
        details: {
          book: loan.bookId,
          issuedBy: loan.issuedBy,
          dueDate: loan.dueDate,
          status: loan.status,
        }
      });
      if (loan.returnDate) {
        activity.push({
          type: 'loan-returned',
          date: loan.returnDate,
          details: {
            book: loan.bookId,
            issuedBy: loan.issuedBy,
            dueDate: loan.dueDate,
            status: loan.status,
            fineAmount: loan.fineAmount,
          }
        });
      }
    }

    // Fines
    for (const fine of fines) {
      activity.push({
        type: 'fine',
        date: fine.dateIssued,
        details: {
          amount: fine.amount,
          reason: fine.reason,
          description: fine.description,
          status: fine.status,
          loan: fine.loanId,
        }
      });
      if (fine.datePaid) {
        activity.push({
          type: 'fine-paid',
          date: fine.datePaid,
          details: {
            amount: fine.amount,
            paidAmount: fine.paidAmount,
            status: fine.status,
            loan: fine.loanId,
          }
        });
      }
    }

    // Reservations
    for (const reservation of reservations) {
      activity.push({
        type: 'reservation',
        date: reservation.requestDate,
        details: {
          book: reservation.bookId,
          status: reservation.status,
          priority: reservation.priority,
          expiryDate: reservation.expiryDate,
        }
      });
      if (reservation.status === 'fulfilled' && reservation.expiryDate) {
        activity.push({
          type: 'reservation-fulfilled',
          date: reservation.expiryDate,
          details: {
            book: reservation.bookId,
            status: reservation.status,
            priority: reservation.priority,
          }
        });
      }
    }

    // Audits (if user is a librarian)
    for (const audit of audits) {
      activity.push({
        type: 'inventory-audit',
        date: audit.auditDate,
        details: {
          book: audit.bookId,
          expectedCount: audit.expectedCount,
          actualCount: audit.actualCount,
          discrepancy: audit.discrepancy,
          status: audit.status,
          notes: audit.notes,
        }
      });
      if (audit.resolved && audit.resolvedDate) {
        activity.push({
          type: 'inventory-audit-resolved',
          date: audit.resolvedDate,
          details: {
            book: audit.bookId,
            status: audit.status,
            notes: audit.notes,
          }
        });
      }
    }

    // Sort all activities by date descending
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ activity });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Export models and functions
export { 
  Loan, 
  Reservation, 
  Fine, 
  Notification, 
  InventoryAudit,
  calculateDueDate,
  calculateOverdueFine
};

// GET /api/librarian/inventory-audits - Get inventory audits
export async function getInventoryAudits(req: Request, res: Response) {
  try {
    const { bookId, status, resolved } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let query: any = {};
    if (bookId) query.bookId = bookId;
    if (status) query.status = status;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const audits = await InventoryAudit.find(query)
      .populate('bookId', 'title author isbn')
      .populate('auditedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ auditDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryAudit.countDocuments(query);

    res.json({
      audits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inventory audits error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/librarian/inventory-audits - Create inventory audit
export async function createInventoryAudit(req: Request, res: Response) {
  try {
    const librarian = (req as any).user;
    const { bookId, expectedCount, actualCount, notes } = req.body;

    if (!bookId || expectedCount === undefined || actualCount === undefined) {
      return res.status(400).json({ message: 'Book ID, expected count, and actual count are required' });
    }

    // Validate input ranges
    if (typeof expectedCount !== 'number' || expectedCount < 0) {
      return res.status(400).json({ message: 'Expected count must be a non-negative number' });
    }
    
    if (typeof actualCount !== 'number' || actualCount < 0) {
      return res.status(400).json({ message: 'Actual count must be a non-negative number' });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const discrepancy = actualCount - expectedCount;
    let status = 'match';
    
    if (discrepancy < 0) {
      status = 'shortage';
    } else if (discrepancy > 0) {
      status = 'surplus';
    }

    const audit = await InventoryAudit.create({
      bookId,
      auditedBy: librarian._id,
      expectedCount,
      actualCount,
      discrepancy,
      status,
      notes: notes || ''
    });

    // Update book quantities in real-time based on audit findings
    if (discrepancy !== 0) {
      // Get current loan count to calculate proper available copies
      const activeLoans = await Loan.countDocuments({ 
        bookId: book._id, 
        status: 'active' 
      });

      // Get pending reservations count
      const pendingReservations = await Reservation.countDocuments({
        bookId: book._id,
        status: 'pending'
      });

      // Update total copies to match actual count found
      const newTotalCopies = actualCount;
      
      // Safety check: Ensure we don't reduce total copies below active loans
      if (newTotalCopies < activeLoans) {
        return res.status(400).json({ 
          message: `Cannot set total copies to ${newTotalCopies}. There are currently ${activeLoans} active loans for this book. Please handle active loans first.` 
        });
      }
      
      // Calculate new available copies (ensure it's not negative)
      const newAvailableCopies = Math.max(0, newTotalCopies - activeLoans);

      // Warning if audit results in no available copies but there are pending reservations
      if (newAvailableCopies === 0 && pendingReservations > 0) {
        console.warn(`Warning: Audit resulted in 0 available copies but there are ${pendingReservations} pending reservations for book "${book.title}"`);
      }

      await Book.findByIdAndUpdate(book._id, {
        totalCopies: newTotalCopies,
        availableCopies: newAvailableCopies,
        lastUpdated: new Date()
      });

      console.log(`Audit ${audit._id}: Updated book ${book.title} quantities - Total: ${book.totalCopies} → ${newTotalCopies}, Available: ${book.availableCopies} → ${newAvailableCopies}, Active Loans: ${activeLoans}`);
    }

    // Populate the audit with book and user details
    const populatedAudit = await InventoryAudit.findById(audit._id)
      .populate('bookId', 'title author isbn')
      .populate('auditedBy', 'name email');

    res.status(201).json({
      message: 'Inventory audit created and book quantities updated in real-time',
      audit: populatedAudit,
      quantitiesUpdated: discrepancy !== 0
    });
  } catch (error) {
    console.error('Create inventory audit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/librarian/inventory-audits/:id - Resolve inventory audit
export async function resolveInventoryAudit(req: Request, res: Response) {
  try {
    const librarian = (req as any).user;
    const { id } = req.params;
    const { resolved, notes } = req.body;

    const audit = await InventoryAudit.findById(id)
      .populate('bookId', 'title author isbn');
      
    if (!audit) {
      return res.status(404).json({ message: 'Inventory audit not found' });
    }

    if (audit.resolved) {
      return res.status(400).json({ message: 'Audit is already resolved' });
    }

    audit.resolved = resolved || true;
    audit.resolvedBy = librarian._id;
    audit.resolvedDate = new Date();
    if (notes) audit.notes = notes;
    
    await audit.save();

    // Get current book state for confirmation
    const currentBook = await Book.findById(audit.bookId);
    const currentActiveLoans = await Loan.countDocuments({ 
      bookId: audit.bookId, 
      status: 'active' 
    });

    // Populate the audit with user details
    const populatedAudit = await InventoryAudit.findById(audit._id)
      .populate('bookId', 'title author isbn')
      .populate('auditedBy', 'name email')
      .populate('resolvedBy', 'name email');

    console.log(`Audit ${audit._id} resolved by ${librarian.name}: Book "${currentBook?.title}" confirmed with ${currentBook?.totalCopies} total copies, ${currentBook?.availableCopies} available, ${currentActiveLoans} on loan`);

    res.json({
      message: 'Inventory audit resolved and confirmed successfully',
      audit: populatedAudit,
      currentBookState: {
        totalCopies: currentBook?.totalCopies,
        availableCopies: currentBook?.availableCopies,
        activeLoans: currentActiveLoans
      }
    });
  } catch (error) {
    console.error('Resolve inventory audit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/librarian/reservations/:id - Update reservation status (FIXED)
export async function updateReservation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['pending', 'ready', 'fulfilled', 'cancelled', 'expired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status' });
    }

    const reservation = await Reservation.findById(id)
      .populate('userId', 'name email')
      .populate('bookId', 'title author');
      
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const oldStatus = reservation.status;

    // Update reservation
    reservation.status = status;
    if (notes) reservation.notes = notes;
    
    if (status === 'ready') {
      reservation.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days to pick up
    }
    
    await reservation.save();

    // Handle book status changes based on reservation status
    if (status === 'ready' && oldStatus === 'pending') {
      // When marking as ready, check if book is available
      const book = await Book.findById(reservation.bookId);
      if (book && book.availableCopies > 0) {
        // Book is available, no need to change book status
      } else if (book) {
        // Book is not available, this might be a manual override
        console.log(`Warning: Marking reservation as ready for book with ${book.availableCopies} available copies`);
      }
    } else if (status === 'fulfilled' && oldStatus === 'ready') {
      // When fulfilling a reservation, reduce available copies
      const book = await Book.findById(reservation.bookId);
      if (book && book.availableCopies > 0) {
        await Book.findByIdAndUpdate(reservation.bookId, {
          $inc: { availableCopies: -1 }
        });
      }
    } else if (status === 'cancelled' && oldStatus === 'ready') {
      // When cancelling a ready reservation, potentially increase available copies
      // This is optional as the book might have been made available for other purposes
    }

    // Create notification for user
    let notificationTitle = '';
    let notificationMessage = '';
    
    switch (status) {
      case 'ready':
        notificationTitle = 'Book Ready for Pickup';
        notificationMessage = `Your reserved book "${(reservation.bookId as any).title}" is ready for pickup. Please collect it within 7 days.`;
        break;
      case 'cancelled':
        notificationTitle = 'Reservation Cancelled';
        notificationMessage = `Your reservation for "${(reservation.bookId as any).title}" has been cancelled.`;
        break;
      case 'expired':
        notificationTitle = 'Reservation Expired';
        notificationMessage = `Your reservation for "${(reservation.bookId as any).title}" has expired.`;
        break;
      case 'fulfilled':
        notificationTitle = 'Reservation Fulfilled';
        notificationMessage = `Your reservation for "${(reservation.bookId as any).title}" has been fulfilled.`;
        break;
    }
    
    if (notificationTitle) {
      await Notification.create({
        userId: reservation.userId,
        type: 'reservation_ready',
        title: notificationTitle,
        message: notificationMessage,
        relatedReservationId: reservation._id
      });
    }

    res.json({
      message: 'Reservation updated successfully',
      reservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/librarian/fines - Create a manual fine
export async function createFine(req: Request, res: Response) {
  try {
    const librarian = (req as any).user;
    const { userId, loanId, amount, reason, description } = req.body;

    if (!userId || !amount || !reason) {
      return res.status(400).json({ message: 'User ID, amount, and reason are required' });
    }

    if (!['overdue', 'damage', 'lost', 'replacement', 'other'].includes(reason)) {
      return res.status(400).json({ message: 'Invalid fine reason' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fine = await Fine.create({
      userId,
      loanId: loanId || null,
      amount,
      reason,
      description: description || `${reason} fine`,
      dateIssued: new Date()
    });

    // Create notification for user
    await Notification.create({
      userId,
      type: 'fine',
      title: 'New Fine Issued',
      message: `A fine of $${amount.toFixed(2)} has been issued for: ${description || reason}`,
      relatedFineId: fine._id
    });

    res.status(201).json({
      message: 'Fine created successfully',
      fine
    });
  } catch (error) {
    console.error('Create fine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/librarian/fines/:id - Update fine status
export async function updateFine(req: Request, res: Response) {
  try {
    const librarian = (req as any).user;
    const { id } = req.params;
    const { status, paidAmount, waived, waivedReason } = req.body;

    if (!['pending', 'paid', 'partial', 'waived', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid fine status' });
    }

    const fine = await Fine.findById(id)
      .populate('userId', 'name email');
      
    if (!fine) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    // Update fine
    fine.status = status;
    
    if (status === 'paid' || status === 'partial') {
      fine.paidAmount = paidAmount || fine.amount;
      fine.datePaid = new Date();
    }
    
    if (status === 'waived' || waived) {
      fine.waived = true;
      fine.waivedBy = librarian._id;
      fine.waivedReason = waivedReason;
      fine.status = 'waived';
    }
    
    await fine.save();

    // Create notification for user
    let notificationMessage = '';
    switch (status) {
      case 'paid':
        notificationMessage = `Your fine of $${fine.amount.toFixed(2)} has been marked as paid.`;
        break;
      case 'waived':
        notificationMessage = `Your fine of $${fine.amount.toFixed(2)} has been waived.`;
        break;
      case 'cancelled':
        notificationMessage = `Your fine of $${fine.amount.toFixed(2)} has been cancelled.`;
        break;
    }
    
    if (notificationMessage) {
      await Notification.create({
        userId: fine.userId,
        type: 'fine',
        title: 'Fine Status Updated',
        message: notificationMessage,
        relatedFineId: fine._id
      });
    }

    res.json({
      message: 'Fine updated successfully',
      fine
    });
  } catch (error) {
    console.error('Update fine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/fines - Get all fines for management
export async function getFines(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query = { status };
    }

    const fines = await Fine.find(query)
      .populate('userId', 'name email')
      .populate('loanId')
      .sort({ dateIssued: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Fine.countDocuments(query);

    res.json({
      fines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/librarian/books - Create a new book (librarian can add books)
export async function createBook(req: Request, res: Response) {
  try {
    const librarian = (req as any).user;
    const {
      title,
      author,
      isbn,
      genre,
      publishedYear,
      publisher,
      description,
      coverImage,
      totalCopies,
      categories,
      language,
      pages,
      hasDownload,
      hasReadOnline,
      location
    } = req.body;

    if (!title || !author || !isbn || !publisher || !publishedYear || !genre || !location) {
      return res.status(400).json({ 
        message: "Title, author, ISBN, publisher, publication year, genre, and location are required" 
      });
    }

    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({ message: "Book with this ISBN already exists" });
    }

    const newBook = await Book.create({
      title,
      author,
      isbn,
      genre,
      publishedYear,
      publisher,
      description,
      coverImage,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      categories: categories || [],
      language: language || "English",
      pages,
      hasDownload: hasDownload || false,
      hasReadOnline: hasReadOnline || false,
      location
    });

    res.status(201).json({
      message: "Book created successfully",
      book: {
        id: newBook._id,
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        genre: newBook.genre,
        publisher: newBook.publisher,
        publishedYear: newBook.publishedYear,
        description: newBook.description,
        coverImage: newBook.coverImage,
        totalCopies: newBook.totalCopies,
        availableCopies: newBook.availableCopies,
        location: newBook.location,
        language: newBook.language,
        pages: newBook.pages,
        hasDownload: newBook.hasDownload,
        hasReadOnline: newBook.hasReadOnline,
        categories: newBook.categories,
        addedDate: newBook.addedDate
      }
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/librarian/books/:id - Update a book (librarian can edit books)
export async function updateBook(req: Request, res: Response) {
  try {
    const librarian = (req as any).user;
    const { id } = req.params;
    const updateData = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if ISBN is being changed and already exists
    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn: updateData.isbn });
      if (existingBook) {
        return res.status(400).json({ message: "ISBN is already taken" });
      }
    }

    // Check if total copies are being reduced
    if (updateData.totalCopies !== undefined && updateData.totalCopies < book.totalCopies) {
      const reduction = book.totalCopies - updateData.totalCopies;
      
      // Check if reduction would make available copies negative
      if (book.availableCopies - reduction < 0) {
        return res.status(400).json({ 
          message: `Cannot reduce total copies to ${updateData.totalCopies}. There are ${book.availableCopies} available copies and ${book.totalCopies - book.availableCopies} on loan.`
        });
      }

      // Check for pending reservations that might be affected
      const pendingReservations = await Reservation.countDocuments({
        bookId: id,
        status: 'pending'
      });

      if (pendingReservations > 0) {
        return res.status(400).json({ 
          message: `Cannot reduce copies. There are ${pendingReservations} pending reservation(s) for this book. Please handle reservations first.`
        });
      }

      // Update available copies accordingly
      updateData.availableCopies = Math.max(0, book.availableCopies - reduction);
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdated: new Date() },
      { new: true }
    );

    res.json({
      message: "Book updated successfully",
      book: {
        id: updatedBook._id,
        title: updatedBook.title,
        author: updatedBook.author,
        isbn: updatedBook.isbn,
        genre: updatedBook.genre,
        publisher: updatedBook.publisher,
        publishedYear: updatedBook.publishedYear,
        description: updatedBook.description,
        coverImage: updatedBook.coverImage,
        totalCopies: updatedBook.totalCopies,
        availableCopies: updatedBook.availableCopies,
        location: updatedBook.location,
        language: updatedBook.language,
        pages: updatedBook.pages,
        hasDownload: updatedBook.hasDownload,
        hasReadOnline: updatedBook.hasReadOnline,
        categories: updatedBook.categories,
        addedDate: updatedBook.addedDate,
        lastUpdated: updatedBook.lastUpdated
      }
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/librarian/books/:id - Get a single book with full details
export async function getBook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Get additional information
    const activeLoans = await Loan.countDocuments({ 
      bookId: book._id, 
      status: 'active' 
    });
    
    const pendingReservations = await Reservation.countDocuments({
      bookId: book._id,
      status: 'pending'
    });

    const bookWithDetails = {
      ...book.toObject(),
      activeLoans,
      pendingReservations,
      status: book.availableCopies === 0 ? 'out-of-stock' : 
              book.availableCopies <= 2 ? 'low-stock' : 'available'
    };

    res.json(bookWithDetails);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/librarian/books/:id/status - Update book status
export async function updateBookStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action, notes, affectedCopies = 1 } = req.body;

    if (!['mark_lost', 'mark_damaged', 'mark_available', 'adjust_copies'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    let updateData: any = { lastUpdated: new Date() };
    let message = '';
    let reservationUpdates = [];

    // Check for pending reservations that might be affected
    const pendingReservations = await Reservation.find({
      bookId: id,
      status: 'pending'
    }).populate('userId', 'name email');

    switch (action) {
      case 'mark_lost':
        // Check if marking as lost would make book unavailable for pending reservations
        if (book.availableCopies - affectedCopies <= 0 && pendingReservations.length > 0) {
          return res.status(400).json({ 
            message: `Cannot mark ${affectedCopies} copy(ies) as lost. There are ${pendingReservations.length} pending reservation(s) for this book.`,
            reservations: pendingReservations
          });
        }
        
        updateData.availableCopies = Math.max(0, book.availableCopies - affectedCopies);
        updateData.totalCopies = Math.max(0, book.totalCopies - affectedCopies);
        message = `Marked ${affectedCopies} copy(ies) as lost`;
        break;
        
      case 'mark_damaged':
        // Check if marking as damaged would make book unavailable for pending reservations
        if (book.availableCopies - affectedCopies <= 0 && pendingReservations.length > 0) {
          return res.status(400).json({ 
            message: `Cannot mark ${affectedCopies} copy(ies) as damaged. There are ${pendingReservations.length} pending reservation(s) for this book.`,
            reservations: pendingReservations
          });
        }
        
        updateData.availableCopies = Math.max(0, book.availableCopies - affectedCopies);
        message = `Marked ${affectedCopies} copy(ies) as damaged`;
        break;
        
      case 'mark_available':
        updateData.availableCopies = book.availableCopies + affectedCopies;
        message = `Marked ${affectedCopies} copy(ies) as available`;
        
        // If book becomes available, check if any pending reservations can be marked as ready
        if (pendingReservations.length > 0) {
          const readyReservations = pendingReservations.slice(0, Math.min(affectedCopies, pendingReservations.length));
          
          for (const reservation of readyReservations) {
            reservation.status = 'ready';
            reservation.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            reservation.notes = 'Automatically marked ready - book became available';
            await reservation.save();
            
            // Create notification
            await Notification.create({
              userId: reservation.userId._id,
              type: 'reservation_ready',
              title: 'Book Ready for Pickup',
              message: `Your reserved book "${book.title}" is now ready for pickup. Please collect it within 7 days.`,
              relatedReservationId: reservation._id
            });
            
            reservationUpdates.push(reservation);
          }
          
          if (readyReservations.length > 0) {
            message += `. ${readyReservations.length} reservation(s) automatically marked as ready.`;
          }
        }
        break;
        
      case 'adjust_copies':
        // Check if adjustment would make available copies negative
        if (affectedCopies < book.totalCopies - book.availableCopies) {
          return res.status(400).json({ 
            message: `Cannot reduce total copies to ${affectedCopies}. There are ${book.totalCopies - book.availableCopies} copies currently on loan.`
          });
        }
        
        // Check if adjustment would affect pending reservations
        if (affectedCopies < book.availableCopies && pendingReservations.length > 0) {
          return res.status(400).json({ 
            message: `Cannot reduce copies to ${affectedCopies}. There are ${pendingReservations.length} pending reservation(s) for this book.`,
            reservations: pendingReservations
          });
        }
        
        updateData.totalCopies = affectedCopies;
        updateData.availableCopies = Math.min(book.availableCopies, affectedCopies);
        message = `Adjusted total copies to ${affectedCopies}`;
        break;
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      message,
      book: updatedBook,
      reservationUpdates
    });
  } catch (error) {
    console.error('Update book status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/librarian/notifications - Send notification to user
export async function sendNotification(req: Request, res: Response) {
  try {
    const { userId, type, title, message } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['overdue', 'reservation_ready', 'fine', 'general', 'book_reminder'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      sent: true,
      sentDate: new Date()
    });

    res.status(201).json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 