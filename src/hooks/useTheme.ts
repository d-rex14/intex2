import { useCallback, useEffect, useState } from 'react'

const COOKIE_KEY = 'watchtower_theme'
const CONSENT_KEY = 'watchtower_cookie_consent'
type Theme = 'light' | 'dark'

function readCookie(key: string): string | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(key + '='))
  return match ? match.split('=')[1] : null
}

function hasConsent(): boolean {
  return readCookie(CONSENT_KEY) === 'accepted'
}

function readTheme(): Theme | null {
  const val = readCookie(COOKIE_KEY)
  return val === 'dark' ? 'dark' : val === 'light' ? 'light' : null
}

function writeCookie(theme: Theme) {
  if (!hasConsent()) return
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${COOKIE_KEY}=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = readTheme()
    return saved ?? 'light'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      writeCookie(next)
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggle } as const
}
