import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

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

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const query = searchParams.get("q") || "";
  const [refineQuery, setRefineQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    searchWithin: false,
    contentType: false,
    language: true,
    date: true,
    accessType: false,
  });
  const [accessType, setAccessType] = useState("everything");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [contentTypes, setContentTypes] = useState({
    journals: false,
    bookChapters: false,
    researchReports: false,
  });

  // Load search results
  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, currentPage]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: currentPage.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setBooks(data.books);
        setTotalResults(data.pagination.total);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLoginClick = () => setIsLoginModalOpen(true);
  const handleRegisterClick = () => setIsRegisterModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);

  const handleSave = (book: Book) => {
    // TODO: Implement save functionality
    console.log('Save book:', book.title);
  };

  const handleCite = (book: Book) => {
    // TODO: Implement citation functionality
    console.log('Cite book:', book.title);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-brand-border-light bg-white">
        {!user && !authLoading && (
          <div className="flex items-center justify-center py-3 border-b border-brand-border-light">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-alkalami">
                Have library access?{" "}
                <button 
                  onClick={handleLoginClick}
                  className="font-abhaya underline ml-3 hover:text-brand-orange transition-colors"
                >
                  Log in
                </button>
              </span>
            </div>
            <HelpCircle size={24} className="absolute right-12 top-3" />
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/0ec6016b55469bdd045398e228e52ebbbb309517?width=158"
              alt="Logo"
              className="h-22 w-20"
            />
          </Link>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleRegisterClick}
              className="px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base hover:bg-gray-50 transition-colors"
            >
              Register
            </button>
            <button 
              onClick={handleLoginClick}
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-full font-abhaya text-base hover:bg-brand-orange-light transition-colors"
            >
              <User size={24} />
              Log in
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Filters */}
        <div className="w-[419px] bg-gradient-to-b from-white via-brand-orange-gradient to-orange-200 border-r border-brand-border-light">
          <div className="p-6">
            <h2 className="text-4xl font-abhaya font-bold text-amber-900 mb-8">
              Refine Results
            </h2>

            {/* Search Within Results */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("searchWithin")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-2xl font-abhaya text-amber-900">Search Within Results</span>
                {expandedSections.searchWithin ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {expandedSections.searchWithin && (
                <div className="mt-4">
                  <Input
                    placeholder="Search within results..."
                    value={refineQuery}
                    onChange={(e) => setRefineQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Content Type */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("contentType")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-2xl font-abhaya text-amber-900">Content Type</span>
                {expandedSections.contentType ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {expandedSections.contentType && (
                <div className="mt-4 space-y-3">
                  {Object.entries(contentTypes).map(([key, checked]) => (
                    <label key={key} className="flex items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(checked) =>
                          setContentTypes(prev => ({ ...prev, [key]: checked as boolean }))
                        }
                      />
                      <span className="text-lg font-abhaya text-amber-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Language */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("language")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-2xl font-abhaya text-amber-900">Language</span>
                {expandedSections.language ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {expandedSections.language && (
                <div className="mt-4">
                  <RadioGroup value="english" className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="english" id="english" />
                      <Label htmlFor="english" className="text-lg font-abhaya text-amber-900">English</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="spanish" id="spanish" />
                      <Label htmlFor="spanish" className="text-lg font-abhaya text-amber-900">Spanish</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="french" id="french" />
                      <Label htmlFor="french" className="text-lg font-abhaya text-amber-900">French</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("date")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-2xl font-abhaya text-amber-900">Date</span>
                {expandedSections.date ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {expandedSections.date && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="all" id="all-dates" />
                    <Label htmlFor="all-dates" className="text-lg font-abhaya text-amber-900">All Dates</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="last-year" id="last-year" />
                    <Label htmlFor="last-year" className="text-lg font-abhaya text-amber-900">Last Year</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="last-5-years" id="last-5-years" />
                    <Label htmlFor="last-5-years" className="text-lg font-abhaya text-amber-900">Last 5 Years</Label>
                  </div>
                </div>
              )}
            </div>

            {/* Access Type */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("accessType")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-2xl font-abhaya text-amber-900">Access Type</span>
                {expandedSections.accessType ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {expandedSections.accessType && (
                <div className="mt-4">
                  <RadioGroup value={accessType} onValueChange={setAccessType} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="everything" id="everything" />
                      <Label htmlFor="everything" className="text-lg font-abhaya text-amber-900">Everything</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="available" id="available" />
                      <Label htmlFor="available" className="text-lg font-abhaya text-amber-900">Available</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new" className="text-lg font-abhaya text-amber-900">New</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Search Results Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-abhaya text-black mb-4">
              Search Results for "{query}"
            </h1>
            <p className="text-lg text-gray-600">
              {loading ? 'Searching...' : `${totalResults} results found`}
            </p>
          </div>

          {/* Search Results */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-600">Try adjusting your search terms or filters.</p>
              </div>
            ) : (
              books.map((book) => (
                <div key={book._id} className="flex gap-6 p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  {/* Book Cover */}
                  <div className="w-32 h-48 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                    {book.coverImage ? (
                      <img 
                        src={book.coverImage} 
                        alt={book.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <BookText className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {/* Book Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-abhaya text-black mb-2">{book.title}</h3>
                        <p className="text-lg text-gray-600 mb-2">by {book.author}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {book.publishedYear}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {book.publisher}
                          </span>
                          {book.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {book.location}
                            </span>
                          )}
                        </div>
                        <Badge className={getStatusColor(book.status)}>
                          {book.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSave(book)}
                        >
                          <Bookmark className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCite(book)}
                        >
                          <Quote className="w-4 h-4 mr-2" />
                          Cite
                        </Button>
                      </div>
                    </div>

                    {book.description && (
                      <p className="text-gray-700 mb-4 line-clamp-3">{book.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>ISBN: {book.isbn}</span>
                      <span>{book.availableCopies} of {book.totalCopies} copies available</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalResults > 20 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-600">
                  Page {currentPage} of {Math.ceil(totalResults / 20)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalResults / 20)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
