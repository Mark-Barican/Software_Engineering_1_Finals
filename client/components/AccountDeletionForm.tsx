import React, { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface AccountDeletionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AccountDeletionForm({ onSuccess, onCancel }: AccountDeletionFormProps) {
  const { token, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationChecks, setConfirmationChecks] = useState({
    understand: false,
    permanent: false,
    dataLoss: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allChecksComplete = Object.values(confirmationChecks).every(Boolean);
  const canSubmit = allChecksComplete && password.length > 0;

  const handleCheckboxChange = (key: keyof typeof confirmationChecks) => {
    setConfirmationChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete account");
      }

      toast.success("Account deleted successfully");
      logout();
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-red-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-abhaya text-red-700 flex items-center gap-2">
          <Trash2 className="w-6 h-6" />
          Delete Account
        </CardTitle>
        <CardDescription className="font-actor text-red-600">
          Permanently delete your account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Warning Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-800 mb-2">Warning: This action cannot be undone</h4>
                <p className="text-sm text-red-700 mb-3">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Your profile information and preferences</li>
                  <li>• Your search history and saved books</li>
                  <li>• Your reading lists and bookmarks</li>
                  <li>• All account data and settings</li>
                  <li>• Access to any borrowed or reserved books</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkboxes */}
          <div className="space-y-4">
            <Label className="text-black font-bold text-lg">
              Please confirm you understand the consequences:
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="understand"
                  checked={confirmationChecks.understand}
                  onCheckedChange={() => handleCheckboxChange("understand")}
                  disabled={loading}
                />
                <Label htmlFor="understand" className="text-sm font-medium leading-5">
                  I understand that deleting my account will permanently remove all my data and cannot be recovered.
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="permanent"
                  checked={confirmationChecks.permanent}
                  onCheckedChange={() => handleCheckboxChange("permanent")}
                  disabled={loading}
                />
                <Label htmlFor="permanent" className="text-sm font-medium leading-5">
                  I understand that this action is permanent and irreversible.
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="dataLoss"
                  checked={confirmationChecks.dataLoss}
                  onCheckedChange={() => handleCheckboxChange("dataLoss")}
                  disabled={loading}
                />
                <Label htmlFor="dataLoss" className="text-sm font-medium leading-5">
                  I accept that all my library data, preferences, and history will be permanently lost.
                </Label>
              </div>
            </div>
          </div>

          {/* Password Confirmation */}
          <div className="space-y-4">
            <Label htmlFor="password" className="text-black font-bold text-lg">
              Enter your password to confirm <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="px-4 py-3 pr-12 rounded-full border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="flex-1 py-3 bg-red-600 text-white font-bold text-lg rounded-full hover:bg-red-700 transition-all duration-200 disabled:opacity-60 hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete My Account
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 border-gray-400 text-black font-bold text-lg rounded-full hover:bg-gray-50 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Need help instead?</h4>
            <p className="text-sm text-gray-600 mb-3">
              If you're having issues with your account, consider these alternatives:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Update your preferences in the settings page</li>
              <li>• Change your password if you're concerned about security</li>
              <li>• Contact library support for assistance</li>
              <li>• Temporarily disable email notifications</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 