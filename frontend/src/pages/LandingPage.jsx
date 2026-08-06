import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icons'
import ThemeToggle from '../components/ThemeToggle'

export default function LandingPage() {
  const navigate = useNavigate()

  const cards = [
    {
      role: 'user',
      title: 'User Dashboard',
      description: 'Browse loan advertisements from partner banks and submit applications instantly.',
      icon: 'user',
    },
    {
      role: 'bank',
      title: 'Bank Dashboard',
      description: 'Review loan applications with full KYC details. Approve or reject with a single click.',
      icon: 'bank',
    },
    {
      role: 'admin',
      title: 'Admin Dashboard',
      description: 'Oversee the entire system. Manage user accounts and create new bank integrations.',
      icon: 'admin',
    },
  ]

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-brand">
          <div className="landing-brand-icon">
            <Icon name="trending" size={14} />
          </div>
          <span className="landing-brand-name">LoanFlow</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">
            <Icon name="shield" size={12} />
            Enterprise Loan Management
          </div>
          <h1 className="landing-title">
            High-performance loan infrastructure.
          </h1>
          <p className="landing-desc">
            A precise, data-dense platform for managing the entire loan lifecycle. 
            Built for speed, accuracy, and enterprise-grade financial operations.
          </p>

          <div className="landing-cards">
            {cards.map((card, i) => (
              <article className="role-card animate-fade-in-up" key={card.role} style={{ animationDelay: `${0.1 * i}s` }}>
                <Icon name={card.icon} size={20} className="text-secondary" />
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="role-card-actions">
                  {card.role === 'user' ? (
                    <>
                      <button className="btn-full" onClick={() => navigate(`/auth/signup/${card.role}`)}>
                        Sign up
                      </button>
                      <button className="btn-secondary" onClick={() => navigate(`/auth/login/${card.role}`)}>
                        Login
                      </button>
                    </>
                  ) : card.role === 'bank' ? (
                    <>
                      <button className="btn-full" onClick={() => navigate(`/auth/login/${card.role}`)}>
                        Login
                      </button>
                      <button className="btn-secondary" onClick={() => navigate(`/auth/login/${card.role}`)}>
                        Demo
                      </button>
                    </>
                  ) : (
                    <button className="btn-secondary" onClick={() => navigate(`/auth/login/${card.role}`)}>
                      Admin Login
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
