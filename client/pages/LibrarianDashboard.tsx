import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  Users, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  MessageSquare,
  Package,
  TrendingUp,
  UserCheck,
  BookPlus,
  ArrowLeft,
  Filter,
  AlertCircle,
  XCircle as OutOfStock,
  Tag,
  Layers,
  ChevronDown,
  Info,
  BookUser
} from "lucide-react";

interface DashboardStats {
  totalBooks: number;
  totalLoans: number;
  overdueLoans: number;
  pendingReservations: number;
  totalFines: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  currentLoans: number;
  status: 'available' | 'low-stock' | 'out-of-stock';
}

interface Loan {
  _id: string;
  userId: any;
  bookId: any;
  issuedBy: any;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue' | 'lost' | 'damaged';
  fineAmount: number;
  overdueDays?: number;
  potentialFine?: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  activeLoans: number;
  overdueLoans: number;
  totalFines: number;
}

export default function LibrarianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalLoans: 0,
    overdueLoans: 0,
    pendingReservations: 0,
    totalFines: 0,
    systemStatus: 'healthy'
  });
  
  // Data states
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  // Form states
  const [bookSearch, setBookSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [issueBookForm, setIssueBookForm] = useState({
    userId: "",
    bookId: "",
    loanDays: 14
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({
    userId: "",
    bookId: "",
    loanDays: ""
  });
  
  // Filter states
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set(['available', 'low-stock', 'out-of-stock']));
  const [genreFilters, setGenreFilters] = useState<Set<string>>(new Set());
  const [availabilityFilters, setAvailabilityFilters] = useState<Set<string>>(new Set(['has-copies', 'all-on-loan']));
  const [allGenres, setAllGenres] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if user is librarian or admin
    if (!user || !['librarian', 'admin'].includes(user.role)) {
      navigate('/');
      return;
    }
    
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // Load dashboard stats
      const statsResponse = await fetch('/api/librarian/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load books
      await loadBooks();
      
      // Load loans
      await loadLoans();
      
      // Load overdue books
      await loadOverdueBooks();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/librarian/books?limit=50&search=${bookSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books);
        
        // Extract unique genres for filtering
        const genreArray: string[] = data.books.map((book: Book) => book.genre).filter((genre): genre is string => Boolean(genre));
        const genres = new Set(genreArray);
        setAllGenres(genres);
        
        // Initialize genre filters to show all genres
        if (genreFilters.size === 0) {
          setGenreFilters(new Set(genreArray));
        }
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadLoans = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/librarian/loans?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoans(data.loans);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const loadOverdueBooks = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/librarian/overdue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverdueLoans(data);
      }
    } catch (error) {
      console.error('Error loading overdue books:', error);
    }
  };

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/librarian/users/search?q=${encodeURIComponent(userSearch)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const validateForm = () => {
    const errors = {
      userId: "",
      bookId: "",
      loanDays: ""
    };
    
    if (!issueBookForm.userId.trim()) {
      errors.userId = "Student ID is required";
    }
    
    if (!issueBookForm.bookId.trim()) {
      errors.bookId = "Book ID is required";
    }
    
    if (!issueBookForm.loanDays || issueBookForm.loanDays < 1 || issueBookForm.loanDays > 30) {
      errors.loanDays = "Loan period must be between 1 and 30 days";
    }
    
    setFormErrors(errors);
    return !errors.userId && !errors.bookId && !errors.loanDays;
  };

  const issueBook = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/librarian/loans/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(issueBookForm)
      });
      
      if (response.ok) {
        alert('Book issued successfully!');
        setIssueBookForm({ userId: "", bookId: "", loanDays: 14 });
        setFormErrors({ userId: "", bookId: "", loanDays: "" });
        loadLoans();
        loadBooks();
        loadDashboardData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error issuing book:', error);
      alert('Error issuing book');
    }
  };

  const returnBook = async (loanId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/librarian/loans/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ loanId })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.fine) {
          alert(`Book returned successfully! Fine of $${result.fine.toFixed(2)} has been applied for overdue.`);
        } else {
          alert('Book returned successfully!');
        }
        loadLoans();
        loadBooks();
        loadOverdueBooks();
        loadDashboardData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Error returning book');
    }
  };

  // Filter functions
  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(status)) {
        newFilters.delete(status);
      } else {
        newFilters.add(status);
      }
      return newFilters;
    });
  };

  const toggleGenreFilter = (genre: string) => {
    setGenreFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(genre)) {
        newFilters.delete(genre);
      } else {
        newFilters.add(genre);
      }
      return newFilters;
    });
  };

  const toggleAvailabilityFilter = (availability: string) => {
    setAvailabilityFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(availability)) {
        newFilters.delete(availability);
      } else {
        newFilters.add(availability);
      }
      return newFilters;
    });
  };

  // Apply filters in stages for dynamic badge counts
  
  // Step 1: Apply genre filter only (for availability badge counts)
  const booksFilteredByGenre = books.filter(book => {
    // Genre filter
    if (genreFilters.size > 0 && !genreFilters.has(book.genre)) return false;
    return true;
  });

  // Step 2: Apply genre and availability filters (for status badge counts)
  const booksFilteredByGenreAndAvailability = booksFilteredByGenre.filter(book => {
    // Availability filter
    if (availabilityFilters.size > 0) {
      const hasCopies = book.availableCopies > 0;
      const allOnLoan = book.availableCopies === 0 && book.currentLoans > 0;
      
      if (!((availabilityFilters.has('has-copies') && hasCopies) || 
            (availabilityFilters.has('all-on-loan') && allOnLoan))) {
        return false;
      }
    }
    
    return true;
  });

  // Step 3: Apply status filter to get final filtered books
  const filteredBooks = booksFilteredByGenreAndAvailability.filter(book => {
    return statusFilters.has(book.status);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'available':
      case 'returned':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'low-stock':
      case 'overdue':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'out-of-stock':
      case 'lost':
      case 'damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || !['librarian', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Librarian Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Library
              </Button>
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{user.name}</span>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Books
            </TabsTrigger>
            <TabsTrigger value="loans" className="flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              Loans
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Books</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <UserCheck className="w-8 h-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Active Loans</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalLoans}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Overdue</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.overdueLoans}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Calendar className="w-8 h-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Reservations</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.pendingReservations}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Outstanding Fines</p>
                          <p className="text-2xl font-bold text-gray-900">${stats.totalFines.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button onClick={() => setActiveTab('loans')} className="flex items-center gap-2">
                        <BookPlus className="w-4 h-4" />
                        Issue Book
                      </Button>
                      <Button onClick={() => setActiveTab('overdue')} variant="outline" className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        View Overdue
                      </Button>
                      <Button onClick={() => setActiveTab('users')} variant="outline" className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Find User
                      </Button>
                      <Button onClick={() => setActiveTab('books')} variant="outline" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Manage Books
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Book Management</h2>
                <p className="text-gray-600">
                  Manage library inventory ({filteredBooks.length} of {books.length} books shown)
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search books..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-64"
                />
                <Button onClick={loadBooks}>Search</Button>
              </div>
            </div>

            {/* Enhanced Filter Bar */}
            <Card>
              <CardContent className="py-4">
                <div className="space-y-4">
                  {/* Status Filters */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={statusFilters.has('available') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleStatusFilter('available')}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Available
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {booksFilteredByGenreAndAvailability.filter(b => b.status === 'available').length}
                        </Badge>
                      </Button>
                      <Button
                        variant={statusFilters.has('low-stock') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleStatusFilter('low-stock')}
                        className="flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Low Stock
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {booksFilteredByGenreAndAvailability.filter(b => b.status === 'low-stock').length}
                        </Badge>
                      </Button>
                      <Button
                        variant={statusFilters.has('out-of-stock') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleStatusFilter('out-of-stock')}
                        className="flex items-center gap-1"
                      >
                        <OutOfStock className="w-3 h-3" />
                        Out of Stock
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {booksFilteredByGenreAndAvailability.filter(b => b.status === 'out-of-stock').length}
                        </Badge>
                      </Button>
                    </div>
                  </div>

                  {/* Genre Filters */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Genre:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2 min-w-[200px] justify-between">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              <span>
                                {genreFilters.size === 0 ? 'No genres selected' : 
                                 genreFilters.size === allGenres.size ? 'All genres' :
                                 genreFilters.size === 1 ? Array.from(genreFilters)[0] :
                                 `${genreFilters.size} genres selected`}
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-72 overflow-y-auto">
                          <DropdownMenuLabel>Select Genres</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={genreFilters.size === allGenres.size}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setGenreFilters(new Set(allGenres));
                              } else {
                                setGenreFilters(new Set());
                              }
                            }}
                            className="font-medium"
                          >
                            All Genres
                            <Badge variant="secondary" className="ml-auto">
                              {books.length}
                            </Badge>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          {Array.from(allGenres).sort().map((genre) => (
                            <DropdownMenuCheckboxItem
                              key={genre}
                              checked={genreFilters.has(genre)}
                              onCheckedChange={() => toggleGenreFilter(genre)}
                            >
                              {genre}
                              <Badge variant="secondary" className="ml-auto">
                                {books.filter(b => b.genre === genre).length}
                              </Badge>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Availability Filters */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Availability:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={availabilityFilters.has('has-copies') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleAvailabilityFilter('has-copies')}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Has Copies
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {booksFilteredByGenre.filter(b => b.availableCopies > 0).length}
                        </Badge>
                      </Button>
                      <Button
                        variant={availabilityFilters.has('all-on-loan') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleAvailabilityFilter('all-on-loan')}
                        className="flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        All On Loan
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {booksFilteredByGenre.filter(b => b.availableCopies === 0 && b.currentLoans > 0).length}
                        </Badge>
                      </Button>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilters(new Set(['available', 'low-stock', 'out-of-stock']));
                        setGenreFilters(new Set(Array.from(allGenres)));
                        setAvailabilityFilters(new Set(['has-copies', 'all-on-loan']));
                      }}
                      className="text-xs"
                    >
                      Show All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilters(new Set());
                        setGenreFilters(new Set());
                        setAvailabilityFilters(new Set());
                      }}
                      className="text-xs"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filteredBooks.map((book) => (
                    <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-gray-600">by {book.author}</p>
                          <p className="text-xs text-gray-500">ISBN: {book.isbn} | Genre: {book.genre}</p>
                        </div>
                        <Badge className={getStatusColor(book.status)}>
                          {book.status}
                        </Badge>
                        <div className="text-sm text-gray-600">
                          Available: {book.availableCopies}/{book.totalCopies}
                          <br />
                          On Loan: {book.currentLoans}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {filteredBooks.length === 0 && books.length > 0 && (
                  <div className="py-16 text-center">
                    <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No books match your filters</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters to see more books in the library.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setStatusFilters(new Set(['available', 'low-stock', 'out-of-stock']));
                        setGenreFilters(new Set(Array.from(allGenres)));
                        setAvailabilityFilters(new Set(['has-copies', 'all-on-loan']));
                      }}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset All Filters
                    </Button>
                  </div>
                )}
                {books.length === 0 && (
                  <div className="py-16 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No books found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your search query or load more books.</p>
                    <Button onClick={loadBooks} className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Reload Books
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-6">
            {/* Issue Book Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookPlus className="w-5 h-5" />
                  Issue New Book to Student
                </CardTitle>
                <CardDescription>
                  Complete all required fields to issue a book to a student. All fields are mandatory.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Student ID Field */}
                  <div className="space-y-2">
                    <Label htmlFor="userId" className="text-sm font-medium flex items-center gap-1">
                      <BookUser className="w-4 h-4" />
                      Student ID *
                    </Label>
                    <Input
                      id="userId"
                      placeholder="e.g., 2021-12345, STU001"
                      value={issueBookForm.userId}
                      onChange={(e) => {
                        setIssueBookForm({...issueBookForm, userId: e.target.value});
                        if (formErrors.userId) setFormErrors({...formErrors, userId: ""});
                      }}
                      className={formErrors.userId ? "border-red-500" : ""}
                    />
                    {formErrors.userId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {formErrors.userId}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Enter the student's unique ID number
                    </p>
                  </div>

                  {/* Book ID Field */}
                  <div className="space-y-2">
                    <Label htmlFor="bookId" className="text-sm font-medium flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Book ID *
                    </Label>
                    <Input
                      id="bookId"
                      placeholder="e.g., BK001, ISBN-123"
                      value={issueBookForm.bookId}
                      onChange={(e) => {
                        setIssueBookForm({...issueBookForm, bookId: e.target.value});
                        if (formErrors.bookId) setFormErrors({...formErrors, bookId: ""});
                      }}
                      className={formErrors.bookId ? "border-red-500" : ""}
                    />
                    {formErrors.bookId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {formErrors.bookId}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Enter the book's unique ID or ISBN
                    </p>
                  </div>

                  {/* Loan Period Field */}
                  <div className="space-y-2">
                    <Label htmlFor="loanDays" className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Loan Period (Days) *
                    </Label>
                    <Input
                      id="loanDays"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="14"
                      value={issueBookForm.loanDays}
                      onChange={(e) => {
                        setIssueBookForm({...issueBookForm, loanDays: parseInt(e.target.value) || 14});
                        if (formErrors.loanDays) setFormErrors({...formErrors, loanDays: ""});
                      }}
                      className={formErrors.loanDays ? "border-red-500" : ""}
                    />
                    {formErrors.loanDays && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {formErrors.loanDays}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Standard: 14 days (1-30 days allowed)
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIssueBookForm({ userId: "", bookId: "", loanDays: 14 });
                      setFormErrors({ userId: "", bookId: "", loanDays: "" });
                    }}
                  >
                    Clear Form
                  </Button>
                  <Button onClick={issueBook} className="flex items-center gap-2">
                    <BookPlus className="w-4 h-4" />
                    Issue Book to Student
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Loans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Active Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loans.filter(loan => loan.status === 'active').map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="grid grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="font-medium">{loan.userId.name}</p>
                          <p className="text-sm text-gray-600">{loan.userId.email}</p>
                        </div>
                        <div>
                          <p className="font-medium">{loan.bookId.title}</p>
                          <p className="text-sm text-gray-600">by {loan.bookId.author}</p>
                        </div>
                        <div>
                          <p className="text-sm">Issued: {new Date(loan.issueDate).toLocaleDateString()}</p>
                          <p className="text-sm">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Badge className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                      </div>
                      <Button onClick={() => returnBook(loan._id)} variant="outline" size="sm">
                        Return Book
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="overdue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Overdue Books ({overdueLoans.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overdueLoans.map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                      <div className="grid grid-cols-5 gap-4 flex-1">
                        <div>
                          <p className="font-medium">{loan.userId.name}</p>
                          <p className="text-sm text-gray-600">{loan.userId.email}</p>
                        </div>
                        <div>
                          <p className="font-medium">{loan.bookId.title}</p>
                          <p className="text-sm text-gray-600">by {loan.bookId.author}</p>
                        </div>
                        <div>
                          <p className="text-sm">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                          <p className="text-sm font-medium text-red-600">
                            {loan.overdueDays} days overdue
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">Potential Fine:</p>
                          <p className="font-medium text-red-600">${loan.potentialFine?.toFixed(2)}</p>
                        </div>
                        <div>
                          <Badge className="bg-red-100 text-red-800">
                            Overdue
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Send Reminder
                        </Button>
                        <Button onClick={() => returnBook(loan._id)} size="sm">
                          Return Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Support & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchUsers} className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </Button>
                </div>

                <div className="space-y-4">
                  {searchResults.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="grid grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm">Role: {user.role}</p>
                          <Badge className="bg-blue-100 text-blue-800">{user.role}</Badge>
                        </div>
                        <div>
                          <p className="text-sm">Active Loans: {user.activeLoans}</p>
                          <p className="text-sm">Overdue: {user.overdueLoans}</p>
                        </div>
                        <div>
                          <p className="text-sm">Outstanding Fines:</p>
                          <p className="font-medium text-red-600">${user.totalFines.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View History
                        </Button>
                        <Button size="sm" variant="outline">
                          Send Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Reservation Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Reservation management features coming soon...</p>
                  <p className="text-sm text-gray-500">Manage book reservations, approve requests, and notify users</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Basic Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Daily Reports</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Daily Checkouts
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Daily Returns
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        New Registrations
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Overdue Reports</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Overdue Items
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Fine Collections
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Monthly Summary
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communication & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-4">Send Notifications</h3>
                    <div className="space-y-3">
                      <Button className="w-full justify-start">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Overdue Reminders
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        New Arrivals Announcement
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        General Announcement
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Reservation Ready
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-4">Quick Messages</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Clock className="w-4 h-4 mr-2" />
                        Due Date Reminders
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Fine Notifications
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Book Recommendations
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Policy Updates
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 