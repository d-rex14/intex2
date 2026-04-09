import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  Cog,
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
import { isSupabaseConfigured, supabase } from "../lib/supabase";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    {
      notification_id: number;
      title: string;
      body: string | null;
      created_at: string;
      read_at: string | null;
      type: string;
      payload_json: Record<string, unknown> | null;
    }[]
  >([]);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (isSupabaseConfigured && rolesLoading) {
        return item.to === '/portal';
      }
      return canAccessNavPath(effectiveRoleIds, item.to);
    });
  }, [effectiveRoleIds, rolesLoading]);

  const portalLabel = role === 'donor' ? 'Donor Portal' : 'Staff Portal';
  const unreadCount = useMemo(() => notifications.filter(n => !n.read_at).length, [notifications]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openProfileEditor = () => {
    const fallbackName =
      (user?.user_metadata?.display_name as string | undefined)?.trim() ||
      (user?.user_metadata?.name as string | undefined)?.trim() ||
      "";
    setProfileName(fallbackName);
    setProfileEmail(user?.email ?? "");
    setProfileError(null);
    setProfileNotice(null);
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    if (!supabase || !user) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileNotice(null);
    const nextEmail = profileEmail.trim();
    const nextName = profileName.trim();
    const metadata = {
      ...(user.user_metadata ?? {}),
      display_name: nextName || null,
      name: nextName || null,
    };
    const { error } = await supabase.auth.updateUser({
      email: nextEmail || undefined,
      data: metadata,
    });
    if (error) setProfileError(error.message);
    else setProfileNotice("Profile updated. If email changed, check your inbox for confirmation.");
    setProfileSaving(false);
  };

  const refreshNotifications = useCallback(async () => {
    if (!supabase || !user?.id) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    const { data, error } = await supabase
      .from('notifications')
      .select('notification_id, title, body, created_at, read_at, type, payload_json')
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) setNotificationsError(error.message);
    else setNotifications((data ?? []) as typeof notifications);
    setNotificationsLoading(false);
  }, [user?.id]);

  const markAllRead = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const unread = notifications.filter(n => !n.read_at).map(n => n.notification_id);
    if (unread.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_user_id', user.id)
      .is('read_at', null);
    if (error) setNotificationsError(error.message);
    else await refreshNotifications();
  }, [notifications, user?.id, refreshNotifications]);

  const clearNotifications = useCallback(async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!token || !baseUrl || !anonKey) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await fetch(`${baseUrl}/functions/v1/admin-site-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'X-Supabase-Access-Token': token,
        },
        body: JSON.stringify({ action: 'clear_notifications', clear_type: 'all' }),
      });
      const text = await res.text();
      const body = text ? (JSON.parse(text) as { error?: string }) : {};
      if (!res.ok || body.error) {
        setNotificationsError(body.error ?? `Failed to clear notifications (${res.status})`);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      setNotificationsError(e instanceof Error ? e.message : String(e));
    }
    setNotificationsLoading(false);
  }, []);

  const markOneRead = useCallback(async (notificationId: number) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .is('read_at', null);
    if (!error) {
      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, read_at: new Date().toISOString() } : n));
    }
  }, []);

  const donationIdFromNotification = (n: (typeof notifications)[number]): number | null => {
    if (n.type !== 'donation_logged') return null;
    const donationId = n.payload_json?.donation_id;
    return typeof donationId === 'number' && Number.isInteger(donationId) ? donationId : null;
  };

  const syncAdminDonationLogs = useCallback(async (): Promise<boolean> => {
    if (!supabase || role !== 'admin') return false;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!token || !baseUrl || !anonKey) return false;
    try {
      const res = await fetch(`${baseUrl}/functions/v1/admin-site-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'X-Supabase-Access-Token': token,
        },
        body: JSON.stringify({ action: 'sync_donation_logs' }),
      });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  }, [role]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (role !== 'admin') return;
    void (async () => {
      const synced = await syncAdminDonationLogs();
      if (synced) await refreshNotifications();
    })();
  }, [role, syncAdminDonationLogs, refreshNotifications]);

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
              {portalLabel}
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
          <button
            type="button"
            onClick={openProfileEditor}
            className="mb-2 w-full px-2 py-1.5 rounded-lg bg-[var(--wt-surface)] border border-[var(--wt-border)] text-left hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_16%,transparent)] transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--wt-text)] truncate">
                  {user?.email}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--wt-accent)] font-medium">
                  {role}
                </p>
              </div>
              <Cog size={14} className="text-[var(--wt-text-2)] shrink-0" />
            </div>
          </button>
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
            onClick={() => {
              setNotificationsOpen(v => !v);
              void refreshNotifications();
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--wt-accent)]" />}
          </button>
          {notificationsOpen && (
            <div className="absolute right-16 top-12 z-40 w-80 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--wt-border)] flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-[var(--wt-text-2)]">Notifications</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => void markAllRead()} className="text-[10px] text-[var(--wt-accent)] uppercase tracking-widest">
                    Mark all read
                  </button>
                  <button type="button" onClick={() => void clearNotifications()} className="text-[10px] text-[#dc2626] uppercase tracking-widest">
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading ? (
                  <p className="px-3 py-4 text-sm text-[var(--wt-text-2)]">Loading…</p>
                ) : notificationsError ? (
                  <p className="px-3 py-4 text-sm text-[#dc2626]">{notificationsError}</p>
                ) : notifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[var(--wt-text-2)]">No notifications yet.</p>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.notification_id}
                      type="button"
                      onClick={() => {
                        void markOneRead(n.notification_id);
                        const donationId = donationIdFromNotification(n);
                        if (donationId != null) {
                          navigate('/portal/donors', { state: { openDonationId: donationId } });
                          setNotificationsOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-3 border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_10%,transparent)] ${n.read_at ? 'opacity-80' : ''}`}
                    >
                      <p className="text-sm text-[var(--wt-text)] font-medium">{n.title}</p>
                      <p className="text-xs text-[var(--wt-text-2)] mt-0.5">{n.body ?? '—'}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

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
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--wt-border)]">
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Edit Profile</h2>
              <p className="mt-1 text-sm text-[var(--wt-text-2)]">Update your name and email.</p>
            </div>
            <div className="p-6 space-y-3">
              {profileError && <p className="text-sm text-[#dc2626]">{profileError}</p>}
              {profileNotice && <p className="text-sm text-[var(--wt-accent)]">{profileNotice}</p>}
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest block">
                Display name
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest block">
                Email
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
            </div>
            <div className="p-6 pt-2 border-t border-[var(--wt-border)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm text-[var(--wt-text)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={profileSaving || !isSupabaseConfigured}
                className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {profileSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
