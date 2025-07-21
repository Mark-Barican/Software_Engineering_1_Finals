import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import AdvancedSearch from "./pages/AdvancedSearch";
import SearchResults from "./pages/SearchResults";
import SearchHistory from "./pages/SearchHistory";
import BookPreview from "./pages/BookPreview";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import MyAccount from "./pages/MyAccount";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import { PageLoader } from "./components/LoadingOverlay";
import PageTransition from "./components/PageTransition";
import { ErrorBoundary, NetworkStatusIndicator } from "./components/ErrorHandler";
import GoogleAuthHandler from "./pages/GoogleAuthHandler";
import GeneralSettings from "./pages/GeneralSettings";
import ActivityLogs from './pages/ActivityLogs';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, initialLoading } = useAuth();
  if (initialLoading) return <PageLoader message="Loading your account..." />;
  return user ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, initialLoading, isAdmin } = useAuth();
  if (initialLoading) return <PageLoader message="Loading your account..." />;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/my-account" replace />;
  return children;
}

function LibrarianRoute({ children }: { children: JSX.Element }) {
  const { user, initialLoading, isLibrarian } = useAuth();
  if (initialLoading) return <PageLoader message="Loading your account..." />;
  if (!user) return <Navigate to="/" replace />;
  if (!isLibrarian) return <Navigate to="/my-account" replace />;
  return children;
}

function StudentRoute({ children }: { children: JSX.Element }) {
  const { user, initialLoading, isUser } = useAuth();
  if (initialLoading) return <PageLoader message="Loading your account..." />;
  if (!user) return <Navigate to="/" replace />;
  if (!isUser) return <Navigate to="/my-account" replace />;
  return children;
}

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NetworkStatusIndicator />
          <BrowserRouter>
            <PageTransition>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/advanced-search" element={<AdvancedSearch />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/search-history" element={<SearchHistory />} />
                <Route path="/book/the-great-gatsby" element={<BookPreview />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/my-account" element={<PrivateRoute><MyAccount /></PrivateRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><GeneralSettings /></AdminRoute>} />
                <Route path="/admin/activity-logs" element={<AdminRoute><ActivityLogs /></AdminRoute>} />
                <Route path="/librarian" element={<LibrarianRoute><LibrarianDashboard /></LibrarianRoute>} />
                <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/login" element={<GoogleAuthHandler />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
