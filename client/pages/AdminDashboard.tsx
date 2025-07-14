import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  Settings, 
  BarChart3, 
  Shield, 
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Database,
  Package,
  AlertCircle,
  XCircle as OutOfStock
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  activeLoans: number;
  pendingReservations: number;
  newUsersToday: number;
  booksAddedThisMonth: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'librarian' | 'user';
  userId: string;
  contactNumber: string;
  department: string;
  createdAt: string;
  lastLogin: string;
  accountStatus: 'active' | 'inactive' | 'suspended';
  // For students only
  currentBorrowedBooks?: number;
  totalBooksBorrowed?: number;
  outstandingFines?: number;
  numberOfReservations?: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  addedDate: string;
  status: 'available' | 'low-stock' | 'out-of-stock';
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBooks: 0,
    activeLoans: 0,
    pendingReservations: 0,
    newUsersToday: 0,
    booksAddedThisMonth: 0,
    systemStatus: 'healthy'
  });
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilters, setRoleFilters] = useState<Set<string>>(new Set(['admin', 'librarian', 'user']));
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set(['available', 'low-stock', 'out-of-stock']));

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    
    // Load dashboard data
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
      const statsResponse = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load users
      const usersResponse = await fetch('/api/admin/users?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
      }

      // Load books
      const booksResponse = await fetch('/api/admin/books?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (booksResponse.ok) {
        const booksData = await booksResponse.json();
        setBooks(booksData.books);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    try {
      switch (action) {
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user?')) {
            const response = await fetch(`/api/admin/users/${userId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
              // Remove user from local state
              setUsers(users.filter(user => user.id !== userId));
              alert('User deleted successfully');
            } else {
              const error = await response.json();
              alert(`Error: ${error.message}`);
            }
          }
          break;
        case 'view':
          // TODO: Implement user view modal
          alert(`View user details for ${userId}`);
          break;
        case 'edit':
          // TODO: Implement user edit modal
          alert(`Edit user ${userId}`);
          break;
        default:
          console.log(`${action} user ${userId}`);
      }
    } catch (error) {
      console.error('Error handling user action:', error);
      alert('An error occurred while processing the request');
    }
  };

  const handleBookAction = async (action: string, bookId: string) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    try {
      switch (action) {
        case 'delete':
          if (window.confirm('Are you sure you want to delete this book?')) {
            const response = await fetch(`/api/admin/books/${bookId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
              // Remove book from local state
              setBooks(books.filter(book => book.id !== bookId));
              alert('Book deleted successfully');
            } else {
              const error = await response.json();
              alert(`Error: ${error.message}`);
            }
          }
          break;
        case 'view':
          // TODO: Implement book view modal
          alert(`View book details for ${bookId}`);
          break;
        case 'edit':
          // TODO: Implement book edit modal
          alert(`Edit book ${bookId}`);
          break;
        default:
          console.log(`${action} book ${bookId}`);
      }
    } catch (error) {
      console.error('Error handling book action:', error);
      alert('An error occurred while processing the request');
    }
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(role)) {
        newFilters.delete(role);
      } else {
        newFilters.add(role);
      }
      return newFilters;
    });
  };

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

  const filteredUsers = users.filter(user => roleFilters.has(user.role));
  const filteredBooks = books.filter(book => statusFilters.has(book.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'inactive':
      case 'suspended':
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'librarian':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
              <Shield className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Users</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <BookOpen className="w-8 h-8 text-green-600" />
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
                        <Activity className="w-8 h-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Active Loans</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.activeLoans}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Pending Reservations</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.pendingReservations}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(stats.systemStatus)}>
                        {stats.systemStatus === 'healthy' && <CheckCircle className="w-4 h-4 mr-1" />}
                        {stats.systemStatus === 'warning' && <AlertTriangle className="w-4 h-4 mr-1" />}
                        {stats.systemStatus === 'error' && <XCircle className="w-4 h-4 mr-1" />}
                        System {stats.systemStatus}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        All systems operational • Last checked: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <p className="text-sm text-gray-600">New user registration: john.doe@example.com</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <p className="text-sm text-gray-600">Book added: "The Great Gatsby"</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <p className="text-sm text-gray-600">Loan request: "1984" by George Orwell</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <p className="text-sm text-gray-600">User role updated: jane.smith@university.edu</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">New users today</span>
                          <span className="font-semibold">{stats.newUsersToday}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Books added this month</span>
                          <span className="font-semibold">{stats.booksAddedThisMonth}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">System uptime</span>
                          <span className="font-semibold text-green-600">99.9%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Database size</span>
                          <span className="font-semibold">127 MB</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
                <p className="text-gray-600">
                  Manage all users in the system ({filteredUsers.length} of {users.length} users shown)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search Users
                </Button>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New User
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by role:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={roleFilters.has('admin') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleRoleFilter('admin')}
                      className="flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Admin
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {users.filter(u => u.role === 'admin').length}
                      </Badge>
                    </Button>
                    <Button
                      variant={roleFilters.has('librarian') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleRoleFilter('librarian')}
                      className="flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      Librarian
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {users.filter(u => u.role === 'librarian').length}
                      </Badge>
                    </Button>
                    <Button
                      variant={roleFilters.has('user') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleRoleFilter('user')}
                      className="flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      Student
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {users.filter(u => u.role === 'user').length}
                      </Badge>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleFilters(new Set(['admin', 'librarian', 'user']))}
                      className="text-xs"
                    >
                      Show All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleFilters(new Set())}
                      className="text-xs"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={getRoleColor(user.role)} variant="secondary">
                        {user.role === 'user' ? 'Student' : user.role === 'librarian' ? 'Librarian' : 'Admin'}
                      </Badge>
                      <Badge className={getStatusColor(user.accountStatus)} variant="outline">
                        {user.accountStatus}
                      </Badge>
                    </div>

                    {/* Key Information */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{user.userId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium text-right">{user.department}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Joined:</span>
                        <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Role-specific stats */}
                    {user.role === 'user' && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">{user.currentBorrowedBooks || 0}</div>
                            <div className="text-xs text-gray-600">Current Loans</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">{user.totalBooksBorrowed || 0}</div>
                            <div className="text-xs text-gray-600">Total Borrowed</div>
                          </div>
                        </div>
                        {(user.outstandingFines || 0) > 0 && (
                          <div className="mt-2 pt-2 border-t text-center">
                            <div className="text-sm font-semibold text-red-600">
                              ${(user.outstandingFines || 0).toFixed(2)} in fines
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(user.role === 'librarian' || user.role === 'admin') && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {user.role === 'admin' ? 'System Administrator' : 'Library Staff'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {user.role === 'admin' ? 'Full Access' : 'Library Operations'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('edit', user.id)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction('delete', user.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && users.length > 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users match your filters</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your role filters to see more users.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setRoleFilters(new Set(['admin', 'librarian', 'user']))}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            )}
            {users.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-6">Get started by adding your first user to the system.</p>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add First User
                  </Button>
                </CardContent>
              </Card>
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
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Book
              </Button>
            </div>

            {/* Filter Bar */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by status:</span>
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
                        {books.filter(b => b.status === 'available').length}
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
                        {books.filter(b => b.status === 'low-stock').length}
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
                        {books.filter(b => b.status === 'out-of-stock').length}
                      </Badge>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusFilters(new Set(['available', 'low-stock', 'out-of-stock']))}
                      className="text-xs"
                    >
                      Show All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusFilters(new Set())}
                      className="text-xs"
                    >
                      Clear Filters
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
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-gray-600">by {book.author}</p>
                          <p className="text-xs text-gray-500">ISBN: {book.isbn}</p>
                        </div>
                        <Badge className={getStatusColor(book.status)}>
                          {book.status}
                        </Badge>
                        <div className="text-sm text-gray-600">
                          {book.availableCopies}/{book.totalCopies} available
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookAction('view', book.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookAction('edit', book.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookAction('delete', book.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
                    <p className="text-gray-600 mb-6">Try adjusting your status filters to see more books.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setStatusFilters(new Set(['available', 'low-stock', 'out-of-stock']))}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset Filters
                    </Button>
                  </div>
                )}
                {books.length === 0 && (
                  <div className="py-16 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No books found</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first book to the library.</p>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add First Book
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Database Management</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Database className="w-4 h-4 mr-2" />
                        Backup Database
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">User Management</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Users className="w-4 h-4 mr-2" />
                        Bulk User Import
                      </Button>
                      <Button variant="outline" size="sm">
                        <Shield className="w-4 h-4 mr-2" />
                        Role Permissions
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">System Configuration</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        General Settings
                      </Button>
                      <Button variant="outline" size="sm">
                        <Activity className="w-4 h-4 mr-2" />
                        Activity Logs
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