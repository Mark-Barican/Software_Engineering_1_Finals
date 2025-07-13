import { useState } from "react";
import { ChevronDown, User, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

export default function AdvancedSearch() {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    genre: "All fields",
    language: "All Languages",
    fromDate: "",
    toDate: "",
    journalTitle: "",
    isbn: "",
  });

  const [selectedFilters, setSelectedFilters] = useState({
    articles: false,
    researchReports: false,
    reviews: false,
    books: false,
    miscellaneous: false,
  });

  const [selectedGenres, setSelectedGenres] = useState({
    crime: false,
    romance: false,
    fantasy: false,
    action: false,
    mystery: false,
    comedy: false,
    horror: false,
    poetry: false,
    drama: false,
    historical: false,
    children: false,
    youngAdult: false,
    philosophical: false,
    science: false,
  });

  const handleLoginClick = () => setIsLoginModalOpen(true);
  const handleRegisterClick = () => setIsRegisterModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);

  const handleLoginSuccess = () => {
    // After successful login, redirect to My Account page
    navigate("/my-account");
  };

  const handleRegistrationSuccess = () => {
    // After successful registration, show login modal
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (filter: string, checked: boolean) => {
    setSelectedFilters((prev) => ({ ...prev, [filter]: checked }));
  };

  const handleGenreChange = (genre: string, checked: boolean) => {
    setSelectedGenres((prev) => ({ ...prev, [genre]: checked }));
  };

  const handleSubmit = () => {
    console.log("Advanced search submitted:", {
      formData,
      selectedFilters,
      selectedGenres,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Same as main page */}
      <div className="border-b border-brand-border-light bg-white">
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
          <HelpCircle size={24} className="absolute right-12 top-3" />
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Link to="/">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/0ec6016b55469bdd045398e228e52ebbbb309517?width=158"
                alt="Logo"
                className="h-22 w-20"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-6xl font-abhaya text-black mb-16">
          Advanced Search
        </h1>

        {/* Search Form */}
        <div className="mb-16">
          <p className="text-2xl font-abhaya text-brand-text-primary mb-8">
            Construct your search inquiry
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Title */}
            <div>
              <label className="block text-2xl font-afacad text-brand-text-secondary uppercase mb-4">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-2xl font-afacad text-brand-text-secondary uppercase mb-4">
                Genre
              </label>
              <div className="relative">
                <select
                  value={formData.genre}
                  onChange={(e) => handleInputChange("genre", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-400 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-brand-orange"
                >
                  <option value="All fields">All fields</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Academic">Academic</option>
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  size={20}
                />
              </div>
            </div>
          </div>

          {/* Author */}
          <div className="mb-8">
            <label className="block text-2xl font-afacad text-brand-text-secondary uppercase mb-4">
              Author
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => handleInputChange("author", e.target.value)}
              className="w-full lg:w-1/2 px-4 py-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="bg-brand-orange text-white px-8 py-4 rounded-full text-2xl font-afacad font-semibold hover:bg-brand-orange-light transition-colors"
          >
            Submit Advanced Search
          </button>
        </div>

        {/* Narrow Search */}
        <div className="mb-16">
          <h2 className="text-6xl font-abhaya text-black mb-8">
            Narrow Search
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { key: "articles", label: "Articles" },
              { key: "researchReports", label: "Research Reports" },
              { key: "reviews", label: "Reviews" },
              { key: "miscellaneous", label: "Miscellaneous" },
              { key: "books", label: "Books" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedFilters[key as keyof typeof selectedFilters]}
                  onChange={(e) => handleFilterChange(key, e.target.checked)}
                  className="w-5 h-5 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
                <span className="text-2xl font-afacad text-brand-text-secondary underline">
                  {label}
                </span>
              </label>
            ))}
          </div>

          {/* Language */}
          <div className="mb-8">
            <label className="block text-2xl font-afacad text-brand-text-secondary uppercase mb-4">
              Language
            </label>
            <div className="relative w-64">
              <select
                value={formData.language}
                onChange={(e) => handleInputChange("language", e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                <option value="All Languages">All Languages</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                size={20}
              />
            </div>
          </div>

          {/* Publication Date */}
          <div className="mb-8">
            <label className="block text-2xl font-afacad text-brand-text-secondary uppercase mb-4">
              Publication Date
            </label>
            <div className="flex items-center gap-4 mb-2">
              <div>
                <label className="block text-xl font-afacad text-gray-600 uppercase mb-2">
                  From
                </label>
                <input
                  type="text"
                  value={formData.fromDate}
                  onChange={(e) =>
                    handleInputChange("fromDate", e.target.value)
                  }
                  className="w-48 px-4 py-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
              <div>
                <label className="block text-xl font-afacad text-gray-600 uppercase mb-2">
                  To
                </label>
                <input
                  type="text"
                  value={formData.toDate}
                  onChange={(e) => handleInputChange("toDate", e.target.value)}
                  className="w-48 px-4 py-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>
            <p className="text-xl font-afacad text-gray-500 underline">
              (yyyy or yyyy/mm or yyyy/mm/dd)
            </p>
          </div>

          {/* Journal or Book Title */}
          <div className="mb-8">
            <label className="block text-xl font-afacad text-gray-600 uppercase mb-2">
              Journal or Book Title
            </label>
            <input
              type="text"
              value={formData.journalTitle}
              onChange={(e) =>
                handleInputChange("journalTitle", e.target.value)
              }
              className="w-full lg:w-2/3 px-4 py-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          {/* ISBN */}
          <div className="mb-8">
            <label className="block text-xl font-afacad text-gray-600 uppercase mb-2">
              ISBN
            </label>
            <input
              type="text"
              value={formData.isbn}
              onChange={(e) => handleInputChange("isbn", e.target.value)}
              className="w-full lg:w-2/3 px-4 py-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>
        </div>

        {/* Advanced Filter */}
        <div>
          <h2 className="text-4xl font-abhaya text-black mb-8">
            Advanced Filter
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "crime", label: "Crime (129 titles)" },
              { key: "romance", label: "Romance (68 titles)" },
              { key: "fantasy", label: "Fantasy (13 titles)" },
              { key: "action", label: "Action (12 titles)" },
              { key: "mystery", label: "Mystery (87 titles)" },
              { key: "comedy", label: "Comedy (91 titles)" },
              { key: "horror", label: "Horror (15 titles)" },
              { key: "poetry", label: "Poetry (115 titles)" },
              { key: "drama", label: "Drama (47 titles)" },
              { key: "historical", label: "Historical (173 titles)" },
              { key: "children", label: "Children (141 titles)" },
              { key: "youngAdult", label: "Young Adult (12 titles)" },
              { key: "philosophical", label: "Philosophical (17 titles)" },
              { key: "science", label: "Science (165 titles)" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedGenres[key as keyof typeof selectedGenres]}
                  onChange={(e) => handleGenreChange(key, e.target.checked)}
                  className="w-4 h-5 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
                <span className="text-2xl font-afacad text-brand-text-secondary underline">
                  {label}
                </span>
              </label>
            ))}
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
