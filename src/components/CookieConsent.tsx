import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X } from 'lucide-react'

const COOKIE_KEY = 'watchtower_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = document.cookie
      .split('; ')
      .find(row => row.startsWith(COOKIE_KEY + '='))
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `${COOKIE_KEY}=accepted; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    setVisible(false)
  }

  const decline = () => {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `${COOKIE_KEY}=declined; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] shadow-2xl p-5 text-[var(--wt-text)]"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] border border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)]">
          <Cookie size={16} className="text-[var(--wt-accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">Cookie Notice</p>
          <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
            We use essential cookies to keep you signed in and remember your preferences. We do not use advertising or
            tracking cookies.{' '}
            <Link
              to="/privacy"
              className="text-[var(--wt-accent)] underline underline-offset-2 hover:text-[var(--wt-accent-hover)]"
            >
              Privacy Policy
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={accept}
              className="rounded-lg bg-[var(--wt-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs font-medium text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)] transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          onClick={decline}
          className="text-[var(--wt-text-2)] hover:text-[var(--wt-text)] transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

