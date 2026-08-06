import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { Icon } from './Icons'
import ThemeToggle from './ThemeToggle'

const roleLabels = { user: 'User', bank: 'Bank', admin: 'Admin' }

export default function Layout({ title, subtitle, children, navItems = [] }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const showSidebar = user && navItems.length > 0

  if (!showSidebar) {
    return (
      <div className="app-shell no-sidebar">
        <div className="main-content">
          <header className="topbar">
            <div className="topbar-left">
              <div className="row" style={{ gap: '12px' }}>
                <div style={{ width: 24, height: 24, background: 'var(--accent)', color: 'var(--text-inverted)', display: 'grid', placeItems: 'center', borderRadius: 4 }}>LF</div>
                <div className="row" style={{ gap: '8px' }}>
                  <span className="topbar-title">{title || 'LoanFlow'}</span>
                  {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
                </div>
              </div>
            </div>
            <div className="topbar-right">
              <ThemeToggle />
              {user && (
                <>
                  <span className="role-badge">{roleLabels[user.role]}</span>
                  <button className="btn-ghost btn-sm" onClick={logout}>Logout</button>
                </>
              )}
            </div>
          </header>
          <div className="page-content">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 35 }} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">LF</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">LoanFlow</span>
            <span className="sidebar-brand-sub">{roleLabels[user.role]} Console</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${item.active ? 'active' : ''}`}
              onClick={() => { item.onClick?.(); setSidebarOpen(false) }}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roleLabels[user.role]}</div>
          </div>
          <button className="btn-ghost btn-sm" onClick={logout} style={{ padding: '0 8px' }}>
            <Icon name="logout" size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Icon name="menu" size={16} />
            </button>
            <div className="row" style={{ gap: '8px' }}>
              <span className="topbar-title">{title}</span>
              {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
            </div>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  )
}
