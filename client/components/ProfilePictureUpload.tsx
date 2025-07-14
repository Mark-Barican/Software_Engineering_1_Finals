import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Camera, 
  X, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Download,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ProfilePictureUploadProps {
  onUploadSuccess?: () => void;
  className?: string;
}

export default function ProfilePictureUpload({ onUploadSuccess, className }: ProfilePictureUploadProps) {
  const { user, fetchUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get profile picture URL
  const getProfilePictureUrl = useCallback((userId: string) => {
    return `/api/profile/picture/${userId}?t=${Date.now()}`;
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
    setScale(1);
    setRotation(0);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setUploadSuccess(true);
        setSelectedFile(null);
        setPreviewUrl(null);
        await fetchUser(); // Refresh user data
        onUploadSuccess?.();
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
          detail: { userId: user.id } 
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        const error = await response.json();
        setUploadError(error.message || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!user) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUploadSuccess(true);
        await fetchUser(); // Refresh user data
        onUploadSuccess?.();
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
          detail: { userId: user.id } 
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        const error = await response.json();
        setUploadError(error.message || 'Failed to remove picture');
      }
    } catch (error) {
      setUploadError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setUploadSuccess(false);
    setScale(1);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(3, newScale)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          Upload a profile picture. Supported formats: JPG, PNG, GIF. Max size: 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Profile Picture */}
        {user?.profilePicture && !selectedFile && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="relative">
              <img
                src={getProfilePictureUrl(user.id)}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Current Picture</p>
              <p className="text-xs text-gray-500">
                Uploaded: {new Date(user.profilePicture.uploadDate).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemovePicture}
              disabled={isUploading}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* File Selection */}
        {!selectedFile && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Click to select an image or drag and drop
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Choose Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview and Controls */}
        {selectedFile && previewUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedFile.name}
                </Badge>
                <span className="text-sm text-gray-500">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Image Preview */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <div className="flex items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-64 object-contain"
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Image Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4 text-gray-500" />
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="w-20"
                />
                <ZoomIn className="w-4 h-4 text-gray-500" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Picture
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-600">Profile picture updated successfully!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 