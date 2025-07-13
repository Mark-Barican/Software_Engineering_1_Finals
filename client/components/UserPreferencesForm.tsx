import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Settings, Save } from "lucide-react";

interface UserPreferencesFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

interface UserPreferences {
  notifications: boolean;
  defaultSearch: string;
  displayMode: string;
}

export default function UserPreferencesForm({ onSave, onCancel }: UserPreferencesFormProps) {
  const { user, token, fetchUser } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: true,
    defaultSearch: "title",
    displayMode: "list",
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initialize preferences from user data
    if (user?.preferences) {
      setPreferences({
        notifications: user.preferences.notifications ?? true,
        defaultSearch: user.preferences.defaultSearch ?? "title",
        displayMode: user.preferences.displayMode ?? "list",
      });
    }
    setInitializing(false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
          preferences,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update preferences");
      }

      toast.success("Preferences updated successfully!");
      await fetchUser();
      onSave?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (initializing) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-abhaya text-brand-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6" />
          User Preferences
        </CardTitle>
        <CardDescription className="font-actor">
          Customize your library experience and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Notifications */}
          <div className="space-y-4">
            <div>
              <Label className="text-black font-bold text-lg">
                Notifications
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Receive email notifications about your library account and new books
              </p>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Switch
                id="notifications"
                checked={preferences.notifications}
                onCheckedChange={(checked) => handlePreferenceChange("notifications", checked)}
                disabled={loading}
              />
              <Label htmlFor="notifications" className="text-base font-medium">
                Enable email notifications
              </Label>
            </div>
          </div>

          {/* Default Search */}
          <div className="space-y-4">
            <div>
              <Label className="text-black font-bold text-lg">
                Default Search Field
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Choose the default search field when searching for books
              </p>
            </div>
            <RadioGroup
              value={preferences.defaultSearch}
              onValueChange={(value) => handlePreferenceChange("defaultSearch", value)}
              disabled={loading}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <RadioGroupItem value="title" id="search-title" />
                <Label htmlFor="search-title" className="text-base font-medium cursor-pointer">
                  Title
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <RadioGroupItem value="author" id="search-author" />
                <Label htmlFor="search-author" className="text-base font-medium cursor-pointer">
                  Author
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <RadioGroupItem value="keyword" id="search-keyword" />
                <Label htmlFor="search-keyword" className="text-base font-medium cursor-pointer">
                  Keyword
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <RadioGroupItem value="isbn" id="search-isbn" />
                <Label htmlFor="search-isbn" className="text-base font-medium cursor-pointer">
                  ISBN
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Display Mode */}
          <div className="space-y-4">
            <div>
              <Label className="text-black font-bold text-lg">
                Display Mode
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Choose how search results and book listings are displayed
              </p>
            </div>
            <RadioGroup
              value={preferences.displayMode}
              onValueChange={(value) => handlePreferenceChange("displayMode", value)}
              disabled={loading}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <RadioGroupItem value="list" id="display-list" />
                <Label htmlFor="display-list" className="text-base font-medium cursor-pointer">
                  List View
                </Label>
                <span className="text-sm text-gray-500 ml-2">
                  Books displayed in a detailed list format
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <RadioGroupItem value="grid" id="display-grid" />
                <Label htmlFor="display-grid" className="text-base font-medium cursor-pointer">
                  Grid View
                </Label>
                <span className="text-sm text-gray-500 ml-2">
                  Books displayed in a grid with cover images
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <RadioGroupItem value="compact" id="display-compact" />
                <Label htmlFor="display-compact" className="text-base font-medium cursor-pointer">
                  Compact View
                </Label>
                <span className="text-sm text-gray-500 ml-2">
                  Dense list with minimal information
                </span>
              </div>
            </RadioGroup>
          </div>

          <div className="border-t pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">About Your Preferences</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Changes are saved automatically to your account</li>
                <li>• You can update these settings at any time</li>
                <li>• Your preferences are synced across all devices</li>
                <li>• Email notifications can be disabled at any time</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-brand-orange-light text-white font-bold text-lg rounded-full hover:bg-brand-orange transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 py-3 border-gray-400 text-black font-bold text-lg rounded-full hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 