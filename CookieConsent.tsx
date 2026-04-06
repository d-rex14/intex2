import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X } from 'lucide-react'

const COOKIE_KEY = 'watchtower_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Read existing consent from a browser-accessible (non-httponly) cookie
    const consent = document.cookie
      .split('; ')
      .find(row => row.startsWith(COOKIE_KEY + '='))
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    // Set a browser-accessible cookie (not httponly so React can read it)
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
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50
                 rounded-2xl border border-[#1e3a5f] bg-[#0f1729] shadow-2xl p-5"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Cookie size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-1">Cookie Notice</p>
          <p className="text-xs text-[#8da0c4] leading-relaxed">
            We use essential cookies to keep you signed in and remember your preferences.
            We do not use advertising or tracking cookies.{' '}
            <Link to="/privacy" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">
              Privacy Policy
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={accept}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="rounded-lg border border-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-[#8da0c4] hover:bg-[#1a2340] hover:text-white transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          onClick={decline}
          className="text-[#4a5a7a] hover:text-[#8da0c4] transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}