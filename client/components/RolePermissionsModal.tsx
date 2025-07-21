import React from 'react';
import { Shield, X, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const permissionLabels = {
  manageUsers: 'Manage Users',
  manageBooks: 'Manage Books',
  issueReturnBooks: 'Issue/Return Books',
  viewReports: 'View Reports',
  manageSettings: 'Manage Settings',
  performBackup: 'Perform Backup',
};

const permissionsByRole = {
  admin: {
    manageUsers: true,
    manageBooks: true,
    issueReturnBooks: true,
    viewReports: true,
    manageSettings: true,
    performBackup: true,
  },
  librarian: {
    manageUsers: false,
    manageBooks: true,
    issueReturnBooks: true,
    viewReports: true,
    manageSettings: false,
    performBackup: false,
  },
  user: {
    manageUsers: false,
    manageBooks: false,
    issueReturnBooks: false,
    viewReports: false,
    manageSettings: false,
    performBackup: false,
  },
};

export default function RolePermissionsModal({ isOpen, onClose }: RolePermissionsModalProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'librarian': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Role Permissions</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                {Object.values(permissionLabels).map(label => (
                  <TableHead key={label} className="text-center">{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(permissionsByRole).map(([role, perms]) => (
                <TableRow key={role}>
                  <TableCell>
                    <Badge className={`${getRoleColor(role)}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>
                  </TableCell>
                  {Object.keys(permissionLabels).map(key => (
                    <TableCell key={key} className="text-center">
                      {perms[key as keyof typeof perms] ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <Minus className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 