import { Request, Response } from "express";
import { User } from "./auth";
import { Book } from "./admin";
import { Loan, Fine, Reservation, Notification } from "./librarian";
import mongoose from "mongoose";

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['general', 'service', 'book_request', 'complaint', 'suggestion'], 
    default: 'general' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'resolved'], 
    default: 'pending' 
  },
  response: String,
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: Date
}, { timestamps: true });

// Book Suggestion Schema
const bookSuggestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  reason: String,
  isbn: String,
  publisher: String,
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'approved', 'rejected', 'purchased'], 
    default: 'pending' 
  },
  reviewNotes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);
const BookSuggestion = mongoose.model("BookSuggestion", bookSuggestionSchema);

// GET /api/student/stats - Get student dashboard statistics
export async function getStudentStats(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    // Get current loans
    const currentLoans = await Loan.countDocuments({ 
      userId, 
      status: 'active' 
    });
    
    // Get total borrowed books
    const totalBorrowed = await Loan.countDocuments({ userId });
    
    // Get outstanding fines
    const outstandingFines = await Fine.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get active reservations
    const activeReservations = await Reservation.countDocuments({
      userId,
      status: { $in: ['pending', 'ready'] }
    });
    
    // Standard borrowing limit
    const borrowingLimit = 5;
    const availableToLoan = Math.max(0, borrowingLimit - currentLoans);
    
    const stats = {
      currentLoans,
      totalBorrowed,
      outstandingFines: outstandingFines[0]?.total || 0,
      activeReservations,
      borrowingLimit,
      availableToLoan
    };

    res.json(stats);
  } catch (error) {
    console.error('Student stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/student/books - Browse and search books
export async function getBooksForStudent(req: Request, res: Response) {
  try {
    const { search = '', filter = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query: any = {};
    let sort: any = { title: 1 };

    // Search functionality
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { categories: { $in: [new RegExp(search as string, 'i')] } },
          { genre: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Filter functionality
    switch (filter) {
      case 'available':
        query.availableCopies = { $gt: 0 };
        break;
      case 'new':
        // Books added in the last 30 days
        query.addedDate = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        sort = { addedDate: -1 };
        break;
      case 'popular':
        // This would require loan statistics - for now, sort by total copies as a proxy
        sort = { totalCopies: -1 };
        break;
    }

    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Book.countDocuments(query);

    res.json({
      books,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get books for student error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/student/loans - Get student's loans
export async function getStudentLoans(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;

    let query: any = { userId };
    if (status) {
      query.status = status;
    }

    const loans = await Loan.find(query)
      .populate('bookId', 'title author isbn genre')
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 });

    res.json(loans);
  } catch (error) {
    console.error('Get student loans error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/student/loans/:id/renew - Renew a loan
export async function renewLoan(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const loan = await Loan.findOne({ _id: id, userId, status: 'active' });
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found or not active' });
    }

    if (loan.renewalCount >= loan.maxRenewals) {
      return res.status(400).json({ message: 'Maximum renewals reached' });
    }

    // Check if loan is overdue
    if (new Date() > loan.dueDate) {
      return res.status(400).json({ message: 'Cannot renew overdue books. Please contact the library.' });
    }

    // Extend due date by 14 days
    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);

    await Loan.findByIdAndUpdate(id, {
      dueDate: newDueDate,
      $inc: { renewalCount: 1 }
    });

    res.json({ message: 'Loan renewed successfully', newDueDate });
  } catch (error) {
    console.error('Renew loan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/student/reservations - Get student's reservations
export async function getStudentReservations(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    const reservations = await Reservation.find({ userId })
      .populate('bookId', 'title author isbn genre')
      .sort({ requestDate: -1 });

    res.json(reservations);
  } catch (error) {
    console.error('Get student reservations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/student/reservations - Create a new reservation
export async function createReservation(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required' });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if book is available
    if (book.availableCopies > 0) {
      return res.status(400).json({ message: 'Book is currently available. Visit the library to borrow it.' });
    }

    // Check if user already has a reservation for this book
    const existingReservation = await Reservation.findOne({
      userId,
      bookId,
      status: { $in: ['pending', 'ready'] }
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'You already have a reservation for this book' });
    }

    // Get next priority number
    const lastReservation = await Reservation.findOne({ bookId })
      .sort({ priority: -1 });
    
    const priority = (lastReservation?.priority || 0) + 1;

    const reservation = await Reservation.create({
      userId,
      bookId,
      priority,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/student/reservations/:id - Cancel a reservation
export async function cancelReservation(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const reservation = await Reservation.findOne({ _id: id, userId });
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status === 'fulfilled') {
      return res.status(400).json({ message: 'Cannot cancel fulfilled reservation' });
    }

    await Reservation.findByIdAndUpdate(id, { status: 'cancelled' });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/student/fines - Get student's fines
export async function getStudentFines(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    const fines = await Fine.find({ userId })
      .populate('loanId')
      .sort({ dateIssued: -1 });

    res.json(fines);
  } catch (error) {
    console.error('Get student fines error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/student/notifications - Get student's notifications
export async function getStudentNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Get student notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/student/notifications/:id/read - Mark notification as read
export async function markNotificationAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true, readDate: new Date() }
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/student/feedback - Submit feedback
export async function submitFeedback(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { message, type = 'general' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Feedback message is required' });
    }

    const feedback = await Feedback.create({
      userId,
      message: message.trim(),
      type
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/student/suggestions - Submit book suggestion
export async function submitBookSuggestion(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { title, author, reason, isbn, publisher } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    // Check if book already exists
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        return res.status(400).json({ message: 'This book already exists in our collection' });
      }
    }

    const suggestion = await BookSuggestion.create({
      userId,
      title: title.trim(),
      author: author.trim(),
      reason: reason?.trim(),
      isbn,
      publisher
    });

    res.status(201).json({
      message: 'Book suggestion submitted successfully',
      suggestion
    });
  } catch (error) {
    console.error('Submit book suggestion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/student/profile - Get student profile
export async function getStudentProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    const user = await User.findById(userId)
      .select('-passwordHash -resetToken -resetTokenExpiry -sessions');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional statistics
    const currentLoans = await Loan.countDocuments({ userId, status: 'active' });
    const totalBorrowed = await Loan.countDocuments({ userId });
    const outstandingFines = await Fine.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const profile = {
      ...user.toObject(),
      currentLoans,
      totalBorrowed,
      outstandingFines: outstandingFines[0]?.total || 0
    };

    res.json(profile);
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Helper function to create notifications for students
async function createNotificationForUser(
  userId: string, 
  type: string, 
  title: string, 
  message: string,
  relatedLoanId?: string,
  relatedReservationId?: string,
  relatedFineId?: string
) {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      relatedLoanId,
      relatedReservationId,
      relatedFineId
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Background function to check for overdue books and send notifications
async function checkOverdueAndSendReminders() {
  try {
    const overdueLoans = await Loan.find({
      status: 'active',
      dueDate: { $lt: new Date() }
    }).populate('userId', 'name email');

    for (const loan of overdueLoans) {
      // Check if notification already sent
      const existingNotification = await Notification.findOne({
        userId: loan.userId,
        relatedLoanId: loan._id,
        type: 'overdue'
      });

      if (!existingNotification) {
        await createNotificationForUser(
          loan.userId._id.toString(),
          'overdue',
          'Overdue Book Reminder',
          `Your book "${(loan.bookId as any).title}" is overdue. Please return it as soon as possible to avoid additional fines.`,
          loan._id.toString()
        );
      }
    }
  } catch (error) {
    console.error('Error checking overdue books:', error);
  }
}

// Export models and functions
export { 
  Feedback, 
  BookSuggestion,
  createNotificationForUser,
  checkOverdueAndSendReminders
}; 