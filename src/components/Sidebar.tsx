import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded-lg text-sm transition-colors ${
      location.pathname === path
        ? 'bg-trace/20 text-trace font-medium'
        : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
    }`

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border-subtle flex items-center justify-between px-4 z-50">
        <h1 className="text-lg font-semibold text-trace tracking-wide">vtryse</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-text-primary text-2xl leading-none"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay when mobile menu is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-56 h-screen bg-surface border-r border-border-subtle flex flex-col p-4 fixed left-0 top-0 z-50 transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="mb-8 px-2 hidden md:block">
          <h1 className="text-lg font-semibold text-trace tracking-wide">vtryse</h1>
        </div>
        <div className="mb-4 md:hidden h-10" />

        <nav className="flex flex-col gap-1 flex-1">
          <Link to="/dashboard" className={linkClass('/dashboard')} onClick={() => setIsOpen(false)}>
            Dashboard
          </Link>
          <Link to="/settings" className={linkClass('/settings')} onClick={() => setIsOpen(false)}>
            Settings
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="text-sm text-left px-4 py-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors"
        >
          Log Out
        </button>
      </aside>
    </>
  )
}

export default Sidebar