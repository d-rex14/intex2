import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Provider, Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Role = 'admin' | 'staff' | 'donor' | 'unknown'

interface AuthContextValue {
  session: Session | null
  user: User | null
  role: Role
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithPassword: (email: string, password: string) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>
  signInWithOAuth: (provider: Extract<Provider, 'google' | 'github'>) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function inferRole(user: User | null): Role {
  const fromMeta =
    (user?.user_metadata?.role as string | undefined) ??
    (user?.app_metadata?.role as string | undefined)

  const r = (fromMeta ?? '').toLowerCase()
  if (r === 'admin' || r === 'staff' || r === 'donor') return r
  return user ? 'unknown' : 'unknown'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return
        setSession(data.session ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setSession(null)
        setLoading(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null
    const role = inferRole(user)

    return {
      session,
      user,
      role,
      loading,
      signInWithPassword: async (email: string, password: string) => {
        if (!supabase) {
          return {
            error:
              'Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.',
          }
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        return {}
      },
      signUpWithPassword: async (email: string, password: string) => {
        if (!supabase) {
          return {
            error:
              'Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.',
          }
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) return { error: error.message }
        return {
          needsEmailConfirmation: Boolean(data.user && !data.session),
        }
      },
      signInWithOAuth: async provider => {
        if (!supabase) {
          return {
            error:
              'Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.',
          }
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) return { error: error.message }
        return {}
      },
      signOut: async () => {
        if (!supabase) return
        await supabase.auth.signOut()
      },
    }
  }, [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

