import { useState } from "react";
import { Link } from "react-router-dom";
import { User, HelpCircle, Download, Bookmark, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/use-auth";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

export default function BookPreview() {
  const { user, loading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleLoginClick = () => setIsLoginModalOpen(true);
  const handleRegisterClick = () => setIsRegisterModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);

  const handleDownload = () => {
    // Download functionality would be implemented here
    alert("Download functionality would be implemented here");
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

      {/* Preview Banner */}
      <div className="w-full bg-brand-orange py-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white text-4xl font-afacad">
            This is a preview.{" "}
            <button className="underline hover:no-underline">Log in</button>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back to results */}
        <Link
          to="/search?q=great"
          className="text-4xl font-afacad text-black underline hover:no-underline mb-8 inline-block"
        >
          Back to results
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Book Cover */}
          <div className="flex flex-col items-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8735e231eacb5a17e4e62943e74038923c3735d?width=1234"
              alt="The Great Gatsby book cover"
              className="w-full max-w-md h-auto object-cover rounded-lg shadow-lg mb-8"
            />

            <div className="text-center mb-8">
              <p className="text-4xl font-alexandria text-gray-600">
                ISBN: 9781476740553
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-sm space-y-4">
              <Button 
                onClick={handleDownload}
                className="w-full h-20 bg-brand-orange hover:bg-brand-orange-light text-white rounded-sm"
              >
                <Download size={32} className="mr-4" />
                <span className="text-4xl font-abhaya">Download</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-20 border-4 border-brand-border-light rounded-sm"
              >
                <Bookmark size={32} className="mr-4" />
                <span className="text-4xl font-abhaya text-black">Save</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-20 border-4 border-brand-border-light rounded-sm"
              >
                <Quote size={32} className="mr-4" />
                <span className="text-4xl font-abhaya text-black">Cite</span>
              </Button>
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-8">
            <div>
              <p className="text-4xl font-alexandria text-gray-500 mb-2">
                Book
              </p>
              <h1 className="text-8xl font-adamina text-black leading-tight mb-6">
                The Great Gatsby
              </h1>
              <p className="text-4xl font-alexandria text-black mb-4">
                Scott F. Fitzgerald
              </p>
              <p className="text-3xl font-alexandria text-black">
                Psychological fiction
              </p>
            </div>

            {/* Book Description */}
            <div className="bg-white">
              <p className="text-3xl font-alexandria text-black leading-relaxed text-justify">
                "The Great Gatsby, F. Scott Fitzgerald's third book, stands as
                the supreme achievement of his career. This exemplary novel of
                the Jazz Age has been acclaimed by generations of readers. The
                story of the fabulously wealthy Jay Gatsby and his love for the
                beautiful Daisy Buchanan, of lavish parties on Long Island at a
                time when The New York Times noted "gin was the national drink
                and sex the national obsession," it is an exquisitely crafted
                tale of America in the 1920s. The Great Gatsby is one of the
                great classics of twentieth-century literature."--Back cover.
              </p>
            </div>
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
