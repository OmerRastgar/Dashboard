import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  module?: 'users' | 'roles' | 'logs' | 'dashboard';
}

export default function ProtectedRoute({ children, requiredPermission, module }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const permissions = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check module-level permissions
  const hasModuleAccess = () => {
    switch (module) {
      case 'users':
        return permissions.canAccessUsersModule();
      case 'roles':
        return permissions.canAccessRolesModule();
      case 'logs':
        return permissions.canAccessLogsModule();
      case 'dashboard':
        return permissions.canViewDashboard();
      default:
        return true;
    }
  };

  // Check specific permission if provided
  if (requiredPermission && !permissions.hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit">
              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Required permission: <code className="bg-muted px-2 py-1 rounded">{requiredPermission}</code>
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="text-primary hover:underline"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check module access
  if (module && !hasModuleAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit">
              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Module Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the {module} module.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button 
              onClick={() => window.history.back()} 
              className="text-primary hover:underline"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}