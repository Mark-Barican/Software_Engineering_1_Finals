import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Shield, 
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any; // user is optional for add mode
  onSave: (updatedUser: any) => void;
  mode: 'add' | 'edit';
}

export default function UserEditModal({ isOpen, onClose, user, onSave, mode }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    role: "user",
    status: "active",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        role: user.role || "user",
        status: user.status || "active",
        password: ""
      });
    } else if (mode === 'add') {
      setFormData({
        name: "",
        email: "",
        department: "",
        role: "user",
        status: "active",
        password: ""
      });
    }
  }, [user, mode]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim() || (mode === 'add' && !formData.password.trim())) {
      toast.error("Name, email, and password are required");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let response;
      if (mode === 'edit' && user) {
        response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        response = await fetch(`/api/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      }
      if (response.ok) {
        const updatedUser = await response.json();
        onSave(updatedUser.user);
        toast.success(mode === 'add' ? "User created successfully" : "User updated successfully");
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || (mode === 'add' ? "Failed to create user" : "Failed to update user"));
      }
    } catch (error) {
      toast.error(mode === 'add' ? "Failed to create user" : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'librarian': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (mode === 'edit' && !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {mode === 'add' ? 'Add New User' : 'Edit User'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {mode === 'edit' && user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="font-medium font-mono bg-gray-100 px-2 py-1 rounded text-sm">{user.userId || 'Not assigned'}</p>
                    <p className="text-xs text-gray-500 mt-1">User IDs cannot be modified once assigned</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge className={getStatusColor(user.status || 'active')}>
                      {user.status || 'active'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Add/Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>{mode === 'add' ? 'New User Details' : 'Edit User Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              {mode === 'add' && (
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Student</SelectItem>
                      <SelectItem value="librarian">Librarian</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="status">Account Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Important Limitations</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• <strong>User IDs cannot be edited</strong> - they are used throughout the system for tracking loans, fines, and reservations</li>
                  <li>• Changing a user's role may affect their access permissions</li>
                  <li>• Account status changes will immediately affect the user's ability to borrow books</li>
                  <li>• For major corrections, consider creating a new account and migrating essential data</li>
                </ul>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? (mode === 'add' ? 'Creating...' : 'Saving...') : (mode === 'add' ? 'Create User' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 