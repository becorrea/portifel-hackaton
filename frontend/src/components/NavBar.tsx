import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogOut, BarChart2 } from 'lucide-react'

export function NavBar() {
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navLinks = [
    { to: '/dashboard', label: 'Portfólio' },
    { to: '/dividends', label: 'Dividendos' },
    { to: '/upload', label: 'Upload' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav
      style={{
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-8">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 select-none"
          style={{ textDecoration: 'none' }}
        >
          <BarChart2 size={20} style={{ color: 'var(--accent-blue)' }} />
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Portifel
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: isActive(to) ? 600 : 400,
                color: isActive(to) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                backgroundColor: isActive(to) ? 'rgba(75, 159, 255, 0.08)' : 'transparent',
                borderBottom: isActive(to) ? '2px solid var(--accent-blue)' : '2px solid transparent',
                transition: 'color 0.15s, background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive(to)) {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(to)) {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'
                }
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 transition"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            padding: '6px 10px',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface-hover)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={15} />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  )
}
