import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, HelpCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "../hooks/use-auth";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { useEffect } from "react";

const RECENT_SEARCHES_KEY = "recentSearches";

const BookIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="4"
      y="3"
      width="16"
      height="18"
      rx="2"
      fill="#E5891C"
      stroke="#E5891C"
      strokeWidth="1.5"
    />
    <path d="M21 17L17 13L13 17H12V3H22V17H21Z" fill="#E5891C" />
    <line
      x1="10"
      y1="22"
      x2="22"
      y2="22"
      stroke="#E5891C"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 19 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.9054 14.3201C11.5507 15.373 9.8486 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 9.8488 15.3728 11.5512 14.3196 12.9059L18.5224 17.1087L17.1082 18.5229L12.9054 14.3201ZM2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 9.5244 13.4315 10.916 12.495 11.9743L11.9743 12.495C10.916 13.4315 9.5244 14 8 14C4.68629 14 2 11.3137 2 8Z"
      fill="#E5891C"
    />
  </svg>
);

export default function SearchHistory() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const navigate = useNavigate();

  // If not loading and not logged in, show login modal and overlay
  if (!loading && !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <LoginModal isOpen={true} onClose={() => navigate('/')} />
      </div>
    );
  }

  // If not loading and logged in, proceed with page content
  if (!loading && user) {
    // If not loading and logged in, redirect to homepage
    useEffect(() => {
      if (!loading && !user) {
        navigate("/", { replace: true });
      }
    }, [user, loading, navigate]);

    useEffect(() => {
      if (user) {
        // Fetch from backend if logged in
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        fetch('/api/search/history', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setRecentSearches(data.map((entry: any) => entry.query));
            } else {
              setRecentSearches([]);
            }
          })
          .catch(() => setRecentSearches([]));
      } else {
        // Fallback to localStorage
        const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
        setRecentSearches(stored);
      }
    }, [user]);

    const handleRegisterClick = () => setIsRegisterModalOpen(true);
    const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);

    const handleDeleteBrowsingData = () => {
      if (window.confirm("Are you sure you want to delete all browsing history? This action cannot be undone.")) {
        if (user) {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          fetch('/api/search/history', {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }).then(() => setRecentSearches([]));
        } else {
          localStorage.removeItem(RECENT_SEARCHES_KEY);
          setRecentSearches([]);
        }
        alert("Browsing history deleted.");
      }
    };

    const handleRunSearch = (query: string) => {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    };

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-brand-border-light bg-white">
          {!user && !loading && (
            <div className="flex items-center justify-center py-3 border-b border-brand-border-light">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-alkalami">
                  Have library access?{" "}
                  <button 
                    onClick={() => navigate('/')}
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
              <h1 className="text-7xl font-abhaya text-gray-700 ml-6">History</h1>
            </Link>

            <div className="flex items-center gap-3">
              <button disabled className="px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base hover:bg-gray-50 transition-colors">
                Register
              </button>
              <button disabled className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-full font-abhaya text-base hover:bg-brand-orange-light transition-colors">
                <User size={24} />
                Log in
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Delete Browsing Data */}
          <div className="flex items-center gap-2 mb-8">
            <Trash2 size={24} className="text-brand-orange" />
            <button 
              onClick={handleDeleteBrowsingData}
              className="text-brand-orange font-afacad text-2xl hover:underline"
            >
              Delete Browsing Data
            </button>
          </div>

          {/* Search Input */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search History"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-16 border-2 border-black rounded-full text-2xl font-afacad placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
              <Search
                className="absolute right-6 top-1/2 transform -translate-y-1/2 text-black"
                size={20}
              />
            </div>
          </div>
          {/* Recent Searches List */}
          <div className="max-w-4xl mx-auto space-y-4">
            {recentSearches.length === 0 ? (
              <div className="text-2xl text-gray-400 text-center">No recent searches.</div>
            ) : (
              recentSearches
                .filter(q => q.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((query, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white rounded-lg shadow p-4">
                    <span className="text-2xl font-afacad text-brand-text-secondary">{query}</span>
                    <button
                      onClick={() => handleRunSearch(query)}
                      className="px-4 py-2 bg-brand-orange text-white rounded-full font-abhaya text-base hover:bg-brand-orange-light transition-colors"
                    >
                      Search Again
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Modals */}
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={handleCloseRegisterModal}
        />
      </div>
    );
  }
}
