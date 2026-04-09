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
  const sectionCls = 'mb-6'
  const headingCls = 'text-lg font-semibold text-[var(--wt-text)] mb-2'
  const textCls = 'text-sm text-[var(--wt-text-2)] leading-relaxed'
  const listCls = 'list-disc ml-5 mt-1 space-y-1 text-sm text-[var(--wt-text-2)] leading-relaxed'

  return (
    <PageShell title="Privacy Policy" subtitle="Last updated: April 9, 2026">
      <div className="max-w-none">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 md:p-8 space-y-1">

          <div className={sectionCls}>
            <h2 className={headingCls}>1. Who We Are</h2>
            <p className={textCls}>
              Watchtower (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is the operations platform of a
              US-based 501(c)(3) nonprofit organization that operates safe homes for girls who are
              survivors of sexual abuse and sex trafficking in the Philippines. This privacy policy
              explains how we collect, use, store, and protect personal data when you visit our
              website or use our platform.
            </p>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>2. Data We Collect</h2>
            <p className={textCls}>We may collect the following categories of personal data:</p>
            <ul className={listCls}>
              <li><strong>Account information</strong> — email address and hashed password when you create an account, or profile information provided by Google when you sign in with Google OAuth.</li>
              <li><strong>Donor records</strong> — name, contact information, donation history, and related correspondence for supporters who choose to contribute.</li>
              <li><strong>Case management data</strong> — anonymized or pseudonymized records relating to the residents we serve. Access is strictly limited to authorized staff.</li>
              <li><strong>Usage data</strong> — pages visited, browser type, and device information collected automatically for site functionality and improvement.</li>
              <li><strong>Cookie preferences</strong> — your consent choice stored via a browser cookie.</li>
            </ul>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>3. Legal Basis for Processing (GDPR Art. 6)</h2>
            <p className={textCls}>We process personal data under the following legal bases:</p>
            <ul className={listCls}>
              <li><strong>Consent</strong> — where you have given clear consent (e.g., accepting cookies, creating an account).</li>
              <li><strong>Contractual necessity</strong> — to provide services you have requested (e.g., processing donations).</li>
              <li><strong>Legitimate interest</strong> — to operate, secure, and improve our platform while safeguarding the rights and safety of the individuals we serve.</li>
              <li><strong>Legal obligation</strong> — to comply with applicable laws such as financial reporting and child protection regulations.</li>
            </ul>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>4. How We Use Your Data</h2>
            <ul className={listCls}>
              <li>Authenticate and manage your account.</li>
              <li>Process and acknowledge donations.</li>
              <li>Provide authorized staff with case management tools.</li>
              <li>Generate aggregated, anonymized impact reports for public-facing dashboards.</li>
              <li>Communicate with donors and supporters about our mission (with consent).</li>
              <li>Maintain platform security and prevent unauthorized access.</li>
            </ul>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>5. Cookies</h2>
            <p className={textCls}>
              We use <strong>essential cookies only</strong>. These keep you signed in and store
              your cookie consent preference. We do not use advertising, analytics, or third-party
              tracking cookies. You can manage your cookie preferences at any time via the cookie
              consent banner. Declining cookies will prevent authentication-related cookies from
              being set; however, our site will still function for public pages.
            </p>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>6. Data Sharing &amp; Transfers</h2>
            <p className={textCls}>
              We do not sell, rent, or trade your personal data. Data may be shared with:
            </p>
            <ul className={listCls}>
              <li><strong>Supabase</strong> (our authentication and database provider) — hosted on secure cloud infrastructure with encryption at rest and in transit.</li>
              <li><strong>Vercel</strong> (our hosting provider) — for serving the website.</li>
              <li><strong>Google</strong> — only if you choose to sign in with Google OAuth.</li>
            </ul>
            <p className={`${textCls} mt-2`}>
              These providers may process data outside the European Economic Area. Where applicable,
              we rely on Standard Contractual Clauses or equivalent safeguards to protect your data
              during international transfers.
            </p>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>7. Data Retention</h2>
            <p className={textCls}>
              Account data is retained for as long as your account is active. Donation records are
              retained as required by financial and tax reporting obligations. Case management data
              is retained according to child welfare best practices and applicable regulations.
              You may request deletion of your account data at any time (see Section 8).
            </p>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>8. Your Rights (GDPR Art. 15–22)</h2>
            <p className={textCls}>If you are in the EEA or a jurisdiction with similar privacy laws, you have the right to:</p>
            <ul className={listCls}>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification</strong> — request correction of inaccurate data.</li>
              <li><strong>Erasure</strong> — request deletion of your personal data (&quot;right to be forgotten&quot;).</li>
              <li><strong>Restriction</strong> — request that we limit processing of your data.</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interest.</li>
              <li><strong>Withdraw consent</strong> — at any time, without affecting the lawfulness of prior processing.</li>
            </ul>
            <p className={`${textCls} mt-2`}>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:info@LighthouseSanctuary.com" className="text-[var(--wt-accent)] underline underline-offset-2 hover:text-[var(--wt-accent-hover)]">
                info@LighthouseSanctuary.com
              </a>.
              We will respond within 30 days.
            </p>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>9. Data Security</h2>
            <p className={textCls}>
              We protect your data using HTTPS/TLS encryption for all connections, role-based access
              controls, secure authentication with optional multi-factor authentication, and encrypted
              database storage. Despite these measures, no method of transmission or storage is 100%
              secure. If you become aware of a security issue, please contact us immediately.
            </p>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>10. Children&apos;s Privacy</h2>
            <p className={textCls}>
              Our public website is not directed at children under 16. We do not knowingly collect
              personal data from children through the website. Case management data involving minors
              is handled exclusively by authorized staff under strict access controls and is never
              exposed through public-facing features.
            </p>
          </div>

          <div className={sectionCls}>
            <h2 className={headingCls}>11. Changes to This Policy</h2>
            <p className={textCls}>
              We may update this policy from time to time. Material changes will be communicated
              via a notice on our website. The &quot;last updated&quot; date at the top of this page
              reflects the most recent revision.
            </p>
          </div>

          <div>
            <h2 className={headingCls}>12. Contact Us</h2>
            <p className={textCls}>
              If you have questions about this privacy policy or wish to exercise your data rights,
              please contact us at:{' '}
              <a href="mailto:info@LighthouseSanctuary.com" className="text-[var(--wt-accent)] underline underline-offset-2 hover:text-[var(--wt-accent-hover)]">
                info@LighthouseSanctuary.com
              </a>{' '}
              or by phone at (801) 831-3323.
            </p>
          </div>

        </div>
      </div>
    </PageShell>
  )
}

