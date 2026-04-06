import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Eye,
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Home,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
} from 'lucide-react'
import { useAuth } from './src/context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/donors', label: 'Donors & Contributions', icon: Users },
  { to: '/admin/caseload', label: 'Caseload Inventory', icon: FolderOpen },
  { to: '/admin/process-recordings', label: 'Process Recordings', icon: FileText },
  { to: '/admin/visitations', label: 'Visitations & Conferences', icon: Home },
  { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
]

export function AdminLayout() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex h-16 items-center border-b border-[#1e3a5f] px-4 ${collapsed && !mobile ? 'justify-center' : 'gap-3'}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Eye size={16} className="text-amber-400" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <span className="font-display text-sm font-bold text-white">Watchtower</span>
            <p className="text-[10px] text-[#4a5a7a] uppercase tracking-widest">Staff Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#8da0c4] hover:bg-[#1a2340] hover:text-white'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
            title={collapsed && !mobile ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[#1e3a5f] p-3">
        {(!collapsed || mobile) && (
          <div className="mb-2 px-2 py-1.5 rounded-lg bg-[#1a2340]">
            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            <p className="text-[10px] uppercase tracking-widest text-amber-400 font-medium">{role}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#8da0c4] hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <LogOut size={16} />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-[#1e3a5f] bg-[#0f1729] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-[#0f1729] border-r border-[#1e3a5f] flex flex-col z-10">
            <button
              className="absolute top-4 right-4 text-[#8da0c4] hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#1e3a5f] bg-[#0a0e1a]/90 backdrop-blur-md px-4 gap-3">
          {/* Desktop collapse toggle */}
          <button
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-[#8da0c4] hover:bg-[#1a2340] hover:text-white transition-colors"
            onClick={() => setCollapsed(c => !c)}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[#8da0c4] hover:bg-[#1a2340] hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          {/* Right side actions */}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8da0c4] hover:bg-[#1a2340] hover:text-white transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
          </button>

          <Link
            to="/"
            className="text-xs text-[#4a5a7a] hover:text-[#8da0c4] transition-colors hidden sm:block"
          >
            ← Public Site
          </Link>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}