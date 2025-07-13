import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useNavigate } from "react-router-dom";
import ForgotPasswordModal from "./ForgotPasswordModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoogleLogin = () => {
    // Google login logic would go here
    console.log("Google login clicked");
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Login failed");
      } else {
        // Store JWT token
        if (rememberMe) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
        await fetchUser();
        setSuccess("Login successful!");
        setTimeout(() => {
          setSuccess("");
          onClose();
          
          // Handle post-login navigation and refresh
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            // Default navigation - redirect to My Account page
            navigate("/my-account");
          }
          
          // Refresh the page after successful login
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }, 1200);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 pt-16 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="p-12">
          {/* Title */}
          <h2 className="text-5xl font-actor text-black text-center mb-12">
            Log In
          </h2>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 px-6 border border-gray-300 rounded-full flex items-center justify-center gap-3 mb-8 hover:bg-gray-50 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              Continue with Google
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center mb-8">
            <div className="flex-1 h-px bg-black"></div>
            <span className="px-4 text-black font-bold">or</span>
            <div className="flex-1 h-px bg-black"></div>
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-black font-bold text-lg mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter an email address"
              className="w-full px-6 py-3 border border-gray-400 rounded-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-black font-bold text-lg mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-6 py-3 border border-gray-400 rounded-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="mb-8">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 border border-black rounded mr-3 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
              <span className="text-black text-sm">Remember me</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 text-red-600 text-center font-bold">{error}</div>
          )}
          {/* Success Message */}
          {success && (
            <div className="mb-4 text-green-600 text-center font-bold">{success}</div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-brand-orange-light text-white font-bold text-lg rounded-full hover:bg-brand-orange transition-all duration-200 disabled:opacity-60 hover:scale-105 disabled:hover:scale-100"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              "Log in"
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-brand-orange hover:text-brand-orange-light font-medium underline"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
