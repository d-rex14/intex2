import { Outlet, useLocation } from "react-router-dom";
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
  const { effectiveRoleIds, rolesLoading, loading, role } = useAuth();

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
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Access restricted</h2>
        <p className="mt-2 text-sm text-[var(--wt-text-2)]">
          Your account role ({role}) cannot view this page. The current tab is preserved so you can switch to another
          section from the sidebar.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
