import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import watchtowerLogo from '../assets/branding/watchtower-logo-transparent.png'

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { session, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const navLinks = useMemo(() => {
    const publicLinks = [
      { to: '/', label: 'Home' },
      { to: '/blog', label: 'Blog' },
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
      { to: '/social', label: 'Social' },
      { to: '/donations', label: 'Donations' },
    ]
    if (!session) return publicLinks
    return [...publicLinks, { to: '/portal', label: 'My Portal' }]
  }, [session])

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--wt-bg)] text-[var(--wt-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--wt-border)] bg-[color-mix(in_srgb,var(--wt-bg)_90%,transparent)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src={watchtowerLogo}
                alt="Watchtower Sanctuary"
                className="h-24 w-auto object-contain"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'text-[var(--wt-accent)]'
                      : 'text-[var(--wt-text-2)] hover:text-[var(--wt-text)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)] transition-colors"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              {session ? (
                <button
                  onClick={handleSignOut}
                  className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Log Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            <button
              className="md:hidden rounded-lg p-2 text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)] transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[var(--wt-border)] bg-[var(--wt-surface)] px-4 py-4 flex flex-col gap-3">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium py-2 ${
                  isActive(link.to) ? 'text-[var(--wt-accent)]' : 'text-[var(--wt-text-2)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[var(--wt-border)]">
              {session ? (
                <button
                  onClick={handleSignOut}
                  className="block w-full text-center rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Log Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--wt-border)] bg-[var(--wt-bg)] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src={watchtowerLogo}
                alt="Watchtower Sanctuary"
                className="h-10 w-auto object-contain"
              />
              <span className="text-[var(--wt-text-2)] text-sm">— Protecting survivors, restoring lives.</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[var(--wt-text-2)]">
              <Link to="/privacy" className="hover:text-[var(--wt-text)] transition-colors">
                Privacy Policy
              </Link>
              <span>© {new Date().getFullYear()} Watchtower. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

