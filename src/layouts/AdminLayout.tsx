import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ClipboardList,
  FileText,
  FolderOpen,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { RequirePortalAccess } from "../components/RequirePortalAccess";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { canAccessNavPath } from "../lib/roles";
import { isSupabaseConfigured } from "../lib/supabase";
import watchtowerLogo from "../assets/branding/watchtower-logo-transparent.png";

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/donors', label: 'Donations and Allocations', icon: Users },
  { to: '/portal/caseload', label: 'Caseload Inventory', icon: FolderOpen },
  { to: '/portal/process-recordings', label: 'Process Recordings', icon: FileText },
  { to: '/portal/visitations', label: 'Visitations', icon: ClipboardList },
  { to: '/portal/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/portal/your-donations', label: 'Your Donations', icon: Heart },
  { to: '/portal/site-users', label: 'Site Users', icon: UserCog },
]

export function AdminLayout() {
  const { user, role, signOut, effectiveRoleIds, rolesLoading } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (isSupabaseConfigured && rolesLoading) {
        return item.to === '/portal';
      }
      return canAccessNavPath(effectiveRoleIds, item.to);
    });
  }, [effectiveRoleIds, rolesLoading]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div
        className={`flex h-20 items-center border-b border-[var(--wt-border)] px-4 ${
          collapsed && !mobile ? "justify-center" : "gap-3"
        }`}
      >
        <img
          src={watchtowerLogo}
          alt="Watchtower Sanctuary"
          className="h-16 w-auto shrink-0 object-contain"
        />
        {(!collapsed || mobile) && (
          <div>
            <span className="font-display text-sm font-bold text-[var(--wt-text)]">
              Portal
            </span>
            <p className="text-[10px] text-[var(--wt-text-2)] uppercase tracking-widest">
              Staff Portal
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] text-[var(--wt-text)] border border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)]"
                  : "text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)]"
              } ${collapsed && !mobile ? "justify-center" : ""}`
            }
            title={collapsed && !mobile ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--wt-border)] p-3">
        {(!collapsed || mobile) && (
          <div className="mb-2 px-2 py-1.5 rounded-lg bg-[var(--wt-surface)] border border-[var(--wt-border)]">
            <p className="text-xs font-medium text-[var(--wt-text)] truncate">
              {user?.email}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--wt-accent)] font-medium">
              {role}
            </p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,#dc2626_12%,transparent)] hover:text-[#dc2626] transition-colors ${
            collapsed && !mobile ? "justify-center" : ""
          }`}
        >
          <LogOut size={16} />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--wt-bg)] text-[var(--wt-text)] flex">
      <aside
        className={`hidden md:flex md:sticky md:top-0 md:h-screen flex-col border-r border-[var(--wt-border)] bg-[var(--wt-surface)] transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-[var(--wt-surface)] border-r border-[var(--wt-border)] flex flex-col z-10">
            <button
              className="absolute top-4 right-4 text-[var(--wt-text-2)] hover:text-[var(--wt-text)]"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[var(--wt-border)] bg-[color-mix(in_srgb,var(--wt-bg)_90%,transparent)] backdrop-blur-md px-4 gap-3">
          <button
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)] transition-colors"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>

          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)] transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--wt-accent)]" />
          </button>

          <Link
            to="/"
            className="text-xs text-[var(--wt-text-2)] hover:text-[var(--wt-text)] transition-colors hidden sm:block"
          >
            ← Public Site
          </Link>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <RequirePortalAccess />
        </main>
      </div>
    </div>
  );
}
