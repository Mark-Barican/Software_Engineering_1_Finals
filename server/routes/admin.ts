import { Request, Response } from "express";
import { User, requireAdmin } from "./auth";
import mongoose from "mongoose";

// Book schema for admin management
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  isbn: { type: String, unique: true },
  genre: String,
  publishedYear: Number,
  publisher: String,
  description: String,
  coverImage: String,
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  categories: [String],
  language: { type: String, default: "English" },
  pages: Number,
  hasDownload: { type: Boolean, default: false },
  hasReadOnline: { type: Boolean, default: false },
  addedDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);

// GET /api/admin/stats - Get dashboard statistics
export async function getAdminStats(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const booksAddedThisMonth = await Book.countDocuments({
      addedDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Get real loan and reservation data
    const { Loan, Reservation } = require('./librarian');
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });

    const stats = {
      totalUsers,
      totalBooks,
      activeLoans,
      pendingReservations,
      newUsersToday,
      booksAddedThisMonth,
      systemStatus: 'healthy' as const
    };

    res.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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

    const { name, email, password, role } = req.body;

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

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
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
    const { name, email, role } = req.body;

    if (!['admin', 'librarian', 'user'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, role },
      { new: true }
    ).select('-passwordHash -resetToken -resetTokenExpiry -sessions');

    res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
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
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
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
      hasReadOnline
    } = req.body;

    if (!title || !author || !isbn) {
      return res.status(400).json({ message: "Title, author, and ISBN are required" });
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
      hasReadOnline: hasReadOnline || false
    });

    res.status(201).json({
      message: "Book created successfully",
      book: {
        id: newBook._id,
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        genre: newBook.genre,
        totalCopies: newBook.totalCopies,
        availableCopies: newBook.availableCopies,
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
        totalCopies: updatedBook.totalCopies,
        availableCopies: updatedBook.availableCopies,
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

    await Book.findByIdAndDelete(id);

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Export Book model for use in other modules
export { Book }; 