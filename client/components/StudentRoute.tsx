import { useAuth } from "../hooks/use-auth";
import { Navigate } from "react-router-dom";

interface StudentRouteProps {
  children: React.ReactNode;
}

export default function StudentRoute({ children }: StudentRouteProps) {
  const { user, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'user') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 