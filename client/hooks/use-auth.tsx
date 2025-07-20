import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'librarian' | 'user';
  userId?: string;
  department?: string;
  preferences?: {
    notifications: boolean;
    defaultSearch: string;
    displayMode: string;
  };
  profilePicture?: {
    data: string;
    contentType: string;
    fileName: string;
    uploadDate: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLibrarian: boolean;
  isUser: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load token from storage on mount
  useEffect(() => {
    const t = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (t) {
      setToken(t);
    }
    setInitialLoading(false);
  }, []);

  // Fetch user info if token changes
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ 
          id: data.id || data._id, 
          name: data.name, 
          email: data.email, 
          role: data.role || 'user',
          userId: data.userId,
          department: data.department,
          preferences: data.preferences,
          profilePicture: data.profilePicture
        });
      } else {
        setUser(null);
        if (res.status === 401) {
          // Token expired, clear storage
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setToken(null);
          toast.error("Session expired. Please log in again.");
        } else {
          toast.error("Failed to connect to the server. Please try again later.");
          setToken(null);
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        }
      }
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      toast.error("Could not connect to the server. Please check your connection or try again later.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshSession = useCallback(async () => {
    if (!token) return;
    try {
      await fetch("/api/sessions/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  };

  const isAuthenticated = !!user && !!token;

  // Role-based helper functions
  const isAdmin = user?.role === 'admin';
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';
  const isUser = !!user;
  
  const hasRole = (role: string) => {
    return user?.role === role;
  };
  
  const hasAnyRole = (roles: string[]) => {
    return !!user && roles.includes(user.role);
  };

  // Auto-refresh session every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshSession]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      initialLoading, 
      login, 
      logout, 
      fetchUser, 
      refreshSession, 
      isAuthenticated,
      isAdmin,
      isLibrarian,
      isUser,
      hasRole,
      hasAnyRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
} 