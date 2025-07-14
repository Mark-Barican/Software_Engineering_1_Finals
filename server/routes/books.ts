import { Request, Response } from "express";
import { Book } from "./admin";
import { Loan, Reservation } from "./librarian";

// GET /api/books/:id - Get book details
export async function getBookDetails(req: Request, res: Response) {
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
    console.error('Get book details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/books - Get all books with pagination
export async function getAllBooks(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, genre, available } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let query: any = {};
    
    if (genre && genre !== 'all') {
      query.genre = { $regex: genre, $options: 'i' };
    }
    
    if (available === 'true') {
      query.availableCopies = { $gt: 0 };
    }

    const books = await Book.find(query)
      .sort({ title: 1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .select('title author isbn genre publishedYear publisher description coverImage totalCopies availableCopies categories language pages location addedDate');

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
    console.error('Get all books error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 