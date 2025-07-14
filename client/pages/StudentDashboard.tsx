import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import UserAvatar from "../components/UserAvatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Bell, 
  CreditCard,
  MessageSquare,
  User,
  RefreshCw,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Filter,
  Heart,
  Bookmark,
  DollarSign,
  History
} from "lucide-react";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  description: string;
  availableCopies: number;
  totalCopies: number;
  categories: string[];
  pages: number;
  publishedYear: number;
  hasDownload: boolean;
  hasReadOnline: boolean;
}

interface Loan {
  _id: string;
  bookId: any;
  issueDate: string;
  dueDate: string;
  status: string;
  renewalCount: number;
  maxRenewals: number;
  fineAmount: number;
}

interface Reservation {
  _id: string;
  bookId: any;
  requestDate: string;
  status: string;
  priority: number;
}

interface Fine {
  _id: string;
  amount: number;
  reason: string;
  description: string;
  dateIssued: string;
  status: string;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  sent: boolean;
  read: boolean;
  createdAt: string;
}

interface StudentStats {
  currentLoans: number;
  totalBorrowed: number;
  outstandingFines: number;
  activeReservations: number;
  borrowingLimit: number;
  availableToLoan: number;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats>({
    currentLoans: 0,
    totalBorrowed: 0,
    outstandingFines: 0,
    activeReservations: 0,
    borrowingLimit: 5,
    availableToLoan: 5
  });
  
  // Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [feedback, setFeedback] = useState("");
  const [bookSuggestion, setBookSuggestion] = useState({ title: "", author: "", reason: "" });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Check if user is a student (user role)
    if (!user || user.role !== 'user') {
      navigate('/');
      return;
    }
    
