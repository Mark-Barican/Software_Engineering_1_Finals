import React, { useState } from 'react';
import { Upload, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BulkUserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function BulkUserImportModal({ isOpen, onClose, onImportSuccess }: BulkUserImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (selectedFile && selectedFile.type === 'text/csv') {
        setFile(selectedFile);
      } else {
        toast.error('Invalid file type. Please upload a .csv file.');
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import.');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Import Successful', {
          description: `${result.successCount} users imported. ${result.errorCount} failures.`,
        });
        onImportSuccess();
        onClose();
      } else {
        toast.error('Import Failed', {
          description: result.message || 'An unknown error occurred.',
        });
      }
    } catch (error) {
      toast.error('Import Failed', {
        description: 'Could not connect to the server.',
      });
    } finally {
      setIsImporting(false);
      setFile(null);
    }
  };
  
  const downloadTemplate = () => {
    const csvContent = "name,email,password,role\nJohn Doe,john.doe@example.com,password123,user\nJane Smith,jane.smith@example.com,password456,librarian";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "user_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Bulk User Import</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {file ? (
                <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-purple-600" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-gray-400" />
                    <span className="font-medium">Click to upload a file</span>
                    <span className="text-sm text-gray-500">CSV files only</span>
                </div>
              )}
            </label>
          </div>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p className="font-semibold">Required CSV format:</p>
            <p className="font-mono text-xs">name,email,password,role</p>
            <p className="mt-2">The 'role' column must be one of: <code className="font-mono text-xs">admin</code>, <code className="font-mono text-xs">librarian</code>, or <code className="font-mono text-xs">user</code>.</p>
            <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={downloadTemplate}>
              <Download className="w-3 h-3 mr-1"/>
              Download Template
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? 'Importing...' : 'Import Users'}
          </Button>
        </div>
      </div>
    </div>
  );
} 