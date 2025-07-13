import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    notifications: boolean;
    defaultSearch: string;
    displayMode: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from storage on mount
  useEffect(() => {
    const t = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (t) {
      setToken(t);
    }
    setLoading(false);
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

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ id: data.id || data._id, name: data.name, email: data.email });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    fetchUser();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
} 