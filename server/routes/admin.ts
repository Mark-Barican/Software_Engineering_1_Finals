import { Request, Response } from "express";
import { User, requireAdmin } from "./auth";
import mongoose from "mongoose";
import { logActivity } from '../utils/activityLogger';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import bcrypt from 'bcrypt';
import { Settings } from "../models/Settings";

// Book schema for admin management
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true, required: true },
  publisher: { type: String, required: true },
  publishedYear: { type: Number, required: true },
  genre: { type: String, required: true },
  categories: [String],
  description: String,
  coverImage: String,
  totalCopies: { type: Number, default: 1, required: true },
  availableCopies: { type: Number, default: 1 },
  location: { type: String, required: true }, // e.g., "Shelf A3, Section B"
  language: { type: String, default: "English" },
  pages: Number,
  hasDownload: { type: Boolean, default: false },
  hasReadOnline: { type: Boolean, default: false },
  addedDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export const Book = mongoose.model("Book", bookSchema, "books");

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/admin/stats - Get dashboard statistics
export async function getAdminStats(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    
    // Using a placeholder for active loans and reservations as it might involve a separate collection
    const activeLoans = 0; 
    const pendingReservations = 0;

    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    const booksAddedThisMonth = await Book.countDocuments({
      addedDate: { $gte: new Date(new Date().setDate(1)) }
    });
    
    // Get database size
    const db = mongoose.connection.db;
    const stats = await db.stats();
    const databaseSize = (stats.storageSize / (1024 * 1024)).toFixed(2); // in MB

    res.json({
      totalUsers,
      totalBooks,
      activeLoans,
      pendingReservations,
      newUsersToday,
      booksAddedThisMonth,
      databaseSize,
      systemStatus: 'healthy'
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
}

// POST /api/admin/users/bulk - Bulk create users from a CSV file
export async function bulkCreateUsers(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const results: any[] = [];
  const errors: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  const stream = new Readable();
  stream.push(req.file.buffer);
  stream.push(null);

  stream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      for (const user of results) {
        try {
          // Validate required fields
          if (!user.email || !user.password || !user.name || !user.role) {
            throw new Error('Missing required fields (name, email, password, role).');
          }

          // Validate role
          const validRoles = ['user', 'librarian', 'admin'];
          if (!validRoles.includes(user.role)) {
            throw new Error(`Invalid role: ${user.role}. Must be one of user, librarian, admin.`);
          }

          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email });
          if (existingUser) {
            throw new Error(`User with email ${user.email} already exists.`);
          }

          // Hash password and create user
          const hashedPassword = await bcrypt.hash(user.password, 10);
          await User.create({
            ...user,
            password: hashedPassword,
          });
          successCount++;
        } catch (error: any) {
          errors.push({ user: user.email || 'unknown', message: error.message });
          errorCount++;
        }
      }

      res.status(200).json({
        message: 'Bulk import finished.',
        successCount,
        errorCount,
        errors,
      });
    });
}

