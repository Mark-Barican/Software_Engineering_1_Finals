import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, X, ArrowLeft } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSuccess(true);
      // In production, an email would be sent with the reset link
      toast.success("If your email exists in our system, you'll receive a password reset link shortly.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 pt-16 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-black hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="p-12">
          {!success ? (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-actor text-black mb-2">
                  Forgot Password?
                </h2>
                <p className="text-gray-600 font-actor">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <Label htmlFor="email" className="text-black font-bold text-lg">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="mt-2 px-4 py-3 rounded-full border-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    disabled={loading}
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-orange-light text-white font-bold text-lg rounded-full hover:bg-brand-orange transition-all duration-200 disabled:opacity-60 hover:scale-105 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="text-center mt-6">
                <button
                  onClick={onBackToLogin}
                  className="flex items-center justify-center gap-2 text-brand-orange hover:text-brand-orange-light font-medium mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-4xl font-actor text-black mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 font-actor mb-8">
                If an account with that email exists, we've sent you a password reset link.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={onBackToLogin}
                  className="w-full py-4 bg-brand-orange-light text-white font-bold text-lg rounded-full hover:bg-brand-orange transition-colors"
                >
                  Back to Login
                </Button>
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 