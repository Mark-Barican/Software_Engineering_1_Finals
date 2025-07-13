import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export default function LoadingOverlay({ 
  isLoading, 
  message = "Loading...", 
  className = "" 
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-16 ${className}`}>
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">{message}</p>
          <p className="text-sm text-gray-500 mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

// Loading spinner component for inline use
export function LoadingSpinner({ 
  size = "medium", 
  className = "" 
}: { 
  size?: "small" | "medium" | "large", 
  className?: string 
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6", 
    large: "w-8 h-8"
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

// Loading button component with spinner
export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText = "Loading...", 
  className = "",
  disabled = false,
  ...props 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} transition-all duration-200 ${
        isLoading || disabled 
          ? "opacity-60 cursor-not-allowed" 
          : "hover:scale-105"
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <LoadingSpinner size="small" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Skeleton loading component for content placeholders
export function SkeletonLoader({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number; 
  className?: string 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-300 rounded ${
            i < lines - 1 ? "mb-2" : ""
          } ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

// Page loading component with brand styling
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-abhaya font-bold text-brand-text-primary mb-2">
          {message}
        </h2>
        <p className="text-brand-text-secondary font-actor">
          Please wait while we load your content...
        </p>
      </div>
    </div>
  );
} 