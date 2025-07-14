import React, { useCallback, useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { User } from 'lucide-react';

interface UserAvatarProps {
  user: {
    id: string;
    name: string;
    profilePicture?: {
      data: string;
      contentType: string;
      fileName: string;
      uploadDate: string;
    };
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

export default function UserAvatar({ user, size = 'md', className = '', showName = false }: UserAvatarProps) {
  const [imageKey, setImageKey] = useState(Date.now());

  // Get profile picture URL with cache busting
  const getProfilePictureUrl = useCallback((userId: string) => {
    return `/api/profile/picture/${userId}?t=${imageKey}`;
  }, [imageKey]);

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = (event: CustomEvent) => {
      if (event.detail.userId === user.id) {
        setImageKey(Date.now());
      }
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    };
  }, [user.id]);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  const fallbackSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        {user.profilePicture ? (
          <AvatarImage
            src={getProfilePictureUrl(user.id)}
            alt={user.name}
            className="object-cover"
            onError={(e) => {
              // Hide the image and show fallback on error
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <AvatarFallback className={`${fallbackSizeClasses[size]} bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium`}>
          {user.name ? getInitials(user.name) : <User className="w-1/2 h-1/2" />}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="font-medium text-gray-900">{user.name}</span>
      )}
    </div>
  );
} 