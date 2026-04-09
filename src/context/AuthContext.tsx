import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Provider, Session, User } from "@supabase/supabase-js";
import {
  type LegacyRoleLabel,
  resolveEffectiveRoleIds,
  roleIdsToDisplayLabel,
} from "../lib/roles";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AssuranceLevel = "aal1" | "aal2" | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** Best-effort label for UI (derived from effective role ids). */
  role: LegacyRoleLabel;
  /** Raw `role_id` values from `user_roles` (empty if unauthenticated or fetch pending/error). */
  roleIds: number[];
  /** Same as `roleIds` after metadata / MEMBER fallback — use for authorization checks. */
  effectiveRoleIds: number[];
  /** Initial auth session loading. */
  loading: boolean;
  /** Loading `user_roles` for the current user. */
  rolesLoading: boolean;
  rolesError: string | null;
  /** Current authenticator assurance level (null before check). */
  aal: AssuranceLevel;
  /** Whether the user has verified TOTP factors enrolled. */
  hasMfaFactor: boolean;
  refetchRoles: () => void;
  refreshAal: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signInWithOAuth: (
    provider: Extract<Provider, "google">,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  /** `user.id` only after `user_roles` has been fetched for that user (success or error). */
  const [rolesFetchedForUserId, setRolesFetchedForUserId] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesTick, setRolesTick] = useState(0);
  const [aal, setAal] = useState<AssuranceLevel>(null);
  const [hasMfaFactor, setHasMfaFactor] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) {
      setRoleIds([]);
      setRolesFetchedForUserId(null);
      setRolesError(null);
      return;
    }

    const uid = session.user.id;
    let cancelled = false;
    setRolesError(null);

    supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", uid)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setRolesError(error.message);
          setRoleIds([]);
        } else {
          const ids = (data ?? [])
            .map((row) => row.role_id)
            .filter(
              (id): id is number =>
                typeof id === "number" && Number.isFinite(id),
            );
          setRoleIds(ids);
        }
        setRolesFetchedForUserId(uid);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, rolesTick]);

  const refetchRoles = useCallback(() => {
    setRolesTick((t) => t + 1);
  }, []);

  const refreshAal = useCallback(async () => {
    if (!supabase) {
      setAal(null);
      setHasMfaFactor(false);
      return;
    }
    try {
      const { data } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setAal(
        (data?.currentLevel as AssuranceLevel) ?? null,
      );
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified =
        factors?.totp?.filter((f) => f.status === "verified") ?? [];
      setHasMfaFactor(verified.length > 0);
    } catch {
      setAal(null);
      setHasMfaFactor(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      refreshAal();
    } else {
      setAal(null);
      setHasMfaFactor(false);
    }
  }, [session?.user?.id, refreshAal]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setRoleIds([]);
    setRolesError(null);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    /** True until the first `user_roles` response for this session user (avoids access checks with stale []). */
    const rolesLoading = Boolean(
      isSupabaseConfigured && user?.id && rolesFetchedForUserId !== user.id,
    );
    /** Until `user_roles` returns, do not assume MEMBER — avoids flashing wrong nav. */
    const effectiveRoleIds =
      user && isSupabaseConfigured && rolesLoading
        ? []
        : resolveEffectiveRoleIds(roleIds, user);
    const role = roleIdsToDisplayLabel(effectiveRoleIds);

    return {
      session,
      user,
      role,
      roleIds,
      effectiveRoleIds,
      loading,
      rolesLoading,
      rolesError,
      aal,
      hasMfaFactor,
      refetchRoles,
      refreshAal,
      signInWithPassword: async (email: string, password: string) => {
        if (!supabase) {
          return {
            error:
              "Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.",
          };
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };
        return {};
      },
      signUpWithPassword: async (email: string, password: string) => {
        if (!supabase) {
          return {
            error:
              "Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.",
          };
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) return { error: error.message };
        return {
          needsEmailConfirmation: Boolean(data.user && !data.session),
        };
      },
      signInWithOAuth: async (provider) => {
        if (!supabase) {
          return {
            error:
              "Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.",
          };
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) return { error: error.message };
        return {};
      },
      signOut,
    };
  }, [
    session,
    loading,
    roleIds,
    rolesFetchedForUserId,
    rolesError,
    aal,
    hasMfaFactor,
    refetchRoles,
    refreshAal,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
