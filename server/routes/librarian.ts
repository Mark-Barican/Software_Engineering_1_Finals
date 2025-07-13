import { Request, Response } from "express";
import { User, requireLibrarian } from "./auth";
import { Book } from "./admin";
import mongoose from "mongoose";

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
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
          currentLoans: activeLoans,
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

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book is not available for loan' });
    }

    // Check if user already has this book
    const existingLoan = await Loan.findOne({
      userId,
      bookId,
      status: 'active'
    });

    if (existingLoan) {
      return res.status(400).json({ message: 'User already has this book on loan' });
    }

    // Create loan record
    const loan = await Loan.create({
      userId,
      bookId,
      issuedBy: librarian._id,
      dueDate: calculateDueDate(loanDays)
    });

    // Update book availability
    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableCopies: -1 }
    });

    // Populate loan with user and book details
    const populatedLoan = await Loan.findById(loan._id)
      .populate('userId', 'name email')
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
        { email: { $regex: q, $options: 'i' } }
      ],
      role: { $ne: 'admin' } // Don't show admin users
    })
      .select('name email role createdAt lastLogin')
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

// PUT /api/librarian/reservations/:id - Update reservation status
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

    // Update reservation
    reservation.status = status;
    if (notes) reservation.notes = notes;
    
    if (status === 'ready') {
      reservation.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days to pick up
    }
    
    await reservation.save();

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

    switch (action) {
      case 'mark_lost':
        updateData.availableCopies = Math.max(0, book.availableCopies - affectedCopies);
        updateData.totalCopies = Math.max(0, book.totalCopies - affectedCopies);
        message = `Marked ${affectedCopies} copy(ies) as lost`;
        break;
      case 'mark_damaged':
        updateData.availableCopies = Math.max(0, book.availableCopies - affectedCopies);
        message = `Marked ${affectedCopies} copy(ies) as damaged`;
        break;
      case 'mark_available':
        updateData.availableCopies = book.availableCopies + affectedCopies;
        message = `Marked ${affectedCopies} copy(ies) as available`;
        break;
      case 'adjust_copies':
        updateData.totalCopies = affectedCopies;
        updateData.availableCopies = Math.min(book.availableCopies, affectedCopies);
        message = `Adjusted total copies to ${affectedCopies}`;
        break;
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      message,
      book: updatedBook
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