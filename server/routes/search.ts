import { Request, Response } from "express";
import { Book } from "./admin";
import { verifyTokenWithSession } from "./auth";

// GET /api/search - Search books with filters
export async function searchBooks(req: Request, res: Response) {
  try {
    const {
      q = '', // Basic search query
      refineQuery = '', // Search within results
      title = '',
      author = '',
      genre = '', // Can be array for multiple genres
      language = '',
      fromDate = '',
      toDate = '',
      isbn = '',
      filter = 'all', // all, available, new, popular, download, online
      sortBy = 'relevance', // relevance, title, author, date
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query: any = {};
    let sort: any = { title: 1 };

    // Build search query
    const searchTerms = [];
    
    // Main search query
    if (q) {
      searchTerms.push(
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { categories: { $in: [new RegExp(q as string, 'i')] } },
        { genre: { $regex: q, $options: 'i' } },
        { isbn: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      );
    }

    // Refine search query (search within results)
    if (refineQuery) {
      searchTerms.push(
        { title: { $regex: refineQuery, $options: 'i' } },
        { author: { $regex: refineQuery, $options: 'i' } },
        { categories: { $in: [new RegExp(refineQuery as string, 'i')] } },
        { description: { $regex: refineQuery, $options: 'i' } }
      );
    }

    if (title) {
      // Title search should be more specific and have higher priority
      query.title = { $regex: title, $options: 'i' };
    }

    if (author) {
      searchTerms.push({ author: { $regex: author, $options: 'i' } });
    }

    // Handle multiple genres
    const genres = Array.isArray(genre) ? genre : (genre ? [genre] : []);
    if (genres.length > 0 && !genres.includes('All fields')) {
      const genreConditions = genres.map(g => ({ genre: { $regex: g, $options: 'i' } }));
      if (genreConditions.length === 1) {
        query.genre = genreConditions[0].genre;
      } else {
        query.$or = query.$or ? query.$or.concat(genreConditions) : genreConditions;
      }
    }

    if (language && language !== 'All Languages' && language !== 'Any Language') {
      query.language = { $regex: language, $options: 'i' };
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
      query.publishedYear = dateQuery;
    }

    // Combine search terms with AND logic if both main query and refine query exist
    if (searchTerms.length > 0) {
      if (q && refineQuery) {
        // Both main search and refine search - combine with AND
        const mainSearchTerms = [];
        const refineSearchTerms = [];
        
        if (q) {
          mainSearchTerms.push(
            { title: { $regex: q, $options: 'i' } },
            { author: { $regex: q, $options: 'i' } },
            { categories: { $in: [new RegExp(q as string, 'i')] } },
            { genre: { $regex: q, $options: 'i' } },
            { isbn: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          );
        }
        
        if (refineQuery) {
          refineSearchTerms.push(
            { title: { $regex: refineQuery, $options: 'i' } },
            { author: { $regex: refineQuery, $options: 'i' } },
            { categories: { $in: [new RegExp(refineQuery as string, 'i')] } },
            { description: { $regex: refineQuery, $options: 'i' } }
          );
        }
        
        query.$and = [
          { $or: mainSearchTerms },
          { $or: refineSearchTerms }
        ];
      } else {
        // Only one type of search - use OR
        query.$or = query.$or ? query.$or.concat(searchTerms) : searchTerms;
      }
    }

    // Apply filters
    switch (filter) {
      case 'available':
        query.availableCopies = { $gt: 0 };
        break;
      case 'new':
        query.addedDate = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'popular':
        // Keep existing sort logic
        break;
      case 'download':
        query.hasDownload = true;
        break;
      case 'online':
        query.hasReadOnline = true;
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
        // For relevance, prioritize exact matches in title, then author
        if (q || refineQuery) {
          sort = { title: 1 }; // Could be enhanced with text score
        } else {
          sort = { title: 1 };
        }
        break;
    }

    // Override sort for specific filters
    if (filter === 'new') {
      sort = { addedDate: -1 };
    } else if (filter === 'popular') {
      sort = { totalCopies: -1 };
    }

    console.log('Search query:', JSON.stringify(query, null, 2));
    console.log('Sort:', sort);

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
      query: req.query,
      appliedFilters: {
        genres: genres,
        language: language !== 'Any Language' ? language : null,
        accessType: filter !== 'all' ? filter : null,
        sortBy: sortBy
      }
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