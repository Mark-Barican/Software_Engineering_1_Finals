import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronDown,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { useAuth } from "../hooks/use-auth";
import UserAvatar from "../components/UserAvatar";

const bookCovers = [
  {
    id: 1,
    title: "Sunrise on the Reaping",
    author: "suzanne collins",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/34edae358b26ed6a89538e9afac38d52f316c31c?width=339",
  },
  {
    id: 2,
    title: "Intermezzo",
    author: "sally rooney",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/13643314ca30ce6917105bcb4ffdce9b411d2806?width=317",
  },
  {
    id: 3,
    title: "Main Street Millionaire",
    author: "Codie sanchez",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/b3085b1bccc4fb6986e6b397dc396a1fe957eb91?width=348",
  },
  {
    id: 4,
    title: "The Emperor of Gladness",
    author: "ocean vuong",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/8a157da7bbdb17da560b2cfbafd3a86812ce7788?width=328",
  },
  {
    id: 5,
    title: "Never Flinch",
    author: "Stephen king",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/f221dededd14a380781475af812f35c224444d72?width=326",
  },
];

const heroBookCovers = [
  {
    image:
      "https://m.media-amazon.com/images/I/91xNmlf86yL.jpg",
    rotation: "-rotate-[6deg]",
    position: "top-24 left-32",
    shadow: "",
  },
  {
    image:
      "https://m.media-amazon.com/images/I/71O1It5N1VS.jpg",
    rotation: "rotate-[6deg]",
    position: "top-24 left-96",
    shadow: "",
  },
];

const RECENT_SEARCHES_KEY = "recentSearches";

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  let recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  recent = recent.filter((q: string) => q.toLowerCase() !== query.toLowerCase());
  recent.unshift(query);
  if (recent.length > 10) recent = recent.slice(0, 10);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout, loading, isAdmin, isLibrarian, isUser } = useAuth();

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setSuggestions(data.suggestions || []);
        setShowSuggestions((data.suggestions || []).length > 0);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [searchQuery]);

  // Hide suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  const handleLoginSuccess = () => {
    // After successful login, redirect to My Account page
    navigate("/my-account");
  };

  const handleRegistrationSuccess = () => {
    // After successful registration, show login modal
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      if (user) {
        const token = localStorage.getItem('token');
        fetch('/api/search/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query: searchQuery.trim() }),
        }).catch(() => {});
      }
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? 2 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="border-b border-brand-border-light bg-white">
        {!user && !loading && (
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
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/0ec6016b55469bdd045398e228e52ebbbb309517?width=158"
              alt="Logo"
              className="h-22 w-20"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"></div>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <button
                  onClick={() => navigate("/my-account")}
                  className="flex items-center gap-2 px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <UserAvatar user={user} size="sm" />
                  <span>{user.name}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                  >
                    Admin
                  </button>
                )}
                {isLibrarian && !isAdmin && (
                  <button
                    onClick={() => navigate("/librarian")}
                    className="px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    Librarian
                  </button>
                )}
                {isUser && !isAdmin && !isLibrarian && (
                  <button
                    onClick={() => navigate("/student")}
                    className="px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    My Library
                  </button>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
            <Link
              to="/settings"
              className="px-4 py-2 border border-brand-border-light rounded-full font-abhaya text-base hover:bg-brand-orange hover:text-white transition-colors flex items-center justify-center"
              style={{ minWidth: '48px', minHeight: '48px', width: '48px', height: '48px', padding: 0 }}
            >
              <img src="/settings.png" alt="Settings" className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-inknut font-normal text-black mb-8 max-w-4xl mx-auto leading-tight">
          Discover a world, organized for your ease.
        </h1>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search through a collection of written works"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-6 py-5 pr-16 border-2 border-black rounded-full text-base font-abhaya placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange"
              autoComplete="off"
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            />
            <button
              onClick={handleSearch}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 hover:text-brand-orange transition-colors"
            >
              <Search size={20} />
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="px-6 py-3 cursor-pointer hover:bg-brand-orange-light/20 text-base text-black"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/search-history"
              className="px-7 py-3 border-2 border-black rounded-full font-abhaya text-base hover:bg-gray-50 transition-colors"
            >
              Search History
            </Link>
            <Link
              to="/advanced-search"
              className="font-abhaya text-base underline hover:text-brand-orange transition-colors"
            >
              Advanced Search
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Section with Books */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white to-brand-orange-gradient min-h-screen">
        {/* Decorative Circles */}
        <div className="absolute inset-0">
          <div className="absolute w-[888px] h-[888px] rounded-full bg-gradient-to-b from-white via-white to-brand-orange-light opacity-80 top-64 right-0 transform translate-x-1/3"></div>
          <div className="absolute w-[488px] h-[488px] rounded-full bg-gradient-to-b from-white via-white to-brand-orange-light opacity-60 bottom-0 left-0 transform -translate-x-1/4"></div>
          <div className="absolute w-[165px] h-[165px] rounded-full bg-gradient-to-b from-white to-brand-orange-light bottom-32 left-96"></div>
          <div className="absolute w-[105px] h-[105px] rounded-full bg-gradient-to-b from-white to-brand-orange-light top-80 right-96"></div>
          <div className="absolute w-[54px] h-[54px] rounded-full bg-gradient-to-b from-white to-brand-orange-light bottom-72 right-80"></div>
        </div>

        <div className="relative z-10 px-6 py-16">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-abhaya font-bold text-brand-text-primary leading-tight">
                Books take you to a different world
              </h2>
              <p className="text-xl md:text-2xl font-actor text-brand-text-secondary leading-relaxed">
                All books are rich in story and knowledge and here, you are yet
                to discover thousands of these stories.
              </p>
              <button 
                onClick={() => navigate("/search")}
                className="bg-brand-orange text-white px-10 py-5 rounded-full text-2xl font-afacad font-bold tracking-tight hover:bg-brand-orange-light transition-colors"
              >
                BROWSE CATALOG
              </button>
            </div>

            {/* Right Content - Book Covers */}
            <div className="relative h-[700px] w-[700px] lg:h-[900px] lg:w-[900px] mx-auto overflow-visible flex items-center justify-center">
              {heroBookCovers.map((book, index) => (
                <img
                  key={index}
                  src={book.image}
                  alt="Book cover"
                  className={`absolute w-72 aspect-[2/3] object-cover rounded-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl ${book.rotation} ${book.position} ${book.shadow}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-inknut font-medium text-brand-text-primary text-center mb-16">
            NEW ARRIVALS
          </h2>

          <div className="relative">
            <button 
              onClick={handlePrevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={handleNextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight size={28} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {bookCovers.map((book) => (
                <div key={book.id} className="text-center space-y-4">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg mx-auto shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
                  />
                  <div className="space-y-1">
                    <p className="text-brand-text-muted text-sm font-abhaya uppercase tracking-wider">
                      {book.author}
                    </p>
                    <h3 className="text-lg font-abhaya text-black underline leading-tight">
                      {book.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={handleCloseRegisterModal}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
