import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProfileEditForm from "../components/ProfileEditForm";
import PasswordChangeForm from "../components/PasswordChangeForm";
import UserPreferencesForm from "../components/UserPreferencesForm";
import AccountDeletionForm from "../components/AccountDeletionForm";
import SessionManagement from "../components/SessionManagement";
import { FadeIn, StaggeredFadeIn } from "../components/PageTransition";
import { 
  User, 
  Settings, 
  Lock, 
  Trash2, 
  ArrowLeft, 
  Shield, 
  Bell, 
  Mail, 
  Calendar,
  Activity,
  Monitor
} from "lucide-react";

export default function MyAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const handleProfileSaved = () => {
    // Could show a success message or redirect
    console.log("Profile saved successfully");
  };

  const handlePasswordChanged = () => {
    // Could show a success message
    console.log("Password changed successfully");
  };

  const handlePreferencesSaved = () => {
    // Could show a success message
    console.log("Preferences saved successfully");
  };

  const handleAccountDeleted = () => {
    navigate("/");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-abhaya mb-4">Please log in to access your account</h1>
          <Link
            to="/"
            className="px-6 py-3 bg-brand-orange text-white rounded-full font-bold hover:bg-brand-orange-light transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-brand-border-light bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-black hover:text-brand-orange"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Library
              </Button>
              
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Logo" className="h-12 w-12" />
                <div>
                  <h1 className="text-2xl font-abhaya font-bold text-brand-text-primary">
                    My Account
                  </h1>
                  <p className="text-sm text-brand-text-secondary">
                    Manage your library account and preferences
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <Lock className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - User Overview */}
          <FadeIn delay={100}>
            <div className="lg:col-span-1">
              <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-abhaya">{user.name}</CardTitle>
                <CardDescription className="font-actor">{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account Status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(new Date())}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Login</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(new Date())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </FadeIn>

          {/* Main Content Area */}
          <FadeIn delay={200}>
            <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Preferences
                </TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Account
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-abhaya font-bold text-brand-text-primary">
                      Profile Information
                    </h2>
                    <p className="text-brand-text-secondary font-actor">
                      Update your personal information and contact details
                    </p>
                  </div>
                  
                  <ProfileEditForm onSave={handleProfileSaved} />
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-abhaya font-bold text-brand-text-primary">
                      Security Settings
                    </h2>
                    <p className="text-brand-text-secondary font-actor">
                      Manage your password and account security
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Password
                        </CardTitle>
                        <CardDescription>
                          Last changed: {formatDate(new Date())}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PasswordChangeForm onSuccess={handlePasswordChanged} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Account Security
                        </CardTitle>
                        <CardDescription>
                          Additional security measures for your account
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">Two-Factor Authentication</h4>
                              <p className="text-sm text-gray-600">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                            <Badge variant="secondary">Coming Soon</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">Login History</h4>
                              <p className="text-sm text-gray-600">
                                View recent login activity
                              </p>
                            </div>
                            <Badge variant="secondary">Coming Soon</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-abhaya font-bold text-brand-text-primary">
                      User Preferences
                    </h2>
                    <p className="text-brand-text-secondary font-actor">
                      Customize your library experience and notifications
                    </p>
                  </div>
                  
                  <UserPreferencesForm onSave={handlePreferencesSaved} />
                </div>
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-abhaya font-bold text-brand-text-primary">
                      Session Management
                    </h2>
                    <p className="text-brand-text-secondary font-actor">
                      View and manage your active sessions across all devices
                    </p>
                  </div>
                  
                  <SessionManagement />
                </div>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-abhaya font-bold text-brand-text-primary">
                      Account Management
                    </h2>
                    <p className="text-brand-text-secondary font-actor">
                      Manage your account settings and data
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          Email Settings
                        </CardTitle>
                        <CardDescription>
                          Manage your email preferences and communication
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">Email Notifications</h4>
                              <p className="text-sm text-gray-600">
                                {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                            <Badge variant={user.preferences?.notifications ? "default" : "secondary"}>
                              {user.preferences?.notifications ? 'On' : 'Off'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Account Activity
                        </CardTitle>
                        <CardDescription>
                          Your recent library activity and statistics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">0</div>
                              <div className="text-sm text-blue-800">Books Borrowed</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">0</div>
                              <div className="text-sm text-green-800">Searches Made</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                          <Trash2 className="w-5 h-5" />
                          Delete Account
                        </CardTitle>
                        <CardDescription className="text-red-600">
                          Permanently delete your account and all associated data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AccountDeletionForm onSuccess={handleAccountDeleted} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
} 