// GET /api/admin/users - Get all users for admin management
export async function getUsers(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-passwordHash -resetToken -resetTokenExpiry -sessions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    // Import Loan and Fine models to get student statistics
    const { Loan, Fine, Reservation } = require('./librarian');

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const profilePicture = user.profilePicture && user.profilePicture.data 
          ? {
              data: user.profilePicture.data.toString('base64'),
              contentType: user.profilePicture.contentType,
              fileName: user.profilePicture.fileName,
              uploadDate: user.profilePicture.uploadDate
            }
          : undefined;

        let additionalInfo = {};
        
        // For students (users), get borrowing statistics
        if (user.role === 'user') {
          const currentLoans = await Loan.countDocuments({ 
            userId: user._id, 
            status: 'active' 
          });
          
          const totalBorrowed = await Loan.countDocuments({ 
            userId: user._id 
          });
          
          const outstandingFines = await Fine.aggregate([
            { $match: { userId: user._id, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]);
          
          const reservations = await Reservation.countDocuments({
            userId: user._id,
            status: { $in: ['pending', 'ready'] }
          });
          
          additionalInfo = {
            currentBorrowedBooks: currentLoans,
            totalBooksBorrowed: totalBorrowed,
            outstandingFines: outstandingFines[0]?.total || 0,
            numberOfReservations: reservations
          };
        }
        
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          userId: user.userId || `${user.role.toUpperCase()}-${user._id.toString().slice(-6)}`,
          contactNumber: user.contactNumber || '+1-555-0123',
          department: user.department || (user.role === 'user' ? 'Computer Science - Year 3' : 
                      user.role === 'librarian' ? 'Reference Section' : 'Administration'),
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          accountStatus: user.accountStatus || 'active',
          // profilePicture: undefined, // Temporarily removed for debugging
          currentBorrowedBooks: 0, 
          totalBooksBorrowed: 0,
          outstandingFines: 0,
          numberOfReservations: 0,
          ...additionalInfo
        };
      })
    );

    res.json({
      users: usersWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/admin/users - Create a new user
export async function createUser(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!['admin', 'librarian', 'user'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Import the generateUserId function from auth
    const { generateUserId } = require('./auth');
    
    // Generate user ID based on role
    const userId = await generateUserId(role, department);
    
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      userId,
      department: department || (role === 'user' ? 'Computer Science' : 'General')
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        userId: newUser.userId,
        department: newUser.department,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/admin/users/:id - Update a user
export async function updateUser(req: Request, res: Response) {
  try {
    const adminUser = (req as any).user;
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const { name, email, role, userId, department } = req.body;

    if (!['admin', 'librarian', 'user'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admins from editing other admins
    if (user.role === 'admin' && adminUser._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Admins cannot edit other admins' profiles." });
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" });
      }
    }

    // Prevent changing user ID - it's used throughout the system
    if (userId && userId !== user.userId) {
      return res.status(400).json({ 
        message: "User ID cannot be modified. It is used throughout the system for tracking loans, fines, and reservations. For major corrections, consider creating a new account." 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, role, userId, department },
      { new: true }
    ).select('-passwordHash -resetToken -resetTokenExpiry -sessions');

    res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        userId: updatedUser.userId,
        department: updatedUser.department,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/admin/users/:id - Delete a user
export async function deleteUser(req: Request, res: Response) {
  try {
    const adminUser = (req as any).user;
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;

    // Prevent admins from deleting themselves
    if (adminUser._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Import Loan, Reservation, Fine models
    const { Loan, Reservation, Fine } = require('./librarian');

    // Check for active loans
    const activeLoans = await Loan.countDocuments({ userId: id, status: 'active' });
    // Check for active reservations
    const activeReservations = await Reservation.countDocuments({ userId: id, status: { $in: ['pending', 'ready'] } });
    // Check for unpaid fines
    const unpaidFines = await Fine.countDocuments({ userId: id, status: { $in: ['pending', 'partial'] } });

    if (activeLoans > 0 || activeReservations > 0 || unpaidFines > 0) {
      let issues = [];
      if (activeLoans > 0) issues.push(`${activeLoans} active loan(s)`);
      if (activeReservations > 0) issues.push(`${activeReservations} active reservation(s)`);
      if (unpaidFines > 0) issues.push(`${unpaidFines} unpaid fine(s)`);
      return res.status(400).json({ message: `Cannot delete user. Please resolve: ${issues.join(', ')}.` });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/admin/books - Get all books for admin management
export async function getBooks(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ addedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments();

    const booksWithStatus = books.map(book => ({
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
      location: book.location,
      language: book.language,
      pages: book.pages,
      hasDownload: book.hasDownload,
      hasReadOnline: book.hasReadOnline,
      categories: book.categories,
      addedDate: book.addedDate,
      status: book.availableCopies === 0 ? 'out-of-stock' : 
              book.availableCopies <= 2 ? 'low-stock' : 'available'
    }));

    res.json({
      books: booksWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/admin/books - Create a new book
export async function createBook(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

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

    // Log the book addition activity
    await logActivity('book_added', `New book added: "${newBook.title}"`, user._id, newBook._id.toString());

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

// PUT /api/admin/books/:id - Update a book
export async function updateBook(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

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

    // Import Reservation model
    const { Reservation } = require('./librarian');

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

// DELETE /api/admin/books/:id - Delete a book
export async function deleteBook(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Import Reservation and Loan models
    const { Reservation, Loan } = require('./librarian');

    // Check for active reservations
    const activeReservations = await Reservation.find({
      bookId: id,
      status: { $in: ['pending', 'ready'] }
    }).populate('userId', 'name email');

    // Check for active loans
    const activeLoans = await Loan.countDocuments({ bookId: id, status: 'active' });

    if (activeReservations.length > 0 || activeLoans > 0) {
      let issues = [];
      if (activeReservations.length > 0) issues.push(`${activeReservations.length} active reservation(s)`);
      if (activeLoans > 0) issues.push(`${activeLoans} active loan(s)`);
      return res.status(400).json({ 
        message: `Cannot delete book. Please resolve: ${issues.join(', ')}.`,
        reservations: activeReservations
      });
    }

    // Cancel any remaining reservations (expired, cancelled, etc.)
    await Reservation.updateMany(
      { bookId: id },
      { 
        status: 'cancelled',
        notes: 'Book deleted from library'
      }
    );

    // Delete the book
    await Book.findByIdAndDelete(id);

    res.json({ 
      message: "Book deleted successfully",
      cancelledReservations: activeReservations.length
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 

// GET /api/admin/settings - Get system settings
export async function getSystemSettings(req: Request, res: Response) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({}); // create with defaults
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
}

// PUT /api/admin/settings - Update system settings
export async function updateSystemSettings(req: Request, res: Response) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const oldSettings = JSON.stringify(settings.toObject());
    Object.assign(settings, req.body);
    await settings.save();

    // Log the activity
    const userId = (req.user as any)?._id;
    if (userId) {
      await logActivity('settings_changed', `System settings were updated.`, userId);
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings.' });
  }
} 