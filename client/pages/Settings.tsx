import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  BookOpen, 
  Settings as SettingsIcon,
  Save,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserPreferences {
  defaultSearch: 'title' | 'author' | 'keyword' | 'isbn';
  displayMode: 'grid' | 'list';
  itemsPerPage: 10 | 20 | 50;
  showBookCovers: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    overdue: boolean;
    reservations: boolean;
    newBooks: boolean;
    systemUpdates: boolean;
  };
}

export default function Settings() {
  const { user, fetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: user?.department || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultSearch: 'title',
    displayMode: 'grid',
    itemsPerPage: 20,
    showBookCovers: true,
    notifications: {
      email: true,
      browser: true,
      overdue: true,
      reservations: true,
      newBooks: false,
      systemUpdates: true
    }
  });

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        department: user.department || ""
      }));
    }
  }, [user]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          department: profileData.department
        })
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        await fetchUser(); // Refresh user data
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (profileData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: "Password Changed",
          description: "Your password has been changed successfully.",
        });
        setProfileData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          preferences
        })
      });

      if (response.ok) {
        toast({
          title: "Preferences Saved",
          description: "Your preferences have been saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save preferences",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted successfully.",
        });
        // Redirect to home page
        window.location.href = '/';
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-abhaya text-brand-orange mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter your department"
                  />
                </div>
                <Button onClick={handleProfileSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={saving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Changing Password...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Preferences */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive updates about your library account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.email}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Browser Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.browser}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, browser: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Overdue Book Reminders</Label>
                      <p className="text-sm text-gray-500">Get notified when books are overdue</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.overdue}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, overdue: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Reservation Updates</Label>
                      <p className="text-sm text-gray-500">Get notified when reserved books are available</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.reservations}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, reservations: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">New Book Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about new books in your department</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.newBooks}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, newBooks: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">System Updates</Label>
                      <p className="text-sm text-gray-500">Receive important system announcements</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.systemUpdates}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, systemUpdates: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={handlePreferencesSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Notification Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Library Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Library Preferences
                </CardTitle>
                <CardDescription>
                  Customize your library browsing experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Default Search Field</Label>
                  <RadioGroup
                    value={preferences.defaultSearch}
                    onValueChange={(value: 'title' | 'author' | 'keyword' | 'isbn') =>
                      setPreferences(prev => ({ ...prev, defaultSearch: value }))
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="title" id="search-title" />
                      <Label htmlFor="search-title">Title</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="author" id="search-author" />
                      <Label htmlFor="search-author">Author</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="keyword" id="search-keyword" />
                      <Label htmlFor="search-keyword">Keyword</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="isbn" id="search-isbn" />
                      <Label htmlFor="search-isbn">ISBN</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">Display Mode</Label>
                  <RadioGroup
                    value={preferences.displayMode}
                    onValueChange={(value: 'grid' | 'list') =>
                      setPreferences(prev => ({ ...prev, displayMode: value }))
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="grid" id="display-grid" />
                      <Label htmlFor="display-grid">Grid View</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="list" id="display-list" />
                      <Label htmlFor="display-list">List View</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">Items Per Page</Label>
                  <RadioGroup
                    value={preferences.itemsPerPage.toString()}
                    onValueChange={(value) =>
                      setPreferences(prev => ({ ...prev, itemsPerPage: parseInt(value) as 10 | 20 | 50 }))
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="10" id="items-10" />
                      <Label htmlFor="items-10">10 items</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="20" id="items-20" />
                      <Label htmlFor="items-20">20 items</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="50" id="items-50" />
                      <Label htmlFor="items-50">50 items</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Show Book Covers</Label>
                    <p className="text-sm text-gray-500">Display book cover images in search results</p>
                  </div>
                  <Switch
                    checked={preferences.showBookCovers}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, showBookCovers: checked }))
                    }
                  />
                </div>

                <Button onClick={handlePreferencesSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Library Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Management */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Account Management
                </CardTitle>
                <CardDescription>
                  Manage your account settings and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Account Status</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your account is active and in good standing
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {user.role}
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">User ID</Label>
                    <p className="text-sm text-gray-600 mt-1">{user.userId || 'Not assigned'}</p>
                  </div>
                                     <div>
                     <Label className="text-base font-medium">Member Since</Label>
                     <p className="text-sm text-gray-600 mt-1">Unknown</p>
                   </div>
                   <div>
                     <Label className="text-base font-medium">Last Login</Label>
                     <p className="text-sm text-gray-600 mt-1">Unknown</p>
                   </div>
                </div>

                <div className="border-t pt-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-900">Danger Zone</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleAccountDeletion}
                          disabled={saving}
                          className="mt-3 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {saving ? 'Deleting Account...' : 'Delete Account'}
                        </Button>
                      </div>
                    </div>
                  </div>
        </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 