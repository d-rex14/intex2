import React from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { CookieConsent } from './components/CookieConsent'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import { AboutPage } from './pages/public/AboutPage'
import { BlogPage } from './pages/public/BlogPage'
import { ContactPage } from './pages/public/ContactPage'
import { DonationsPage } from './pages/public/DonationsPage'
import { HomePage } from './pages/public/HomePage'
import {
  BiologicalNeedsPage,
  EmpowermentPage,
  HealingPage,
  JusticePage,
  LoveBelongingPage,
  PhysiologicalNeedsPage,
  PsychologicalNeedsPage,
  SafetyPage,
  SocialNeedsPage,
  SpiritualNeedsPage,
} from './pages/public/ProgramPages'
import { SocialPage } from './pages/public/SocialPage'
import { CaseloadPage } from './pages/portal/CaseloadPage'
import { DashboardPage } from './pages/portal/DashboardPage'
import { DonorsContributionsPage } from './pages/portal/DonorsContributionsPage'
import { ProcessRecordingsPage } from './pages/portal/ProcessRecordingsPage'
import { ReportsPage } from './pages/portal/ReportsPage'
import { SiteUsersPage } from './pages/portal/SiteUsersPage'
import { YourDonationsPage } from './pages/portal/YourDonationsPage'
import { VisitationsPage } from './pages/portal/VisitationsPage'

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-[var(--wt-text-2)] max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="GDPR-aligned notice for how we use data and cookies.">
      <div className="max-w-none">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <p className="text-[var(--wt-text)] leading-relaxed">
            This site uses essential cookies to keep users signed in and store limited preferences (cookie consent).
            We do not sell personal data or use advertising trackers. Replace this text with your finalized policy.
          </p>
        </div>
      </div>
    </PageShell>
  )
}

function LoginPage() {
  const { signInWithPassword, signInWithOAuth, signUpWithPassword, session } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin')

  if (session) return <Navigate to="/portal" replace />

  const GoogleMark = () => (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.75 1.22 9.3 3.62l6.96-6.96C36.02 2.52 30.4 0 24 0 14.64 0 6.53 5.38 2.6 13.22l8.1 6.29C12.51 13.1 17.8 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.17 24.55c0-1.57-.14-3.07-.4-4.55H24v8.62h12.47c-.54 2.78-2.11 5.13-4.46 6.7l7.2 5.58c4.2-3.88 6.96-9.6 6.96-16.35Z"
      />
      <path
        fill="#FBBC05"
        d="M10.7 28.98a14.6 14.6 0 0 1 0-9.96l-8.1-6.29a24 24 0 0 0 0 22.54l8.1-6.29Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.4 0 12.02-2.11 16.02-5.73l-7.2-5.58c-2 1.34-4.56 2.13-8.82 2.13-6.2 0-11.49-3.6-13.3-8.51l-8.1 6.29C6.53 42.62 14.64 48 24 48Z"
      />
    </svg>
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    if (mode === 'signin') {
      const res = await signInWithPassword(email.trim(), password)
      if (res.error) setError(res.error)
    } else {
      const res = await signUpWithPassword(email.trim(), password)
      if (res.error) setError(res.error)
      else if (res.needsEmailConfirmation) {
        setNotice('Account created. Check your email to confirm your address, then return to sign in.')
        setMode('signin')
        setPassword('')
      } else {
        setNotice('Account created. You can continue to the portal.')
      }
    }
    setLoading(false)
  }

  return (
    <PageShell
      title={mode === 'signin' ? 'Staff Sign In' : 'Create your account'}
      subtitle={
        mode === 'signin'
          ? 'Use your organization credentials to access the portal.'
          : 'Create an account with email and password.'
      }
    >
      <div className="max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
              setNotice(null)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${
              mode === 'signin'
                ? 'bg-[var(--wt-accent)] text-white border-[var(--wt-accent)]'
                : 'bg-[var(--wt-bg)] text-[var(--wt-text)] border-[var(--wt-border)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)]'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
              setNotice(null)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${
              mode === 'signup'
                ? 'bg-[var(--wt-accent)] text-white border-[var(--wt-accent)]'
                : 'bg-[var(--wt-bg)] text-[var(--wt-text)] border-[var(--wt-border)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)]'
            }`}
          >
            Create account
          </button>
        </div>

        <div className="mb-4 grid gap-2">
          <button
            type="button"
            onClick={async () => {
              setLoading(true)
              setError(null)
              setNotice(null)
              const res = await signInWithOAuth('google')
              if (res.error) setError(res.error)
              setLoading(false)
            }}
            disabled={loading}
            className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-4 py-2 text-sm font-semibold text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <GoogleMark />
            Sign in with Google
          </button>
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-[var(--wt-border)]" />
            <span className="text-xs uppercase tracking-widest text-[var(--wt-text-2)]">or</span>
            <div className="h-px flex-1 bg-[var(--wt-border)]" />
          </div>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
            />
          </div>
          {notice && <p className="text-sm text-[var(--wt-text-2)]">{notice}</p>}
          {error && <p className="text-sm text-[#dc2626]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors disabled:opacity-60"
          >
            {loading ? 'Working…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}

function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (!supabase) {
        setError('Auth is not configured. Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
        return
      }

      // If the URL contains an OAuth code, exchange it for a session.
      // If not, getSession() will still pick up hash/session cookies depending on provider flow.
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          await supabase.auth.getSession()
        }

        if (!cancelled) navigate('/portal', { replace: true })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Authentication failed.'
        if (!cancelled) setError(msg)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <PageShell title="Signing you in…" subtitle="Completing authentication and redirecting you to the portal.">
      <div className="max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        {error ? (
          <div className="space-y-3">
            <p className="text-sm text-[#dc2626]">{error}</p>
            <Link
              to="/login"
              className="inline-flex rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--wt-text-2)]">Please wait…</span>
          </div>
        )}
      </div>
    </PageShell>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
      <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-medium mb-2">{title}</p>
      <p className="text-sm text-[var(--wt-text-2)]">
        Wire this route to your real page component when you’re ready.
      </p>
    </div>
  )
}

export function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="social" element={<SocialPage />} />
          <Route path="donations" element={<DonationsPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="healing" element={<HealingPage />} />
          <Route path="justice" element={<JusticePage />} />
          <Route path="empowerment" element={<EmpowermentPage />} />
          <Route path="phys-needs" element={<PhysiologicalNeedsPage />} />
          <Route path="bio-needs" element={<BiologicalNeedsPage />} />
          <Route path="spirit-needs" element={<SpiritualNeedsPage />} />
          <Route path="psyc-needs" element={<PsychologicalNeedsPage />} />
          <Route path="social-needs" element={<SocialNeedsPage />} />
          <Route path="love-belong" element={<LoveBelongingPage />} />
          <Route path="impact" element={<Navigate to="/donations" replace />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
        </Route>

        <Route path="admin" element={<Navigate to="/portal" replace />} />

        <Route
          path="portal"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="donors" element={<DonorsContributionsPage />} />
          <Route path="caseload" element={<CaseloadPage />} />
          <Route path="process-recordings" element={<ProcessRecordingsPage />} />
          <Route path="visitations" element={<VisitationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="your-donations" element={<YourDonationsPage />} />
          <Route path="site-users" element={<SiteUsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CookieConsent />
    </>
  )
}

