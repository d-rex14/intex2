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
    <div className="min-h-screen flex flex-col bg-[#0a0e1a]">
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f]/60 bg-[#0a0e1a]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 group-hover:bg-amber-500/20 transition-colors">
                <Eye size={16} className="text-amber-400" />
              </div>
              <span className="font-display text-lg font-bold text-white tracking-tight">Watchtower</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.to) ? 'text-amber-400' : 'text-[#8da0c4] hover:text-white'
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
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
                >
                  Go to Portal
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-[#8da0c4] hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link
                    to="/impact"
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
                  >
                    See Impact
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden rounded-lg p-2 text-[#8da0c4] hover:bg-[#1a2340] hover:text-white transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#1e3a5f] bg-[#0f1729] px-4 py-4 flex flex-col gap-3">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium py-2 ${isActive(link.to) ? 'text-amber-400' : 'text-[#8da0c4]'}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#1e3a5f]">
              {session ? (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
                >
                  Go to Portal
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
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

      <footer className="border-t border-[#1e3a5f]/60 bg-[#0a0e1a] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-amber-400" />
              <span className="font-display text-sm font-semibold text-white">Watchtower</span>
              <span className="text-[#4a5a7a] text-sm">— Protecting survivors, restoring lives.</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#4a5a7a]">
              <Link to="/privacy" className="hover:text-[#8da0c4] transition-colors">
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