const PASSWORD_RULES = [
  { key: 'len', label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { key: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'digit', label: 'One digit', test: (p: string) => /\d/.test(p) },
  { key: 'special', label: 'One special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function passwordMeetsPolicy(pw: string): boolean {
  return PASSWORD_RULES.every(r => r.test(pw))
}

function LoginPage() {
  const { signInWithPassword, signInWithOAuth, signUpWithPassword, session, aal, hasMfaFactor, refreshAal } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [mode, setMode] = React.useState<'signin' | 'signup' | 'mfa'>('signin')
  const [mfaCode, setMfaCode] = React.useState('')
  const [mfaFactorId, setMfaFactorId] = React.useState<string | null>(null)
  const [verifyModalOpen, setVerifyModalOpen] = React.useState(false)

  if (session && aal === 'aal2') return <Navigate to="/portal" replace />
  if (session && !hasMfaFactor) return <Navigate to="/portal" replace />

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
      if (res.error) {
        setError(res.error)
      } else if (supabase) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aalData?.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
          const { data: factors } = await supabase.auth.mfa.listFactors()
          const totpFactor = factors?.totp?.find(f => f.status === 'verified')
          if (totpFactor) {
            setMfaFactorId(totpFactor.id)
            setMode('mfa')
            setError(null)
            setLoading(false)
            return
          }
        }
      }
    } else if (mode === 'mfa') {
      if (!supabase || !mfaFactorId) {
        setError('MFA is not properly configured.')
        setLoading(false)
        return
      }
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challengeErr) {
        setError(challengeErr.message)
        setLoading(false)
        return
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      })
      if (verifyErr) {
        setError(verifyErr.message)
        setLoading(false)
        return
      }
      await refreshAal()
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

  if (mode === 'mfa') {
    return (
      <PageShell
        title="Two-Factor Authentication"
        subtitle="Enter the 6-digit code from your authenticator app."
      >
        <div className="max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Verification Code</label>
              <input
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder="000000"
                className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)] text-center tracking-[0.3em] text-lg font-mono"
              />
            </div>
            {error && <p className="text-sm text-[#dc2626]">{error}</p>}
            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="w-full rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setMfaCode('')
                setMfaFactorId(null)
                setError(null)
              }}
              className="w-full text-xs text-[var(--wt-text-2)] hover:text-[var(--wt-text)] transition-colors"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </PageShell>
    )
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
            {mode === 'signup' && password.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {PASSWORD_RULES.map(r => {
                  const pass = r.test(password)
                  return (
                    <li key={r.key} className={`text-xs flex items-center gap-1.5 ${pass ? 'text-emerald-400' : 'text-[var(--wt-text-2)]'}`}>
                      <span>{pass ? '\u2713' : '\u2022'}</span>
                      {r.label}
                    </li>
                  )
                })}
              </ul>
            )}
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
  const { session, loading, aal, hasMfaFactor } = useAuth()
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (hasMfaFactor && aal === 'aal1') return <Navigate to="/login" replace />
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

