import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icons'
import ThemeToggle from '../components/ThemeToggle'

export default function LandingPage() {
  const navigate = useNavigate()

  const cards = [
    {
      role: 'user',
      title: 'User Dashboard',
      description: 'Browse loan advertisements from banks and submit loan applications in minutes.',
      icon: 'user',
      accent: 'emerald',
      hint: 'Apply for loans',
    },
    {
      role: 'bank',
      title: 'Bank Dashboard',
      description: 'Review applications submitted by users and approve or reject them with full KYC details.',
      icon: 'bank',
      accent: 'amber',
      hint: 'Review applications',
    },
    {
      role: 'admin',
      title: 'Admin Dashboard',
      description: 'Manage all users and bank accounts with a comprehensive system overview.',
      icon: 'admin',
      accent: 'violet',
      hint: 'Manage the system',
    },
  ]

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-brand">
          <div className="landing-brand-icon">
            <Icon name="trending" size={20} />
          </div>
          <span className="landing-brand-name">LoanFlow</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">
            <Icon name="sparkles" size={12} />
            Role-based Finance Portal
          </div>
          <h1 className="landing-title">
            Smart Loan Management,{' '}
            <span className="gradient-text">Simplified</span>
          </h1>
          <p className="landing-desc">
            A comprehensive loan management platform where users browse and apply for loans,
            banks review and approve applications, and admins oversee the entire system.
          </p>

          <div className="landing-cards">
            {cards.map((card, i) => (
              <article className={`role-card ${card.accent}`} key={card.role} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="row-between">
                  <div className={`role-card-icon ${card.accent}`}>
                    <Icon name={card.icon} size={22} />
                  </div>
                  <span className="role-card-label">{card.hint}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="role-card-actions">
                  {card.role === 'user' ? (
                    <>
                      <button onClick={() => navigate(`/auth/signup/${card.role}`)}>
                        Sign up <Icon name="arrow" size={14} />
                      </button>
                      <button className="btn-ghost" onClick={() => navigate(`/auth/login/${card.role}`)}>
                        Login
                      </button>
                    </>
                  ) : card.role === 'bank' ? (
                    <>
                      <button onClick={() => navigate(`/auth/login/${card.role}`)}>
                        Login <Icon name="arrow" size={14} />
                      </button>
                      <button className="btn-ghost" onClick={() => navigate(`/auth/login/${card.role}`)}>
                        <Icon name="key" size={13} /> Demo
                      </button>
                    </>
                  ) : (
                    <button className="btn-full" onClick={() => navigate(`/auth/login/${card.role}`)}>
                      Login <Icon name="arrow" size={14} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
