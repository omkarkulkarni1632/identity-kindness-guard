import { Navigate } from "react-router-dom";
import { useAuth, type PlatformRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: PlatformRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.platform_role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground">
            Your role ({user.platform_role}) does not have access to this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
