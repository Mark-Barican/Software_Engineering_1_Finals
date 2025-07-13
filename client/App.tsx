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

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/" replace />;
}

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/advanced-search" element={<AdvancedSearch />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/search-history" element={<SearchHistory />} />
            <Route path="/book/the-great-gatsby" element={<BookPreview />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/my-account" element={<PrivateRoute><MyAccount /></PrivateRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
