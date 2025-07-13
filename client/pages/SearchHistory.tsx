import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, HelpCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "../hooks/use-auth";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

// Mock history data matching the Figma design
const historyData = [
  {
    date: "Today - July 1, 2025",
    entries: [
      {
        id: 1,
        time: "10:31 AM",
        description: "the great gatsby - Search Prompt",
        type: "search",
        checked: false,
      },
      {
        id: 2,
        time: "10:33 AM",
        description: "The Great Gatsby - Book",
        type: "book",
        checked: false,
      },
      {
        id: 3,
        time: "4:14 PM",
        description: "the great gatsby - Search Prompt",
        type: "search",
        checked: false,
      },
      {
        id: 4,
        time: "4:14 PM",
        description: "The Great Gatsby - Book",
        type: "book",
        checked: false,
      },
    ],
  },
  {
    date: "Yesterday - June 30, 2025",
    entries: [
      {
        id: 5,
        time: "12:34 PM",
        description: "The Great Gatsby - Book",
        type: "book",
        checked: false,
      },
      {
        id: 6,
        time: "12:37 PM",
        description: "Sometimes a Great Notion - Book",
        type: "book",
        checked: false,
      },
      {
        id: 7,
        time: "2:31 PM",
        description: "The Great Gatsby - Book",
        type: "book",
        checked: false,
      },
      {
        id: 8,
        time: "2:42 PM",
        description: "the great gatsby - Search Prompt",
        type: "search",
        checked: false,
      },
    ],
  },
];

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
  const [historyEntries, setHistoryEntries] = useState(historyData);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleEntryCheck = (sectionIndex: number, entryIndex: number) => {
    const newEntries = [...historyEntries];
    newEntries[sectionIndex].entries[entryIndex].checked =
      !newEntries[sectionIndex].entries[entryIndex].checked;
    setHistoryEntries(newEntries);
  };

  const handleLoginClick = () => setIsLoginModalOpen(true);
  const handleRegisterClick = () => setIsRegisterModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);

  const handleDeleteBrowsingData = () => {
    // This would typically show a confirmation dialog and then clear the data
    alert("Delete browsing data functionality would be implemented here");
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
            <h1 className="text-7xl font-abhaya text-gray-700 ml-6">History</h1>
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

        {/* History Sections */}
        <div className="max-w-6xl mx-auto space-y-8">
          {historyEntries.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-4xl font-afacad font-bold text-amber-900 mb-8">
                {section.date}
              </h2>

              <div className="space-y-6">
                {section.entries.map((entry, entryIndex) => (
                  <div key={entry.id} className="flex items-center gap-6">
                    <Checkbox
                      checked={entry.checked}
                      onCheckedChange={() =>
                        handleEntryCheck(sectionIndex, entryIndex)
                      }
                      className="w-6 h-6 border-2 border-gray-400"
                    />

                    <div className="text-3xl font-afacad text-gray-500 w-32">
                      {entry.time}
                    </div>

                    <div className="flex items-center gap-4">
                      {entry.type === "book" ? <BookIcon /> : <SearchIcon />}
                      <span className="text-3xl font-afacad text-brand-text-secondary">
                        {entry.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
