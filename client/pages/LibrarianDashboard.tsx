import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import UserAvatar from "../components/UserAvatar";
import BookFormModal from "../components/BookFormModal";
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
  userId: string;
  department: string;
  activeLoans: number;
  overdueLoans: number;
  totalFines: number;
  profilePicture?: {
    data: string;
    contentType: string;
    fileName: string;
    uploadDate: string;
  };
}

interface Reservation {
  _id: string;
  userId: any;
  bookId: any;
  requestDate: string;
  status: 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'expired';
  priority: number;
  notificationSent: boolean;
  expiryDate?: string;
  notes?: string;
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
  const [reservations, setReservations] = useState<Reservation[]>([]);
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

  const [auditHistory, setAuditHistory] = useState<Record<string, any[]>>({});
  const [auditingBookId, setAuditingBookId] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const [recentFines, setRecentFines] = useState<any[]>([]);
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationUser, setNotificationUser] = useState<User | null>(null);
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', type: 'general' });
  const [notificationSending, setNotificationSending] = useState(false);

  // Reservation management states
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('all');
  const [updatingReservation, setUpdatingReservation] = useState<string | null>(null);

  // Book form modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [bookModalMode, setBookModalMode] = useState<'add' | 'edit'>('add');

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

      // Load reservations
      await loadReservations();

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

  const loadReservations = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/librarian/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
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

  // Fetch audit history for a book
  const fetchAuditHistory = async (bookId: string) => {
    setAuditLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`/api/librarian/inventory-audits?bookId=${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditHistory(prev => ({ ...prev, [bookId]: data.audits }));
      }
    } finally {
      setAuditLoading(false);
    }
  };

  // Audit a book (log current stock)
  const auditBook = async (book: Book) => {
    setAuditingBookId(book.id);
    setAuditLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/librarian/inventory-audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: book.id,
          expectedCount: book.totalCopies,
          actualCount: book.availableCopies + book.currentLoans,
          notes: ''
        })
      });
      if (res.ok) {
        await fetchAuditHistory(book.id);
        alert('Audit logged!');
      } else {
        alert('Failed to log audit.');
      }
    } finally {
      setAuditingBookId(null);
      setAuditLoading(false);
    }
  };

  // Fetch recent fines and loans for reports
  const fetchReportsData = async () => {
    setReportsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // Fines
      const finesRes = await fetch('/api/librarian/fines?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (finesRes.ok) {
        const data = await finesRes.json();
        setRecentFines(data.fines || []);
      }
      // Loans
      const loansRes = await fetch('/api/librarian/loans?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (loansRes.ok) {
        const data = await loansRes.json();
        setRecentLoans(data.loans || []);
      }
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch on tab change
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportsData();
    }
  }, [activeTab]);

  // Send notification
  const sendNotification = async () => {
    if (!notificationUser) return;
    setNotificationSending(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/librarian/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: notificationUser._id,
          type: notificationForm.type,
          title: notificationForm.title,
          message: notificationForm.message
        })
      });
      if (res.ok) {
        alert('Notification sent!');
        setShowNotificationModal(false);
        setNotificationForm({ title: '', message: '', type: 'general' });
      } else {
        alert('Failed to send notification.');
      }
    } finally {
      setNotificationSending(false);
    }
  };

  // Update reservation status
  const updateReservationStatus = async (reservationId: string, status: string, notes?: string) => {
    setUpdatingReservation(reservationId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/librarian/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });
      
      if (response.ok) {
        alert(`Reservation status updated to ${status}`);
        loadReservations();
        loadDashboardData(); // Refresh stats
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Error updating reservation status');
    } finally {
      setUpdatingReservation(null);
    }
  };

  // Cancel reservation
  const cancelReservation = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    setUpdatingReservation(reservationId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/librarian/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'cancelled', 
          notes: 'Cancelled by librarian' 
        })
      });
      
      if (response.ok) {
        alert('Reservation cancelled successfully');
        loadReservations();
        loadDashboardData(); // Refresh stats
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error cancelling reservation');
    } finally {
      setUpdatingReservation(null);
    }
  };

  // Send overdue reminder
  const sendOverdueReminder = async (loan: Loan) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/librarian/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: loan.userId._id,
          type: 'overdue',
          title: 'Overdue Book Reminder',
          message: `Your book "${loan.bookId.title}" is ${loan.overdueDays} days overdue. Please return it as soon as possible to avoid additional fines.`
        })
      });
      
      if (response.ok) {
        alert('Overdue reminder sent successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending overdue reminder:', error);
      alert('Error sending reminder');
    }
  };

  // Book management functions
  const saveBook = async (bookData: any) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    try {
      const url = bookModalMode === 'add' 
        ? '/api/librarian/books' 
        : `/api/librarian/books/${editingBook?.id}`;
      
      const method = bookModalMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookData)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(bookModalMode === 'add' ? 'Book added successfully!' : 'Book updated successfully!');
        
        // Refresh books list
        loadBooks();
        setShowBookModal(false);
        setEditingBook(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving book:', error);
      alert('An error occurred while saving the book');
    }
  };

  const openAddBookModal = () => {
    setEditingBook(null);
    setBookModalMode('add');
    setShowBookModal(true);
  };

  const openEditBookModal = (book: Book) => {
    setEditingBook(book);
    setBookModalMode('edit');
    setShowBookModal(true);
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
          <TabsList className="grid w-full grid-cols-9">
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
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              Inventory
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
                <Button onClick={openAddBookModal} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Book
                </Button>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditBookModal(book)}
                        >
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
                      placeholder="e.g., STD-25CS-0714-001 or student@email.com"
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
                      Enter the student's ID (e.g., STD-25CS-0714-001) or email
                    </p>
                  </div>

                  {/* Book ID Field */}
                  <div className="space-y-2">
                    <Label htmlFor="bookId" className="text-sm font-medium flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Book ID *
                    </Label>
                    <input
                      id="bookId"
                      type="text"
                      placeholder="Enter book title or ISBN"
                      value={issueBookForm.bookId}
                      onChange={(e) => {
                        setIssueBookForm({...issueBookForm, bookId: e.target.value});
                        if (formErrors.bookId) setFormErrors({...formErrors, bookId: ""});
                      }}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${formErrors.bookId ? "border-red-500" : ""}`}
                      disabled={false}
                    />
                    {formErrors.bookId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {formErrors.bookId}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Enter the book's title or ISBN
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
                  
                  {loans.filter(loan => loan.status === 'active').length === 0 && (
                    <div className="text-center py-8">
                      <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No active loans</p>
                      <p className="text-sm text-gray-500">All books have been returned or no books are currently on loan.</p>
                    </div>
                  )}
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendOverdueReminder(loan)}
                        >
                          Send Reminder
                        </Button>
                        <Button onClick={() => returnBook(loan._id)} size="sm">
                          Return Book
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {overdueLoans.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">No overdue books!</p>
                      <p className="text-sm text-gray-500">All books are returned on time.</p>
                    </div>
                  )}
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
                        <div className="flex items-center gap-3">
                          <UserAvatar user={{ id: user._id, name: user.name, profilePicture: user.profilePicture }} size="md" />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                {user.userId}
                              </span>
                              {user.department && ` • ${user.department}`}
                            </p>
                          </div>
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
                        <Button size="sm" onClick={() => { setNotificationUser(user); setShowNotificationModal(true); }}>
                          Send Notification
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Notification Modal */}
                {showNotificationModal && notificationUser && (
                  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h2 className="text-lg font-semibold mb-4">Send Notification to {notificationUser.name}</h2>
                      <div className="mb-3">
                        <Label>Type</Label>
                        <select
                          className="w-full border rounded px-2 py-1 mt-1"
                          value={notificationForm.type}
                          onChange={e => setNotificationForm(f => ({ ...f, type: e.target.value }))}
                        >
                          <option value="general">General</option>
                          <option value="overdue">Overdue</option>
                          <option value="reservation_ready">Reservation Ready</option>
                          <option value="fine">Fine</option>
                          <option value="book_reminder">Book Reminder</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <Label>Title</Label>
                        <Input
                          value={notificationForm.title}
                          onChange={e => setNotificationForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Notification title"
                        />
                      </div>
                      <div className="mb-3">
                        <Label>Message</Label>
                        <textarea
                          className="w-full border rounded px-2 py-1 mt-1"
                          rows={3}
                          value={notificationForm.message}
                          onChange={e => setNotificationForm(f => ({ ...f, message: e.target.value }))}
                          placeholder="Notification message"
                        />
                      </div>
                      <div className="flex gap-2 justify-end mt-4">
                        <Button variant="outline" onClick={() => setShowNotificationModal(false)} disabled={notificationSending}>Cancel</Button>
                        <Button onClick={sendNotification} disabled={notificationSending || !notificationForm.title || !notificationForm.message}>
                          {notificationSending ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Checking & Audit</CardTitle>
                <CardDescription>
                  View all books, check stock, and log inventory audits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Title</th>
                        <th className="px-4 py-2 text-left">Author</th>
                        <th className="px-4 py-2 text-left">Total</th>
                        <th className="px-4 py-2 text-left">Available</th>
                        <th className="px-4 py-2 text-left">On Loan</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map(book => (
                        <tr key={book.id} className="border-b">
                          <td className="px-4 py-2">{book.title}</td>
                          <td className="px-4 py-2">{book.author}</td>
                          <td className="px-4 py-2">{book.totalCopies}</td>
                          <td className="px-4 py-2">{book.availableCopies}</td>
                          <td className="px-4 py-2">{book.currentLoans}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded ${getStatusColor(book.status)}`}>{book.status}</span>
                          </td>
                          <td className="px-4 py-2">
                            <Button size="sm" onClick={() => auditBook(book)} disabled={auditLoading && auditingBookId === book.id}>
                              {auditLoading && auditingBookId === book.id ? 'Auditing...' : 'Audit'}
                            </Button>
                            <Button size="sm" variant="outline" className="ml-2" onClick={() => fetchAuditHistory(book.id)}>
                              History
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Audit History */}
                {Object.entries(auditHistory).map(([bookId, audits]) => (
                  <div key={bookId} className="mt-6">
                    <h3 className="font-semibold text-lg mb-2">Audit History for Book ID: {bookId}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1">Date</th>
                            <th className="px-2 py-1">Expected</th>
                            <th className="px-2 py-1">Actual</th>
                            <th className="px-2 py-1">Discrepancy</th>
                            <th className="px-2 py-1">Status</th>
                            <th className="px-2 py-1">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audits.map((audit: any) => (
                            <tr key={audit._id}>
                              <td className="px-2 py-1">{new Date(audit.auditDate).toLocaleString()}</td>
                              <td className="px-2 py-1">{audit.expectedCount}</td>
                              <td className="px-2 py-1">{audit.actualCount}</td>
                              <td className="px-2 py-1">{audit.discrepancy}</td>
                              <td className="px-2 py-1">{audit.status}</td>
                              <td className="px-2 py-1">{audit.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
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
                                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-semibold text-gray-900">Reservations ({reservations.length})</h2>
                   <div className="flex gap-2">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="outline">
                           Filter: {reservationStatusFilter === 'all' ? 'All Statuses' : reservationStatusFilter}
                           <ChevronDown className="w-4 h-4 ml-1" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent>
                         <DropdownMenuItem onClick={() => setReservationStatusFilter('all')}>
                           All Statuses
                         </DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => setReservationStatusFilter('pending')}>
                           Pending
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setReservationStatusFilter('ready')}>
                           Ready
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setReservationStatusFilter('fulfilled')}>
                           Fulfilled
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setReservationStatusFilter('cancelled')}>
                           Cancelled
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setReservationStatusFilter('expired')}>
                           Expired
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                     <Button onClick={() => loadReservations()}>
                       <RefreshCw className="w-4 h-4 mr-2" />
                       Refresh
                     </Button>
                   </div>
                 </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">User</th>
                        <th className="px-4 py-2 text-left">Book</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Priority</th>
                        <th className="px-4 py-2 text-left">Request Date</th>
                        <th className="px-4 py-2 text-left">Expiry Date</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations
                        .filter(res => reservationStatusFilter === 'all' || res.status === reservationStatusFilter)
                        .map((reservation) => (
                          <tr key={reservation._id} className="border-b">
                            <td className="px-4 py-2">{reservation.userId?.name || 'N/A'}</td>
                            <td className="px-4 py-2">{reservation.bookId?.title || 'N/A'}</td>
                            <td className="px-4 py-2">
                              <Badge className={`px-2 py-1 rounded ${
                                reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                reservation.status === 'ready' ? 'bg-green-100 text-green-800' :
                                reservation.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
                                reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {reservation.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">{reservation.priority}</td>
                            <td className="px-4 py-2">{new Date(reservation.requestDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{reservation.expiryDate ? new Date(reservation.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                                         <td className="px-4 py-2">
                               <div className="flex gap-2">
                                 <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       disabled={updatingReservation === reservation._id}
                                     >
                                       {updatingReservation === reservation._id ? 'Updating...' : 'Update Status'}
                                       <ChevronDown className="w-4 h-4 ml-1" />
                                     </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent>
                                     <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                     <DropdownMenuSeparator />
                                     {reservation.status === 'pending' && (
                                       <DropdownMenuItem onClick={() => updateReservationStatus(reservation._id, 'ready')}>
                                         Mark as Ready
                                       </DropdownMenuItem>
                                     )}
                                     {reservation.status === 'ready' && (
                                       <DropdownMenuItem onClick={() => updateReservationStatus(reservation._id, 'fulfilled')}>
                                         Mark as Fulfilled
                                       </DropdownMenuItem>
                                     )}
                                     {reservation.status !== 'cancelled' && reservation.status !== 'expired' && (
                                       <DropdownMenuItem onClick={() => updateReservationStatus(reservation._id, 'cancelled')}>
                                         Cancel
                                       </DropdownMenuItem>
                                     )}
                                     {reservation.status === 'ready' && (
                                       <DropdownMenuItem onClick={() => updateReservationStatus(reservation._id, 'expired')}>
                                         Mark as Expired
                                       </DropdownMenuItem>
                                     )}
                                   </DropdownMenuContent>
                                 </DropdownMenu>
                                 
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => {
                                     // Show reservation details
                                     alert(`Reservation Details:\nUser: ${reservation.userId?.name}\nBook: ${reservation.bookId?.title}\nStatus: ${reservation.status}\nPriority: ${reservation.priority}\nRequest Date: ${new Date(reservation.requestDate).toLocaleDateString()}`);
                                   }}
                                 >
                                   <Eye className="w-4 h-4" />
                                 </Button>
                               </div>
                             </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {reservations.filter(res => reservationStatusFilter === 'all' || res.status === reservationStatusFilter).length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {reservationStatusFilter === 'all' 
                        ? 'No reservations found.' 
                        : `No ${reservationStatusFilter} reservations found.`
                      }
                    </p>
                    <p className="text-sm text-gray-500">Reservations will appear here when students request books</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Library Reports</CardTitle>
                <CardDescription>Basic statistics and recent activity.</CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-600">Total Books</div>
                          <div className="text-2xl font-bold">{stats.totalBooks}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-600">Active Loans</div>
                          <div className="text-2xl font-bold">{stats.totalLoans}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-600">Overdue Loans</div>
                          <div className="text-2xl font-bold">{stats.overdueLoans}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-600">Outstanding Fines</div>
                          <div className="text-2xl font-bold">${stats.totalFines.toFixed(2)}</div>
                        </CardContent>
                      </Card>
                    </div>
                    {/* Recent Fines */}
                    <h3 className="font-semibold text-lg mb-2 mt-6">Recent Fines</h3>
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1">User</th>
                            <th className="px-2 py-1">Amount</th>
                            <th className="px-2 py-1">Reason</th>
                            <th className="px-2 py-1">Status</th>
                            <th className="px-2 py-1">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentFines.map((fine) => (
                            <tr key={fine._id}>
                              <td className="px-2 py-1">{fine.userId?.name || 'N/A'}</td>
                              <td className="px-2 py-1">${fine.amount.toFixed(2)}</td>
                              <td className="px-2 py-1">{fine.reason}</td>
                              <td className="px-2 py-1">{fine.status}</td>
                              <td className="px-2 py-1">{new Date(fine.dateIssued).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Recent Loans */}
                    <h3 className="font-semibold text-lg mb-2 mt-6">Recent Loans</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1">User</th>
                            <th className="px-2 py-1">Book</th>
                            <th className="px-2 py-1">Status</th>
                            <th className="px-2 py-1">Issued</th>
                            <th className="px-2 py-1">Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentLoans.map((loan) => (
                            <tr key={loan._id}>
                              <td className="px-2 py-1">{loan.userId?.name || 'N/A'}</td>
                              <td className="px-2 py-1">{loan.bookId?.title || 'N/A'}</td>
                              <td className="px-2 py-1">{loan.status}</td>
                              <td className="px-2 py-1">{new Date(loan.issueDate).toLocaleDateString()}</td>
                              <td className="px-2 py-1">{new Date(loan.dueDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
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

      {/* Book Form Modal */}
      <BookFormModal
        isOpen={showBookModal}
        onClose={() => {
          setShowBookModal(false);
          setEditingBook(null);
        }}
        onSave={saveBook}
        book={editingBook}
        mode={bookModalMode}
      />
    </div>
  );
} 