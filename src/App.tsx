import React from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { CookieConsent } from './components/CookieConsent'
import { useAuth } from './context/AuthContext'

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

function HomePage() {
  return (
    <PageShell
      title="Watchtower"
      subtitle="A secure, modern operations and impact platform for survivor care, donor stewardship, and outreach analytics."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-medium">Mission</p>
          <p className="mt-3 text-[var(--wt-text)] leading-relaxed">
            Protect survivors, strengthen safehouse operations, and communicate anonymized impact—without compromising
            privacy.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-medium">Get started</p>
          <p className="mt-3 text-[var(--wt-text)] leading-relaxed">
            Staff can sign in to manage caseloads, process recordings, visitations, and reports.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              to="/login"
              className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
            >
              Staff Sign In
            </Link>
            <Link
              to="/impact"
              className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm font-semibold text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)] transition-colors"
            >
              View Impact
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function ImpactPage() {
  return (
    <PageShell
      title="Our Impact"
      subtitle="Aggregated, anonymized metrics intended for public and donor-facing reporting."
    >
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-[var(--wt-text-2)] text-sm">
          Hook this page up to your API (or Supabase tables like `public_impact_snapshots`) when ready.
        </p>
      </div>
    </PageShell>
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
  const { signInWithPassword, session } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  if (session) return <Navigate to="/admin" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signInWithPassword(email.trim(), password)
    if (res.error) setError(res.error)
    setLoading(false)
  }

  return (
    <PageShell title="Staff Sign In" subtitle="Use your organization credentials to access the portal.">
      <div className="max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
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
          {error && <p className="text-sm text-[#dc2626]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
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
          <Route path="impact" element={<ImpactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>

        <Route
          path="admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminPlaceholder title="Dashboard" />} />
          <Route path="donors" element={<AdminPlaceholder title="Donors & Contributions" />} />
          <Route path="caseload" element={<AdminPlaceholder title="Caseload Inventory" />} />
          <Route path="process-recordings" element={<AdminPlaceholder title="Process Recordings" />} />
          <Route path="visitations" element={<AdminPlaceholder title="Visitations & Conferences" />} />
          <Route path="reports" element={<AdminPlaceholder title="Reports & Analytics" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CookieConsent />
    </>
  )
}

