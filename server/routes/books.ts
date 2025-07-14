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
    const { 
      page = 1, 
      limit = 20, 
      genre, 
      available,
      language = '',
      filter = 'all',
      sortBy = 'title',
      refineQuery = '',
      title = ''
    } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let query: any = {};
    let sort: any = { title: 1 };
    
    // Handle multiple genres
    const genres = Array.isArray(genre) ? genre : (genre ? [genre] : []);
    if (genres.length > 0 && !genres.includes('all')) {
      const genreConditions = genres.map(g => ({ genre: { $regex: g, $options: 'i' } }));
      if (genreConditions.length === 1) {
        query.genre = genreConditions[0].genre;
      } else {
        query.$or = genreConditions;
      }
    }
    
    // Title filter (specific search by title)
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    
    // Language filter
    if (language && language !== 'Any Language' && language !== 'All Languages') {
      query.language = { $regex: language, $options: 'i' };
    }
    
    // Refine query (search within results)
    if (refineQuery) {
      const refineSearchTerms = [
        { title: { $regex: refineQuery, $options: 'i' } },
        { author: { $regex: refineQuery, $options: 'i' } },
        { categories: { $in: [new RegExp(refineQuery as string, 'i')] } },
        { description: { $regex: refineQuery, $options: 'i' } }
      ];
      
      if (query.$or) {
        // Combine existing genre filters with refine search using AND
        query.$and = [
          { $or: query.$or },
          { $or: refineSearchTerms }
        ];
        delete query.$or;
      } else {
        query.$or = refineSearchTerms;
      }
    }
    
    // Apply availability filter (backward compatibility)
    if (available === 'true') {
      query.availableCopies = { $gt: 0 };
    }
    
    // Apply access type filters
    switch (filter) {
      case 'available':
        query.availableCopies = { $gt: 0 };
        break;
      case 'new':
        query.addedDate = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'download':
        query.hasDownload = true;
        break;
      case 'online':
        query.hasReadOnline = true;
        break;
      case 'popular':
        // Will be handled in sorting
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'title':
        sort = { title: 1 };
        break;
      case 'author':
        sort = { author: 1 };
        break;
      case 'date':
        sort = { publishedYear: -1 };
        break;
      case 'relevance':
      default:
        sort = { title: 1 };
        break;
    }
    
    // Override sort for specific filters
    if (filter === 'new') {
      sort = { addedDate: -1 };
    } else if (filter === 'popular') {
      sort = { totalCopies: -1 };
    }

    console.log('Books API query:', JSON.stringify(query, null, 2));
    console.log('Books API sort:', sort);

    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string))
      .select('title author isbn genre publishedYear publisher description coverImage totalCopies availableCopies categories language pages location addedDate hasDownload hasReadOnline');

    const total = await Book.countDocuments(query);

    res.json({
      books,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      },
      appliedFilters: {
        genres: genres,
        language: language !== 'Any Language' ? language : null,
        accessType: filter !== 'all' ? filter : null,
        sortBy: sortBy
      }
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 