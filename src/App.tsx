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
import { BoardMemberPage } from './pages/public/BoardMemberPage'
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
  const Section = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-[var(--wt-text)] mb-2">{heading}</h2>
      <div className="text-sm text-[var(--wt-text)] leading-relaxed space-y-2">{children}</div>
    </div>
  )

  return (
    <PageShell title="Privacy Policy" subtitle="Effective date: April 1, 2026 — Last updated: April 8, 2026">
      <div className="max-w-none">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 space-y-2">
          <Section heading="1. Who We Are">
            <p>
              Watchtower Sanctuary (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a 501(c)(3) nonprofit
              organization that operates safe homes for girls who are survivors of sexual abuse and sex trafficking.
              This privacy policy explains how we collect, use, store, and protect personal data when you visit our
              website or use our staff portal.
            </p>
            <p>
              Contact: <a href="mailto:info@lighthousesanctuary.com" className="text-[var(--wt-accent)] underline underline-offset-2">info@lighthousesanctuary.com</a> | (801) 831-3323
            </p>
          </Section>

          <Section heading="2. Data We Collect">
            <p><strong>Account data:</strong> When you create an account we collect your email address and an encrypted password. If you sign in with Google, we receive your name and email from Google&apos;s OAuth service.</p>
            <p><strong>Operational data (staff only):</strong> Authorized staff enter and manage case records, counseling session notes, home visitation reports, donation records, and related operational information. This data is stored in our secure database and is accessible only to authenticated, role-authorized users.</p>
            <p><strong>Donor data:</strong> If you make a donation through our platform, we record transaction details such as amount, date, and allocation. Payment processing is handled by third-party providers (e.g., PayPal, Venmo); we do not store credit card numbers.</p>
            <p><strong>Usage data:</strong> We collect standard web analytics such as pages visited, browser type, and referring URL. We do not use advertising trackers or sell data to third parties.</p>
          </Section>

          <Section heading="3. How We Use Your Data">
            <p>We use personal data exclusively to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Authenticate users and enforce role-based access control</li>
              <li>Manage case records and support the rehabilitation of residents</li>
              <li>Track donations and communicate impact to supporters</li>
              <li>Improve our website and services through aggregated, anonymized analytics</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
            <p>We never sell, rent, or trade personal data to third parties for marketing purposes.</p>
          </Section>

          <Section heading="4. Legal Basis for Processing (GDPR)">
            <p>If you are located in the European Economic Area (EEA), we process your data under the following bases:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Consent:</strong> For cookies and optional communications (you may withdraw consent at any time)</li>
              <li><strong>Contractual necessity:</strong> To provide you with account and portal access</li>
              <li><strong>Legitimate interest:</strong> To operate and improve our services, prevent fraud, and ensure security</li>
              <li><strong>Legal obligation:</strong> To comply with applicable laws</li>
            </ul>
          </Section>

          <Section heading="5. Cookies">
            <p>We use a limited number of cookies:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Authentication cookies:</strong> Essential cookies managed by our authentication provider (Supabase) to keep you signed in. These are strictly necessary and cannot be disabled without losing access.</li>
              <li><strong>Consent cookie:</strong> Records whether you have accepted or declined our cookie notice. Stored for 1 year.</li>
              <li><strong>Preference cookie:</strong> Stores your display preference (e.g., light/dark mode). This is a non-essential, browser-accessible cookie you can clear at any time.</li>
            </ul>
            <p>We do <strong>not</strong> use advertising, analytics, or third-party tracking cookies. If you decline non-essential cookies, no preference cookies will be set, and the site will use default settings.</p>
          </Section>

          <Section heading="6. Data Sharing &amp; Third Parties">
            <p>We share data only with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Supabase:</strong> Our authentication and database provider, which stores account and operational data on secure cloud infrastructure.</li>
              <li><strong>Google:</strong> If you choose to sign in with Google, your email and name are shared via Google&apos;s OAuth 2.0 protocol.</li>
              <li><strong>Payment processors:</strong> PayPal and Venmo handle donation transactions; we do not receive or store full payment credentials.</li>
              <li><strong>Vercel:</strong> Our hosting provider serves the website and may process request metadata (IP addresses, headers) as part of standard web hosting.</li>
            </ul>
            <p>We do not transfer data to countries outside the EEA without adequate safeguards as required by GDPR.</p>
          </Section>

          <Section heading="7. Data Retention">
            <p>We retain personal data only as long as necessary:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Account data:</strong> Retained while your account is active; deleted upon request.</li>
              <li><strong>Case records:</strong> Retained in accordance with social welfare record-keeping requirements and organizational policy. Sensitive case data is access-restricted to authorized staff.</li>
              <li><strong>Donation records:</strong> Retained for tax and audit compliance (typically 7 years).</li>
              <li><strong>Cookies:</strong> Consent and preference cookies expire after 1 year.</li>
            </ul>
          </Section>

          <Section heading="8. Your Rights">
            <p>Under GDPR and applicable privacy laws, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;), subject to legal retention requirements</li>
              <li><strong>Restriction:</strong> Request that we limit processing of your data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interest</li>
              <li><strong>Withdraw consent:</strong> Withdraw previously given consent at any time</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:info@lighthousesanctuary.com" className="text-[var(--wt-accent)] underline underline-offset-2">info@lighthousesanctuary.com</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section heading="9. Data Security">
            <p>
              We take the security of your data seriously. All connections to our site are encrypted with TLS (HTTPS).
              Access to sensitive data is restricted by role-based access controls. Passwords are hashed and never
              stored in plain text. Our database enforces row-level security policies. We regularly review our security
              practices to protect against unauthorized access, alteration, or destruction of data.
            </p>
          </Section>

          <Section heading="10. Children&apos;s Privacy">
            <p>
              Our public website does not knowingly collect personal data from children under 16. The staff portal
              contains case management records for minors in our care; access to this data is strictly limited to
              authorized staff and is governed by organizational policy and applicable child protection regulations.
            </p>
          </Section>

          <Section heading="11. Changes to This Policy">
            <p>
              We may update this privacy policy from time to time. Material changes will be communicated via a notice
              on our website. The &quot;last updated&quot; date at the top of this page reflects the most recent revision.
            </p>
          </Section>

          <Section heading="12. Contact Us">
            <p>
              If you have questions about this privacy policy or wish to exercise your data rights, please contact us:
            </p>
            <p>
              Email: <a href="mailto:info@lighthousesanctuary.com" className="text-[var(--wt-accent)] underline underline-offset-2">info@lighthousesanctuary.com</a><br />
              Phone: (801) 831-3323<br />
              Website: <a href="https://www.lighthousesanctuary.org" target="_blank" rel="noopener noreferrer" className="text-[var(--wt-accent)] underline underline-offset-2">www.lighthousesanctuary.org</a>
            </p>
          </Section>
        </div>
      </div>
    </PageShell>
  )
}

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { id: 'upper', label: 'Uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Number (0-9)', test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'Special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_RULES.map(rule => {
        const pass = rule.test(password)
        return (
          <li key={rule.id} className={`text-xs flex items-center gap-1.5 ${pass ? 'text-green-600' : 'text-[var(--wt-text-2)]'}`}>
            <span className={`inline-block w-3.5 h-3.5 rounded-full border text-center text-[10px] leading-[13px] font-bold ${pass ? 'border-green-600 bg-green-600 text-white' : 'border-[var(--wt-border)]'}`}>
              {pass ? '✓' : ''}
            </span>
            {rule.label}
          </li>
        )
      })}
    </ul>
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
  const [verifyModalOpen, setVerifyModalOpen] = React.useState(false)

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

  const passwordValid = PASSWORD_RULES.every(r => r.test(password))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    if (mode === 'signup' && !passwordValid) {
      setError('Password does not meet all requirements. Please check the list below.')
      setLoading(false)
      return
    }

    if (mode === 'signin') {
      const res = await signInWithPassword(email.trim(), password)
      if (res.error) setError(res.error)
    } else {
      const res = await signUpWithPassword(email.trim(), password)
      if (res.error) setError(res.error)
      else if (res.needsEmailConfirmation) {
        setNotice('Account created. Please verify your email before signing in.')
        setVerifyModalOpen(true)
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
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'signup' ? 12 : undefined}
              className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
            />
            {mode === 'signup' && <PasswordStrength password={password} />}
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
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--wt-border)]">
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Verify your email</h2>
              <p className="mt-1 text-sm text-[var(--wt-text-2)]">
                We sent a verification link to your email. Open your inbox, verify your account, then come back and sign in.
              </p>
            </div>
            <div className="p-6 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
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
          <Route path="board/:slug" element={<BoardMemberPage />} />
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

