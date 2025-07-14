import { Request, Response } from "express";
import { Book } from "./admin";
import { verifyTokenWithSession } from "./auth";

// GET /api/search - Search books with filters
export async function searchBooks(req: Request, res: Response) {
  try {
    const {
      q = '', // Basic search query
      title = '',
      author = '',
      genre = '',
      language = '',
      fromDate = '',
      toDate = '',
      isbn = '',
      filter = 'all', // all, available, new, popular
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query: any = {};
    let sort: any = { title: 1 };

    // Build search query
    const searchTerms = [];
    
    if (q) {
      searchTerms.push(
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { categories: { $in: [new RegExp(q as string, 'i')] } },
        { genre: { $regex: q, $options: 'i' } },
        { isbn: { $regex: q, $options: 'i' } }
      );
    }

    if (title) {
      searchTerms.push({ title: { $regex: title, $options: 'i' } });
    }

    if (author) {
      searchTerms.push({ author: { $regex: author, $options: 'i' } });
    }

    if (genre && genre !== 'All fields') {
      searchTerms.push({ genre: { $regex: genre, $options: 'i' } });
    }

    if (language && language !== 'All Languages') {
      searchTerms.push({ language: { $regex: language, $options: 'i' } });
    }

    if (isbn) {
      searchTerms.push({ isbn: { $regex: isbn, $options: 'i' } });
    }

    // Date range filter
    if (fromDate || toDate) {
      const dateQuery: any = {};
      if (fromDate) {
        dateQuery.$gte = parseInt(fromDate as string);
      }
      if (toDate) {
        dateQuery.$lte = parseInt(toDate as string);
      }
      searchTerms.push({ publishedYear: dateQuery });
    }

    // Combine search terms
    if (searchTerms.length > 0) {
      query.$or = searchTerms;
    }

    // Apply filters
    switch (filter) {
      case 'available':
        query.availableCopies = { $gt: 0 };
        break;
      case 'new':
        query.addedDate = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        sort = { addedDate: -1 };
        break;
      case 'popular':
        sort = { totalCopies: -1 };
        break;
    }

    const books = await Book.find(query)
      .sort(sort)
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
      },
      query: req.query
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/search/suggestions - Get search suggestions
export async function getSearchSuggestions(req: Request, res: Response) {
  try {
    const { q } = req.query;
    
    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await Book.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { author: { $regex: q, $options: 'i' } },
            { genre: { $regex: q, $options: 'i' } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          titles: { $addToSet: '$title' },
          authors: { $addToSet: '$author' },
          genres: { $addToSet: '$genre' }
        }
      },
      {
        $project: {
          suggestions: {
            $slice: [
              {
                $concatArrays: [
                  { $slice: ['$titles', 5] },
                  { $slice: ['$authors', 3] },
                  { $slice: ['$genres', 2] }
                ]
              },
              10
            ]
          }
        }
      }
    ]);

    res.json({
      suggestions: suggestions[0]?.suggestions || []
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 