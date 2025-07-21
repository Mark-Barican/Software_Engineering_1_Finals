import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import BookCard from "../components/BookCard";
import BookViewModal from "../components/BookViewModal";
import {
  Search,
  ChevronDown,
  User,
  HelpCircle,
  Bookmark,
  Quote,
  BookOpen,
  ChevronUp,
  Eye,
  Calendar,
  MapPin,
  BookText,
  Grid,
  List,
  Filter,
  Star,
  TrendingUp,
  Download,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { saveRecentSearch } from "../lib/utils";

// Book interface
interface Book {
  _id: string;
  title: string;
  author: string;
  coverImage?: string;
  description?: string;
  genre: string;
  publishedYear: number;
  publisher: string;
  isbn: string;
  availableCopies: number;
  totalCopies: number;
  status: string;
  location?: string;
}

interface SearchResponse {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const query = searchParams.get("q") || "";
  const [titleSearch, setTitleSearch] = useState(""); // New title search state
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Subtle loading for search
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isBookViewModalOpen, setIsBookViewModalOpen] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [expandedSections, setExpandedSections] = useState({
    searchWithin: true,
    contentType: true,
    language: false,
    accessType: true,
  });
  const [sortBy, setSortBy] = useState("relevance");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [contentTypes, setContentTypes] = useState({
    fiction: false,
    nonFiction: false,
    scienceFiction: false,
    mystery: false,
    romance: false,
    biography: false,
    history: false,
    science: false,
    business: false,
    youngAdult: false,
    children: false,
    poetry: false,
  });
  const [language, setLanguage] = useState("Any Language");
  const [accessType, setAccessType] = useState("everything");

  // Debounce the title search to avoid excessive API calls
  const debouncedTitleSearch = useDebounce(titleSearch, 300);

  // Advanced search params
  const advParams = {
    title: searchParams.get("title"),
    author: searchParams.get("author"),
    genre: searchParams.getAll("genre"),
    language: searchParams.get("language"),
    fromDate: searchParams.get("fromDate"),
    toDate: searchParams.get("toDate"),
    journalTitle: searchParams.get("journalTitle"),
    isbn: searchParams.get("isbn"),
    filter: searchParams.getAll("filter"),
  };

  useEffect(() => {
    // This hook syncs the URL search params to the component's state on initial load.
    const titleFromUrl = searchParams.get("title") || searchParams.get("q") || "";
    const genresFromUrl = searchParams.getAll("genre");
    const languageFromUrl = searchParams.get("language") || "Any Language";
    const accessTypeFromUrl = searchParams.getAll("filter").find(f => ["available", "download", "online"].includes(f)) || "everything";
    
    setTitleSearch(titleFromUrl);
    setLanguage(languageFromUrl);
    setAccessType(accessTypeFromUrl);

    if (genresFromUrl.length > 0) {
      const newContentTypes = {
        fiction: false, nonFiction: false, scienceFiction: false, mystery: false,
        romance: false, biography: false, history: false, science: false,
        business: false, youngAdult: false, children: false, poetry: false,
      };
      genresFromUrl.forEach(genre => {
        const key = Object.keys(newContentTypes).find(k => k.toLowerCase() === genre.toLowerCase().replace(/\s/g, ''));
        if (key) {
          newContentTypes[key as keyof typeof contentTypes] = true;
        }
      });
      setContentTypes(newContentTypes);
    }
  }, [searchParams]);

  // Load search results
  useEffect(() => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    performSearch(); // Always perform search, even without query
  }, [query, currentPage, sortBy, language, accessType, contentTypes, debouncedTitleSearch]);

  const performSearch = async () => {
    // Use subtle loading for real-time search, full loading for other operations
    if (titleSearch && !query) {
      setIsSearching(true);
    } else {
    setLoading(true);
    }
    
    try {
      const params = new URLSearchParams({
        q: query || titleSearch || '', // Use titleSearch from state as a fallback for q
        page: currentPage.toString(),
        limit: '20'
      });

      // Add title search if provided
      if (debouncedTitleSearch.trim()) {
        params.append('title', debouncedTitleSearch.trim());
      }

      // Add sorting
      if (sortBy && sortBy !== 'relevance') {
        params.append('sortBy', sortBy);
      }

      // Add language filter
      if (language && language !== 'Any Language') {
        params.append('language', language);
      }

      // Add access type filter
      if (accessType && accessType !== 'everything') {
        params.append('filter', accessType);
      }

      // Add content type filters (genres)
      const selectedGenres = Object.entries(contentTypes)
        .filter(([_, selected]) => selected)
        .map(([genre, _]) => {
          // Map frontend filter names to actual genre names
          const genreMap: Record<string, string> = {
            fiction: 'Fiction',
            nonFiction: 'Non-Fiction',
            scienceFiction: 'Science Fiction',
            mystery: 'Mystery',
            romance: 'Romance',
            biography: 'Biography',
            history: 'History',
            science: 'Computer Science',
            business: 'Business',
            youngAdult: 'Young Adult',
            children: 'Children',
            poetry: 'Poetry'
          };
          return genreMap[genre] || genre;
        });

      selectedGenres.forEach(genre => {
        params.append('genre', genre);
      });

      // If no search query, use the general books API to browse all books
      const endpoint = (query || debouncedTitleSearch) ? `/api/search?${params}` : `/api/books?${params}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setBooks(data.books || []);
        setTotalResults(data.pagination?.total || 0);
      } else {
        console.error('Search API error:', response.status);
        setBooks([]);
        setTotalResults(0);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setBooks([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Handle filter changes
  const handleContentTypeChange = (type: keyof typeof contentTypes, checked: boolean) => {
    setContentTypes(prev => ({ ...prev, [type]: checked }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCurrentPage(1);
  };

  const handleAccessTypeChange = (newAccessType: string) => {
    setAccessType(newAccessType);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleTitleSearchChange = (newSearch: string) => {
    setTitleSearch(newSearch);
    setCurrentPage(1);
  };

  const clearTitleSearch = () => {
    setTitleSearch("");
    setCurrentPage(1);
  };

  // Reset all filters
  const resetFilters = () => {
    setContentTypes({
      fiction: false,
      nonFiction: false,
      scienceFiction: false,
      mystery: false,
      romance: false,
      biography: false,
      history: false,
      science: false,
      business: false,
      youngAdult: false,
      children: false,
      poetry: false,
    });
    setLanguage("Any Language");
    setAccessType("everything");
    setSortBy("relevance");
    setTitleSearch("");
    setCurrentPage(1);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLoginClick = () => setIsLoginModalOpen(true);
  const handleRegisterClick = () => setIsRegisterModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);

  const handleBookView = (book: Book) => {
    setSelectedBook(book);
    setIsBookViewModalOpen(true);
  };

  const handleSave = (book: Book) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    toast({
      title: "Saved",
      description: `"${book.title}" has been saved to your library.`,
    });
  };

  const handleCite = (book: Book) => {
    const citation = `${book.author}. "${book.title}." ${book.publisher}, ${book.publishedYear}.`;
    navigator.clipboard.writeText(citation);
    toast({
      title: "Citation Copied",
      description: "Citation has been copied to your clipboard.",
    });
  };

  const handleDownload = (book: Book) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    toast({
      title: "Download Started",
      description: `"${book.title}" is being downloaded.`,
    });
  };

  const renderBookItem = (book: Book, index: number) => (
    <div 
      key={book._id}
      className="bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <div className="w-24 h-32 bg-white border border-gray-200 rounded overflow-hidden">
            {book.coverImage ? (
              <img
                src={`${book.coverImage}?key=${imageKey}`}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gray-100 flex items-center justify-center ${book.coverImage ? 'hidden' : ''}`}>
              <BookText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-lg font-medium text-blue-700 hover:text-blue-800 cursor-pointer truncate mb-1">
                {book.title}
              </h3>
              <p className="text-sm text-gray-600 mb-1">{book.author}</p>
              {book.description && (
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                  {book.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span>ISBN: {book.isbn}</span>
                <span>•</span>
                <span>{book.publisher}</span>
                <span>•</span>
                <span>{book.publishedYear}</span>
                {book.location && (
                  <>
                    <span>•</span>
                    <span>{book.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button
                onClick={() => handleDownload(book)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(book)}
                  className="text-xs px-3 py-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Bookmark className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCite(book)}
                  className="text-xs px-3 py-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Quote className="w-3 h-3 mr-1" />
                  Cite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
              <img src="/logo.jpg" alt="Library Logo" className="w-8 h-8 mr-3" />
              <span className="text-xl font-semibold text-gray-900">Library</span>
          </Link>

            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar - Refine Results */}
        <div className="w-72 bg-orange-50 border-r border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Refine Results
            </h2>

          {/* Content Type */}
            <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
              CONTENT TYPE
            </div>
            <div className="space-y-2">
              {Object.entries({
                fiction: "Fiction (342)",
                nonFiction: "Non-Fiction (298)",
                scienceFiction: "Science Fiction (87)",
                mystery: "Mystery (156)",
                romance: "Romance (124)",
                biography: "Biography (89)",
                history: "History (173)",
                science: "Science (165)",
                business: "Business (112)",
                youngAdult: "Young Adult (94)",
                children: "Children (141)",
                poetry: "Poetry (115)"
              }).map(([key, label]) => (
                <label key={key} className="flex items-center text-sm cursor-pointer hover:bg-orange-100 p-1 rounded transition-colors">
                      <Checkbox
                    className="mr-2" 
                    checked={contentTypes[key as keyof typeof contentTypes]}
                        onCheckedChange={(checked) =>
                      handleContentTypeChange(key as keyof typeof contentTypes, checked as boolean)
                        }
                      />
                  <span className="text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
            </div>

            {/* Language */}
            <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
              LANGUAGE
            </div>
                         <select 
               value={language}
               onChange={(e) => handleLanguageChange(e.target.value)}
               className="w-full p-2 border border-gray-300 rounded text-sm"
             >
               <option value="Any Language">Any Language</option>
               <option value="English">English</option>
               <option value="Spanish">Spanish</option>
               <option value="French">French</option>
               <option value="German">German</option>
               <option value="Italian">Italian</option>
               <option value="Portuguese">Portuguese</option>
               <option value="Chinese">Chinese</option>
               <option value="Japanese">Japanese</option>
               <option value="Korean">Korean</option>
               <option value="Arabic">Arabic</option>
               <option value="Russian">Russian</option>
             </select>
                    </div>

          {/* Access Type */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
              ACCESS TYPE
                    </div>
            <div className="space-y-2">
              <label className="flex items-center text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="access" 
                  value="everything"
                  checked={accessType === "everything"}
                  onChange={(e) => handleAccessTypeChange(e.target.value)}
                  className="mr-2" 
                />
                Everything
              </label>
              <label className="flex items-center text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="access" 
                  value="available"
                  checked={accessType === "available"}
                  onChange={(e) => handleAccessTypeChange(e.target.value)}
                  className="mr-2" 
                />
                Available only
              </label>
              <label className="flex items-center text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="access" 
                  value="download"
                  checked={accessType === "download"}
                  onChange={(e) => handleAccessTypeChange(e.target.value)}
                  className="mr-2" 
                />
                Downloadable
              </label>
              <label className="flex items-center text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="access" 
                  value="online"
                  checked={accessType === "online"}
                  onChange={(e) => handleAccessTypeChange(e.target.value)}
                  className="mr-2" 
                />
                Read online
              </label>
            </div>
            </div>

          {/* Reset Filters Button */}
            <div className="mb-6">
            <Button
              onClick={resetFilters}
              variant="outline"
              className="w-full text-sm border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Reset All Filters
            </Button>
                  </div>
                </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {query ? `Search Results for "${query}"` : 'Browse All Books'}
              </h1>
              <p className="text-gray-600">
                {loading ? (query ? 'Searching...' : 'Loading books...') : 
                 query ? `${totalResults} results found` : `${totalResults} books available`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
              </div>
            </div>
          </div>

          {/* Title Search Bar */}
            <div className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by book title..."
                value={titleSearch}
                onChange={(e) => handleTitleSearchChange(e.target.value)}
                className="pl-12 pr-12 h-12 text-base border-2 border-gray-200 focus:border-orange-400 transition-colors rounded-xl"
              />
              {titleSearch && (
              <button
                  onClick={clearTitleSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                  <X className="w-5 h-5" />
              </button>
              )}
              {isSearching && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
            {titleSearch && (
              <p className="text-sm text-gray-500 mt-2">
                Searching for titles containing "{titleSearch}"
              </p>
            )}
          </div>

          {/* Active Filters Indicator */}
          {(
            advParams.title || advParams.author || advParams.genre.length > 0 || advParams.language || advParams.fromDate || advParams.toDate || advParams.journalTitle || advParams.isbn || advParams.filter.length > 0 || Object.entries(contentTypes).some(([_, selected]) => selected) || language !== "Any Language" || accessType !== "everything" || sortBy !== "relevance"
          ) && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-orange-800">Active Filters:</h3>
                <Button
                  onClick={resetFilters}
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:text-orange-800 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {advParams.title && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    Title: "{advParams.title}"
                  </Badge>
                )}
                {advParams.author && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    Author: "{advParams.author}"
                  </Badge>
                )}
                {advParams.genre && advParams.genre.map((g, i) => (
                  <Badge key={g + i} variant="secondary" className="bg-orange-200 text-orange-800">
                    Genre: {g}
                  </Badge>
                ))}
                {advParams.language && advParams.language !== "Any Language" && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    Language: {advParams.language}
                  </Badge>
                )}
                {advParams.fromDate && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    From: {advParams.fromDate}
                  </Badge>
                )}
                {advParams.toDate && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    To: {advParams.toDate}
                  </Badge>
                )}
                {advParams.journalTitle && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    Journal/Book: "{advParams.journalTitle}"
                  </Badge>
                )}
                {advParams.isbn && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    ISBN: {advParams.isbn}
                  </Badge>
                )}
                {advParams.filter && advParams.filter.map((f, i) => (
                  <Badge key={f + i} variant="secondary" className="bg-orange-200 text-orange-800">
                    Filter: {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Badge>
                ))}
                {/* Existing badges for contentTypes, language, accessType, sortBy */}
                {Object.entries(contentTypes)
                  .filter(([_, selected]) => selected)
                  .map(([type, _]) => (
                    <Badge key={type} variant="secondary" className="bg-orange-200 text-orange-800">
                      {type === "nonFiction" ? "Non-Fiction" :
                        type === "scienceFiction" ? "Science Fiction" :
                        type === "youngAdult" ? "Young Adult" :
                        type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  ))}
                {language !== "Any Language" && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    Language: {language}
                  </Badge>
                )}
                {accessType !== "everything" && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    Access: {accessType === "available" ? "Available only" :
                      accessType === "download" ? "Downloadable" :
                        accessType === "online" ? "Read online" : accessType}
                  </Badge>
                )}
                {sortBy !== "relevance" && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    Sort: {sortBy === "date" ? "By date" :
                      sortBy === "title" ? "By title" :
                        sortBy === "author" ? "By author" : sortBy}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching...</p>
                </div>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {query ? 'No results found' : 'No books available'}
                </h3>
                <p className="text-gray-600">
                  {query ? 'Try adjusting your search terms or filters.' : 'The library catalog is currently empty.'}
                </p>
              </div>
            ) : (
              books.map((book, index) => renderBookItem(book, index))
            )}
          </div>

          {/* Pagination */}
          {totalResults > 20 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {Math.ceil(totalResults / 20)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalResults / 20)}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book View Modal */}
      {selectedBook && (
        <BookViewModal
          book={selectedBook}
          isOpen={isBookViewModalOpen}
          onClose={() => setIsBookViewModalOpen(false)}
          onSave={handleSave}
          onCite={handleCite}
          imageKey={imageKey}
          canBorrow={false}
          canReserve={false}
          showEditButton={false}
        />
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={handleCloseRegisterModal}
      />
    </div>
  );
}
