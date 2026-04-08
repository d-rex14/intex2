import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccessPath } from "../lib/roles";
import { isSupabaseConfigured } from "../lib/supabase";

function CenteredSpinner() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Enforces `user_roles`-driven access for nested `/admin/*` routes. Without Supabase env,
 * all authenticated users may open portal routes (local dev).
 */
export function RequirePortalAccess() {
  const location = useLocation();
  const { effectiveRoleIds, rolesLoading, loading } = useAuth();

  if (loading) {
    return <CenteredSpinner />;
  }

  if (isSupabaseConfigured && rolesLoading) {
    return <CenteredSpinner />;
  }

  if (!isSupabaseConfigured) {
    return <Outlet />;
  }

  if (!canAccessPath(effectiveRoleIds, location.pathname)) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
