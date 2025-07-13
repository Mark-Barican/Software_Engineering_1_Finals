import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertCircle, RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "./ui/use-toast";

// Error types
export interface AppError {
  message: string;
  type: 'network' | 'auth' | 'validation' | 'server' | 'generic';
  code?: string;
  details?: any;
}

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-abhaya">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We encountered an unexpected error. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 p-3 rounded text-xs">
              <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
              <pre className="whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Network status indicator
export function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
    } else {
      const timer = setTimeout(() => setShowOffline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOffline) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Alert className={`${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <AlertDescription className={isOnline ? 'text-green-800' : 'text-red-800'}>
            {isOnline ? 'Connection restored' : 'You are offline'}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}

// Error alert component
export function ErrorAlert({ 
  error, 
  onRetry, 
  onDismiss, 
  className = "" 
}: { 
  error: AppError; 
  onRetry?: () => void; 
  onDismiss?: () => void;
  className?: string;
}) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="w-4 h-4" />;
      case 'auth':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'network':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'auth':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-red-200 bg-red-50 text-red-800';
    }
  };

  return (
    <Alert className={`${getErrorColor()} ${className}`}>
      {getErrorIcon()}
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        {error.message}
        {error.details && (
          <div className="mt-2 text-xs opacity-75">
            {typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              <XCircle className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Success notification component
export function SuccessNotification({ 
  message, 
  onDismiss, 
  autoHide = true, 
  duration = 3000 
}: { 
  message: string; 
  onDismiss?: () => void; 
  autoHide?: boolean; 
  duration?: number;
}) {
  useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  return (
    <Alert className="border-green-200 bg-green-50 text-green-800">
      <CheckCircle className="w-4 h-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <XCircle className="w-3 h-3" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Async operation handler hook
export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = async (operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const appError = parseError(err);
      setError(appError);
      throw appError;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return { loading, error, data, execute, reset };
}

// Error parsing utility
function parseError(error: any): AppError {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: 'Network connection failed. Please check your internet connection.',
      type: 'network',
      code: 'NETWORK_ERROR'
    };
  }

  if (error.status === 401) {
    return {
      message: 'Your session has expired. Please log in again.',
      type: 'auth',
      code: 'AUTH_ERROR'
    };
  }

  if (error.status === 403) {
    return {
      message: 'You do not have permission to perform this action.',
      type: 'auth',
      code: 'PERMISSION_ERROR'
    };
  }

  if (error.status >= 400 && error.status < 500) {
    return {
      message: error.message || 'Invalid request. Please check your input.',
      type: 'validation',
      code: 'VALIDATION_ERROR'
    };
  }

  if (error.status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      type: 'server',
      code: 'SERVER_ERROR'
    };
  }

  return {
    message: error.message || 'An unexpected error occurred.',
    type: 'generic',
    code: 'UNKNOWN_ERROR'
  };
}

// Toast notification helpers
export const showErrorToast = (error: AppError) => {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  });
};

export const showSuccessToast = (message: string) => {
  toast({
    title: "Success",
    description: message,
  });
};

export const showLoadingToast = (message: string) => {
  toast({
    title: "Loading",
    description: message,
  });
}; 