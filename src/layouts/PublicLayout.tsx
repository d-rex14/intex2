import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Eye, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { session, role } = useAuth()
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/impact', label: 'Our Impact' },
    { to: '/privacy', label: 'Privacy' },
  ]

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

  return (
    <div className="min-h-screen flex flex-col bg-[var(--wt-bg)] text-[var(--wt-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--wt-border)] bg-[color-mix(in_srgb,var(--wt-bg)_90%,transparent)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] border border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)] group-hover:bg-[color-mix(in_srgb,var(--wt-accent)_26%,transparent)] transition-colors">
                <Eye size={16} className="text-[var(--wt-accent)]" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-[var(--wt-text)]">Watchtower</span>
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
              {session ? (
                <Link
                  to={role === 'admin' ? '/admin' : '/admin'}
                  className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Go to Portal
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-[var(--wt-text-2)] hover:text-[var(--wt-text)] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/impact"
                    className="rounded-lg bg-[var(--wt-accent-2)] px-4 py-2 text-sm font-semibold text-[var(--wt-text)] hover:bg-[var(--wt-accent-2-hover)] transition-colors"
                  >
                    See Impact
                  </Link>
                </>
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
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Go to Portal
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Staff Sign In
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
              <Eye size={14} className="text-[var(--wt-accent)]" />
              <span className="font-display text-sm font-semibold text-[var(--wt-text)]">Watchtower</span>
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