    loadStudentData();
  }, [user, navigate]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // Load all student data in parallel
      await Promise.all([
        loadBooks(),
        loadLoans(),
        loadReservations(),
        loadFines(),
        loadNotifications(),
        loadStudentStats()
      ]);

    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/student/books?search=${searchQuery}&filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadLoans = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/loans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const loadReservations = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/reservations', {
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

  const loadFines = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/fines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFines(data);
      }
    } catch (error) {
      console.error('Error loading fines:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadStudentStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentStats(data);
      }
    } catch (error) {
      console.error('Error loading student stats:', error);
    }
  };

  const borrowBook = async (bookId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookId, loanDays: 14 })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Book borrowed successfully! Due date: ${new Date(result.dueDate).toLocaleDateString()}`);
        loadLoans();
        loadBooks();
        loadStudentStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Error borrowing book');
    }
  };

  const reserveBook = async (bookId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });
      
      if (response.ok) {
        alert('Book reserved successfully! You will be notified when it becomes available.');
        loadReservations();
        loadStudentStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error reserving book:', error);
      alert('Error reserving book');
    }
  };

  const returnBook = async (loanId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/student/loans/${loanId}/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
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
        loadStudentStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Error returning book');
    }
  };

  const renewLoan = async (loanId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/student/loans/${loanId}/renew`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Book renewed successfully!');
        loadLoans();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error renewing loan:', error);
      alert('Error renewing book');
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/student/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Reservation cancelled successfully!');
        loadReservations();
        loadStudentStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error cancelling reservation');
    }
  };

  const submitFeedback = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: feedback })
      });
      
      if (response.ok) {
        alert('Feedback submitted successfully! Thank you for your input.');
        setFeedback("");
      } else {
        alert('Error submitting feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const submitBookSuggestion = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/student/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookSuggestion)
      });
      
      if (response.ok) {
        alert('Book suggestion submitted successfully! We will review your recommendation.');
        setBookSuggestion({ title: "", author: "", reason: "" });
      } else {
        alert('Error submitting book suggestion');
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Error submitting book suggestion');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`/api/student/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'ready':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'lost':
      case 'damaged':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'user') {
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
              <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
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
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Loans</p>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.currentLoans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bookmark className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reservations</p>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.activeReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Outstanding Fines</p>
                  <p className="text-2xl font-bold text-gray-900">${studentStats.outstandingFines.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available to Loan</p>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.availableToLoan}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="browse" className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="loans" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              My Loans
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="fines" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Fines
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="w-3 h-3" />
              History
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Browse Books Tab */}
          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Browse & Search Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search by title, author, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Books</option>
                    <option value="available">Available</option>
                    <option value="new">New Arrivals</option>
                    <option value="popular">Most Borrowed</option>
                  </select>
                  <Button onClick={loadBooks} className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map((book) => (
                    <Card key={book._id} className="h-full">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg">{book.title}</h3>
                            <p className="text-gray-600">by {book.author}</p>
                            <p className="text-sm text-gray-500">{book.genre} • {book.pages} pages</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {book.availableCopies > 0 ? 'Available' : 'Not Available'}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {book.availableCopies}/{book.totalCopies} copies
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 line-clamp-3">{book.description}</p>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedBook(book)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            {book.availableCopies > 0 ? (
                              <Button 
                                size="sm"
                                onClick={() => borrowBook(book._id)}
                                disabled={studentStats.availableToLoan === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Borrow
                              </Button>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => reserveBook(book._id)}
                                disabled={studentStats.availableToLoan === 0}
                              >
                                <Bookmark className="w-4 h-4 mr-2" />
                                Reserve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Loans Tab */}
          <TabsContent value="loans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  My Current Loans ({loans.filter(loan => loan.status === 'active').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loans.filter(loan => loan.status === 'active').map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{loan.bookId.title}</h3>
                        <p className="text-sm text-gray-600">by {loan.bookId.author}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                          <Badge className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                          {new Date(loan.dueDate) < new Date() && (
                            <Badge className="bg-red-100 text-red-800">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Renewals: {loan.renewalCount}/{loan.maxRenewals}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => renewLoan(loan._id)}
                          disabled={loan.renewalCount >= loan.maxRenewals}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Renew
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => returnBook(loan._id)}
                          className="text-red-600 hover:text-red-700 border-red-300"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Return
                        </Button>
                      </div>
                    </div>
                  ))}
                  {loans.filter(loan => loan.status === 'active').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No current loans. Visit the library to borrow books!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5" />
                  My Reservations ({reservations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div key={reservation._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{reservation.bookId.title}</h3>
                        <p className="text-sm text-gray-600">by {reservation.bookId.author}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Requested: {new Date(reservation.requestDate).toLocaleDateString()}</span>
                          <Badge className={getStatusColor(reservation.status)}>
                            {reservation.status}
                          </Badge>
                          <span className="text-sm text-gray-600">Priority: #{reservation.priority}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelReservation(reservation._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No active reservations.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fines Tab */}
          <TabsContent value="fines" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  My Fines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fines.map((fine) => (
                    <div key={fine._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{fine.description}</h3>
                        <p className="text-sm text-gray-600">Reason: {fine.reason}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Issued: {new Date(fine.dateIssued).toLocaleDateString()}</span>
                          <Badge className={getStatusColor(fine.status)}>
                            {fine.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">${fine.amount.toFixed(2)}</div>
                        {fine.status === 'pending' && (
                          <Button size="sm" className="mt-2">
                            Pay Online
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {fines.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No fines. Keep up the good work!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No notifications yet.</div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div key={notif._id} className={`p-4 border rounded-lg flex items-start gap-4 ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                        <div className="flex-shrink-0">
                          <Badge className="capitalize">
                            {notif.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{notif.title}</h3>
                            <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-700 mt-1 mb-2">{notif.message}</p>
                          {!notif.read && (
                            <Button size="sm" onClick={() => markNotificationAsRead(notif._id)}>
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Submit Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Share your feedback about library services, suggest improvements, or report issues..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                    />
                    <Button onClick={submitFeedback} disabled={!feedback.trim()}>
                      Submit Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Suggest a Book
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Book Title"
                      value={bookSuggestion.title}
                      onChange={(e) => setBookSuggestion({...bookSuggestion, title: e.target.value})}
                    />
                    <Input
                      placeholder="Author"
                      value={bookSuggestion.author}
                      onChange={(e) => setBookSuggestion({...bookSuggestion, author: e.target.value})}
                    />
                    <Textarea
                      placeholder="Why should we add this book to our collection?"
                      value={bookSuggestion.reason}
                      onChange={(e) => setBookSuggestion({...bookSuggestion, reason: e.target.value})}
                      rows={4}
                    />
                    <Button 
                      onClick={submitBookSuggestion} 
                      disabled={!bookSuggestion.title || !bookSuggestion.author}
                    >
                      Submit Suggestion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Borrowing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loans.filter(loan => loan.status === 'returned').slice(0, 10).map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{loan.bookId.title}</h3>
                        <p className="text-sm text-gray-600">by {loan.bookId.author}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Borrowed: {new Date(loan.issueDate).toLocaleDateString()}</span>
                          <span className="text-sm">Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                          <Badge className={getStatusColor(loan.status)}>
                            Returned
                          </Badge>
                        </div>
                      </div>
                      {loan.fineAmount > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-red-600">Fine: ${loan.fineAmount.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {loans.filter(loan => loan.status === 'returned').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No borrowing history yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <UserAvatar user={user} size="lg" />
                      <div>
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="mt-1 text-lg">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email Address</label>
                      <p className="mt-1">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Student ID</label>
                      <p className="mt-1 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                        {user.userId || `STD-25CS-${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-001`}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Status</label>
                      <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Borrowing Limit</label>
                      <p className="mt-1">{studentStats.borrowingLimit} books</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Currently Available</label>
                      <p className="mt-1">{studentStats.availableToLoan} books</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Books Borrowed</label>
                      <p className="mt-1">{studentStats.totalBorrowed} books</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Member Since</label>
                      <p className="mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <Button variant="outline">
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 