import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { Icon } from './Icons'
import ThemeToggle from './ThemeToggle'

const roleLabels = { user: 'User', bank: 'Bank', admin: 'Admin' }
const roleIcons = { user: 'user', bank: 'bank', admin: 'admin' }

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
              <div className="row" style={{ gap: '0.625rem' }}>
                <div className="sidebar-brand-icon">
                  <Icon name="trending" size={18} />
                </div>
                <div>
                  <div className="topbar-title">{title || 'LoanFlow'}</div>
                  {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
                </div>
              </div>
            </div>
            <div className="topbar-right">
              <ThemeToggle />
              {user && (
                <>
                  <span className={`role-badge ${user.role}`}>
                    <Icon name={roleIcons[user.role]} size={12} />
                    {roleLabels[user.role]}
                  </span>
                  <button className="btn-ghost btn-sm" onClick={logout}>
                    <Icon name="logout" size={14} /> Logout
                  </button>
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
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Icon name="trending" size={18} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">LoanFlow</span>
            <span className="sidebar-brand-sub">{roleLabels[user.role]} Dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${item.active ? 'active' : ''}`}
              onClick={() => {
                item.onClick?.()
                setSidebarOpen(false)
              }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className={`avatar ${user.role === 'bank' ? 'warning' : user.role === 'admin' ? 'accent' : 'success'}`}>
              <Icon name={roleIcons[user.role]} size={16} />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.username}</div>
              <div className="sidebar-user-role">{roleLabels[user.role]}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Icon name="menu" size={20} />
            </button>
            <div>
              <div className="topbar-title">{title}</div>
              {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
            </div>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
            <button className="btn-ghost btn-sm" onClick={logout}>
              <Icon name="logout" size={14} /> Logout
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  )
}
