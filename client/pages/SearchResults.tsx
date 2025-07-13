import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import {
  Search,
  ChevronDown,
  User,
  HelpCircle,
  Download,
  Bookmark,
  Quote,
  BookOpen,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

// Mock search results data matching the Figma design
const searchResults = [
  {
    id: 1,
    title: "Sometimes a Great Notion",
    author: "Ken Kesey",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/2317efad8487bf8bdeee4fcc13e8f8a64e8dc306?width=334",
    hasDownload: true,
    hasReadOnline: false,
  },
  {
    id: 2,
    title: "The Great Divorce",
    author: "C.S. Lewis",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/79b68601f2a8971604c71ff5cd5cebeddd29f4bf?width=333",
    hasDownload: true,
    hasReadOnline: false,
  },
  {
    id: 3,
    title: "The Great Wall of China",
    author: "Franz Kafka",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/bda1bead17f9d868a5a74ec57185e8d880dd4105?width=329",
    hasDownload: true,
    hasReadOnline: false,
  },
  {
    id: 4,
    title: "The Great Depression and the Great Recession",
    author: "F. Scott Fitzgerald",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/434dedace7c7d57369634b25533ff8274338c542?width=338",
    hasDownload: false,
    hasReadOnline: true,
  },
  {
    id: 5,
    title: "The Great Gatsby",
    author: "Harold James",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/4d1e82e2e44be4f6344a8edb761420ae9581ab72?width=324",
    hasDownload: false,
    hasReadOnline: true,
  },
  {
    id: 6,
    title: "The Great Shark Hunt",
    author: "Hunter S. Thompson",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/895a624e5785be40c895996d23ad5404db0da5ca?width=354",
    hasDownload: false,
    hasReadOnline: true,
  },
  {
    id: 7,
    title: "Great Jones Street",
    author: "Don DeLilo",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/8c136e6dad01596121f5e87d520301d65870097c?width=356",
    hasDownload: false,
    hasReadOnline: true,
  },
  {
    id: 8,
    title: "The Great Train Robbery",
    author: "Michael Crichton",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/a30313d09ecd7461f17905836ed57d82380addaa?width=366",
    hasDownload: false,
    hasReadOnline: true,
  },
];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const query = searchParams.get("q") || "";
  const [refineQuery, setRefineQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    searchWithin: false,
    contentType: false,
    language: true,
    date: true,
    accessType: false,
  });
  const [accessType, setAccessType] = useState("everything");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [contentTypes, setContentTypes] = useState({
    journals: false,
    bookChapters: false,
    researchReports: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLoginClick = () => setIsLoginModalOpen(true);
  const handleRegisterClick = () => setIsRegisterModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);

  const handleDownload = (bookTitle: string) => {
    alert(`Download functionality for "${bookTitle}" would be implemented here`);
  };

  const handleReadOnline = (bookTitle: string) => {
    alert(`Read online functionality for "${bookTitle}" would be implemented here`);
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
                  onClick={handleLoginClick}
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
          </Link>

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

      <div className="flex">
        {/* Left Sidebar - Filters */}
        <div className="w-[419px] bg-gradient-to-b from-white via-brand-orange-gradient to-orange-200 border-r border-brand-border-light">
          <div className="p-6">
            <h2 className="text-4xl font-abhaya font-bold text-amber-900 mb-8">
              Refine Results
            </h2>

            {/* Search Within Results */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("searchWithin")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-xl font-afacad font-semibold text-amber-900 uppercase tracking-wide">
                  Search Within Results
                </span>
                {expandedSections.searchWithin ? (
                  <ChevronUp size={16} className="text-white" />
                ) : (
                  <ChevronDown size={16} className="text-white" />
                )}
              </button>
              {expandedSections.searchWithin && (
                <div className="mt-2">
                  <div className="relative">
                    <Input
                      type="text"
                      value={refineQuery}
                      onChange={(e) => setRefineQuery(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 border border-gray-400 rounded-sm"
                    />
                    <Search
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      size={20}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Type */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("contentType")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-xl font-afacad font-semibold text-amber-900 uppercase tracking-wide">
                  Content Type
                </span>
                {expandedSections.contentType ? (
                  <ChevronUp size={16} className="text-white" />
                ) : (
                  <ChevronDown size={16} className="text-white" />
                )}
              </button>
              {expandedSections.contentType && (
                <div className="mt-4 ml-4 space-y-4">
                  <p className="text-xl font-afacad text-gray-700 mb-4">
                    Academic content:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="journals"
                        checked={contentTypes.journals}
                        onCheckedChange={(checked) =>
                          setContentTypes((prev) => ({
                            ...prev,
                            journals: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="journals"
                        className="text-xl font-afacad text-gray-700"
                      >
                        Journals (4,530,883)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="bookChapters"
                        checked={contentTypes.bookChapters}
                        onCheckedChange={(checked) =>
                          setContentTypes((prev) => ({
                            ...prev,
                            bookChapters: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="bookChapters"
                        className="text-xl font-afacad text-gray-700"
                      >
                        Book Chapters (1,198,581)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="researchReports"
                        checked={contentTypes.researchReports}
                        onCheckedChange={(checked) =>
                          setContentTypes((prev) => ({
                            ...prev,
                            researchReports: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="researchReports"
                        className="text-xl font-afacad text-gray-700"
                      >
                        Research Reports (46,332)
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("date")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-xl font-afacad font-semibold text-gray-700 uppercase tracking-wide">
                  Date
                </span>
                <HelpCircle size={24} className="text-gray-700 ml-2" />
                {expandedSections.date ? (
                  <ChevronDown size={16} className="text-black ml-auto" />
                ) : (
                  <ChevronDown size={16} className="text-black ml-auto" />
                )}
              </button>
            </div>

            {/* Language */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("language")}
                className="flex items-center justify-between w-full p-4 bg-transparent border-0"
              >
                <span className="text-xl font-afacad font-semibold text-gray-700 uppercase tracking-wide">
                  Language
                </span>
                {expandedSections.language ? (
                  <ChevronDown size={16} className="text-black" />
                ) : (
                  <ChevronDown size={16} className="text-black" />
                )}
              </button>
            </div>

            {/* Access Type */}
            <div className="mb-6">
              <h3 className="text-xl font-afacad font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Access Type
              </h3>
              <RadioGroup
                value={accessType}
                onValueChange={setAccessType}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value="everything"
                    id="everything"
                    className="w-4 h-4"
                  />
                  <Label
                    htmlFor="everything"
                    className="text-xl font-afacad text-black"
                  >
                    Everything
                  </Label>
                </div>
                <div className="text-xl font-afacad text-gray-600 ml-7 leading-tight">
                  See all results, including content you
                  <br />
                  cannot download or read online
                </div>
                <div className="flex items-center space-x-3 mt-6">
                  <RadioGroupItem
                    value="accessible"
                    id="accessible"
                    className="w-4 h-4"
                  />
                  <Label
                    htmlFor="accessible"
                    className="text-xl font-afacad text-black"
                  >
                    Content I can access
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Sort Controls */}
          <div className="flex justify-end mb-6">
            <button className="flex items-center gap-2 px-4 py-2 border border-brand-border-light rounded-sm">
              <span className="font-abhaya text-base">Sort by: Relevance</span>
              <ChevronDown size={24} />
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid gap-8">
            {searchResults.map((book, index) => (
              <div key={book.id} className="flex gap-6">
                {/* Book Cover */}
                <div className="w-40 flex-shrink-0">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-auto object-cover rounded"
                  />
                </div>

                {/* Book Details */}
                <div className="flex-1">
                  {book.title === "The Great Gatsby" ? (
                    <Link to="/book/the-great-gatsby">
                      <h3 className="text-4xl font-afacad text-black underline mb-2 leading-tight hover:text-brand-orange transition-colors">
                        {book.title}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className="text-4xl font-afacad text-black underline mb-2 leading-tight">
                      {book.title}
                    </h3>
                  )}
                  <p className="text-3xl font-afacad text-gray-500 underline mb-4">
                    {book.author}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="w-56 flex-shrink-0 space-y-3">
                  {book.hasDownload ? (
                    <Button 
                      onClick={() => handleDownload(book.title)}
                      className="w-full h-12 bg-brand-orange hover:bg-brand-orange-light text-white font-abhaya text-2xl rounded-sm"
                    >
                      <Download size={24} className="mr-2" />
                      Download
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleReadOnline(book.title)}
                      className="w-full h-12 bg-brand-orange hover:bg-brand-orange-light text-white font-abhaya text-2xl rounded-sm"
                    >
                      <BookOpen size={24} className="mr-2" />
                      Read Online
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full h-12 border-brand-border-light font-abhaya text-2xl rounded-sm"
                  >
                    <Bookmark size={24} className="mr-2" />
                    Save
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-12 border-brand-border-light font-abhaya text-2xl rounded-sm"
                  >
                    <Quote size={24} className="mr-2" />
                    Cite
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={handleCloseRegisterModal}
      />
    </div>
  );
}
