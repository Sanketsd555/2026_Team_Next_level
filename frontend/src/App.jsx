import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import api from './api'
import { useAuth } from './AuthContext'
import AssistantWidget from './AssistantWidget'
import { AdIcon, HeroArt, Icon, PanelIcon } from './Illustrations'

const roleLabels = {
  user: 'User',
  bank: 'Bank',
  admin: 'Admin',
}

const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    </div>
  )
}

const roleIcon = { user: 'user', bank: 'bank', admin: 'admin' }

function AppShell({ title, subtitle, children }) {
  const { user, logout } = useAuth()
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <div>
            <p className="eyebrow">LoanFlow</p>
            <h1>{title}</h1>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
        </div>
        <div className="topbar-actions">
          {user ? (
            <span className={`pill role-${user.role}`}>
              <Icon name={roleIcon[user.role] || 'user'} size={13} />
              {roleLabels[user.role]}: {user.username}
            </span>
          ) : null}
          {user ? <button className="ghost-button" onClick={logout}><Icon name="logout" size={14} /> Logout</button> : null}
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [loginBusy, setLoginBusy] = useState('')

  const quickLogin = async (role) => {
    setLoginBusy(role)
    try {
      if (role === 'user') {
        const creds = { username: 'demo_user', password: 'demo@2026' }
        try {
          await register({ ...creds, email: 'demo_user@loanflow.app', role: 'user' })
        } catch (registerError) {
          if (registerError.response?.status !== 400) throw registerError
          await login({ ...creds, role: 'user' })
        }
      } else if (role === 'bank') {
        await login({ username: 'bajaj_finance', password: 'nbfc@2026', role: 'bank' })
      } else {
        await login({ username: 'admin', password: 'admin@2026', role: 'admin' })
      }
      navigate(`/dashboard/${role}`)
    } catch (error) {
      console.error('Quick login failed', error)
    } finally {
      setLoginBusy('')
    }
  }

  const cards = [
    {
      role: 'user',
      title: 'User dashboard',
      description: 'Browse loan advertisements and send applications to a chosen bank.',
      icon: <Icon name="card" size={22} />,
      accent: 'emerald',
      hint: 'Apply for loans',
    },
    {
      role: 'bank',
      title: 'Bank dashboard',
      description: 'Review applications submitted by users and update their status.',
      icon: <Icon name="bank" size={22} />,
      accent: 'amber',
      hint: 'Review applications',
    },
    {
      role: 'admin',
      title: 'Admin dashboard',
      description: 'Manage users and banks in separated control sections.',
      icon: <Icon name="admin" size={22} />,
      accent: 'violet',
      hint: 'Organize the system',
    },
  ]

  return (
    <AppShell title="Role-based finance portal" subtitle="Choose a dashboard and get started.">
      <div className="intro">
        <h2>Welcome to LoanFlow</h2>
        <p>
          A role-based loan management portal. Users can browse loan offers and submit applications,
          banks can review and decide on applications, and admins manage the platform.
        </p>
      </div>
      <section className="card-grid">
        {cards.map((card) => (
          <article className="feature-card" key={card.role}>
            <div className="card-head">
              <span className={`card-icon ${card.accent}`}>{card.icon}</span>
              <span className="card-label">{card.hint}</span>
            </div>
            <h3>{card.title}</h3>
            <p className="card-copy">{card.description}</p>
            <div className="card-actions">
              <button className="wide-button" onClick={() => quickLogin(card.role)} disabled={loginBusy === card.role}>
                {loginBusy === card.role ? 'Logging in...' : 'Login'}
                <Icon name="arrow" size={14} />
              </button>
              {card.role === 'user' ? (
                <button className="ghost-button" onClick={() => navigate('/auth/signup/user')}>
                  Sign up
                  <Icon name="check" size={14} />
                </button>
              ) : card.role === 'bank' ? (
                <button className="ghost-button" onClick={() => navigate('/auth/combined')}>
                  <Icon name="key" size={13} /> Demo accounts
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  )
}

function AuthPage() {
  const { mode, role } = useParams()
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [demoBanks, setDemoBanks] = useState([])

  const heading = useMemo(() => `${mode === 'signup' ? 'Sign up' : 'Login'} as ${roleLabels[role]}`, [mode, role])

  useEffect(() => {
    if (mode === 'signup' && role !== 'user') {
      navigate(`/auth/login/${role}`, { replace: true })
    }
    if (role === 'bank' && mode === 'login') {
      api.get('/demo-banks/').then((response) => setDemoBanks(response.data)).catch(() => {})
    }
  }, [role, mode, navigate])

  const formatError = (data) => {
    if (typeof data === 'string') return data
    if (data?.detail) return data.detail
    if (data?.non_field_errors) return data.non_field_errors.join(' ')
    const first = data && Object.entries(data)[0]
    if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(' ') : first[1]}`
    return 'Unable to complete authentication.'
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') {
        await register({ ...form, role })
      } else {
        await login({ username: form.username, password: form.password, role })
      }
      navigate(`/dashboard/${role}`)
    } catch (error) {
      setError(formatError(error.response?.data))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell title={heading} subtitle="Use the matching role when signing in.">
      <section className="auth-layout">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="auth-head">
            <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
            <p>{mode === 'signup' ? `Joining as a ${roleLabels[role]}` : `Sign in to your ${roleLabels[role]} dashboard`}</p>
          </div>
          <label>
            <span className="field-label"><Icon name="user" size={14} /> Username</span>
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
          </label>
          {mode === 'signup' ? (
            <label>
              <span className="field-label"><Icon name="email" size={14} /> Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
          ) : null}
          <label>
            <span className="field-label"><Icon name="lock" size={14} /> Password</span>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          {role === 'bank' && mode === 'login' && demoBanks.length ? (
            <div className="demo-box">
              <p className="demo-title"><Icon name="bank" size={14} /> Demo NBFC bank accounts</p>
              {demoBanks.map((bank) => (
                <button
                  type="button"
                  className="demo-row"
                  key={bank.username}
                  onClick={() => setForm({ ...form, username: bank.username, password: bank.password })}
                >
                  <span className="demo-name"><Icon name="landmark" size={15} /> {bank.organization}</span>
                  <span className="demo-creds"><code>{bank.username}</code> / <code>{bank.password}</code></span>
                </button>
              ))}
            </div>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button disabled={busy}>
            {busy ? 'Working...' : mode === 'signup' ? 'Create account' : 'Login'}
            {!busy ? <Icon name={mode === 'signup' ? 'check' : 'arrow'} size={14} /> : null}
          </button>
        </form>
      </section>
    </AppShell>
  )
}

function CombinedLoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const roles = [
    {
      role: 'user',
      title: 'User',
      description: 'Browse loan offers and apply for loans.',
      icon: <Icon name="card" size={22} />,
      accent: 'emerald',
    },
    {
      role: 'bank',
      title: 'Bank',
      description: 'Review and decide on loan applications.',
      icon: <Icon name="bank" size={22} />,
      accent: 'amber',
    },
    {
      role: 'admin',
      title: 'Admin',
      description: 'Manage users, banks, and the system overview.',
      icon: <Icon name="admin" size={22} />,
      accent: 'violet',
    },
  ]

  return (
    <AppShell title="All logins" subtitle="Sign in as a User, Bank, or Admin from one page.">
      <button className="ghost-button back-button" onClick={() => navigate('/')}>
        <Icon name="arrow" size={14} />
      </button>
      <section className="combined-grid">
        {roles.map(({ role, title, description, icon, accent }) => (
          <LoginForm
            key={role}
            role={role}
            title={title}
            description={description}
            icon={icon}
            accent={accent}
            login={login}
            register={register}
            onSuccess={() => navigate(`/dashboard/${role}`)}
          />
        ))}
      </section>
    </AppShell>
  )
}

function LoginForm({ role, title, description, icon, accent, login, register, onSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [demoBanks, setDemoBanks] = useState([])

  useEffect(() => {
    if (role === 'bank') {
      api.get('/demo-banks/').then((response) => setDemoBanks(response.data)).catch(() => {})
    }
  }, [role])

  const formatError = (data) => {
    if (typeof data === 'string') return data
    if (data?.detail) return data.detail
    if (data?.non_field_errors) return data.non_field_errors.join(' ')
    const first = data && Object.entries(data)[0]
    if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(' ') : first[1]}`
    return 'Unable to complete authentication.'
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login({ ...form, role })
      onSuccess()
    } catch (error) {
      setError(formatError(error.response?.data))
    } finally {
      setBusy(false)
    }
  }

  const runDemo = async () => {
    setBusy(true)
    setError('')
    let creds
    if (role === 'admin') {
      creds = { username: 'admin', password: 'admin@2026' }
    } else if (role === 'bank') {
      creds = demoBanks[0] || { username: 'bajaj_finance', password: 'nbfc@2026' }
    } else {
      creds = { username: 'demo_user', password: 'demo@2026' }
    }
    setForm(creds)
    try {
      if (role === 'user') {
        try {
          await register({
            username: creds.username,
            email: 'demo_user@loanflow.app',
            password: creds.password,
            role: 'user',
          })
        } catch (registerError) {
          if (registerError.response?.status !== 400) {
            throw registerError
          }
          await login({ ...creds, role: 'user' })
        }
      } else {
        await login({ ...creds, role })
      }
      onSuccess()
    } catch (loginError) {
      setError(formatError(loginError.response?.data))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`panel login-card login-${role}`}>
      <div className="card-head">
        <span className={`card-icon ${accent}`}>{icon}</span>
        <span className="card-label">{title} account</span>
      </div>
      <h3>Login as {title}</h3>
      <p className="card-copy">{description}</p>
      <form className="stack login-form" onSubmit={submit}>
        <button type="button" className="run-button" onClick={runDemo} disabled={busy}>
          <Icon name="play" size={14} /> Run demo {title} login
        </button>
        <label>
          <span className="field-label"><Icon name="user" size={14} /> Username</span>
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
        </label>
        <label>
          <span className="field-label"><Icon name="lock" size={14} /> Password</span>
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </label>
        {role === 'bank' && demoBanks.length ? (
          <div className="demo-box">
            <p className="demo-title"><Icon name="bank" size={14} /> Demo NBFC bank accounts</p>
            {demoBanks.map((bank) => (
              <button
                type="button"
                className="demo-row"
                key={bank.username}
                onClick={() => setForm({ username: bank.username, password: bank.password })}
              >
                <span className="demo-name"><Icon name="landmark" size={15} /> {bank.organization}</span>
                <span className="demo-creds"><code>{bank.username}</code> / <code>{bank.password}</code></span>
              </button>
            ))}
          </div>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button disabled={busy}>
          {busy ? 'Working...' : `Login as ${title}`}
          {!busy ? <Icon name="arrow" size={14} /> : null}
        </button>
        {role === 'user' ? (
          <button type="button" className="ghost-button" onClick={() => navigate('/auth/signup/user')}>
            Sign up as User
            <Icon name="check" size={14} />
          </button>
        ) : null}
      </form>
    </div>
  )
}

function UserDashboard() {
  const [ads, setAds] = useState([])
  const [banks, setBanks] = useState([])
  const [applications, setApplications] = useState([])
  const [form, setForm] = useState({
    bank_id: '',
    full_name: '',
    email: '',
    mobile_number: '',
    pan_number: '',
    aadhar_number: '',
    bank_account_number: '',
    ifsc_code: '',
    amount: '',
    purpose: '',
    tenure_months: '12',
  })
  const [message, setMessage] = useState('')
  const [borrowerCheck, setBorrowerCheck] = useState(null)
  const [borrowerCheckError, setBorrowerCheckError] = useState('')
  const [borrowerCheckBusy, setBorrowerCheckBusy] = useState(false)

  const refresh = async () => {
    const [adsResponse, banksResponse, applicationsResponse] = await Promise.all([
      api.get('/loan-ads/'),
      api.get('/banks/'),
      api.get('/applications/'),
    ])
    setAds(adsResponse.data)
    setBanks(banksResponse.data)
    setApplications(applicationsResponse.data)
  }

  useEffect(() => {
    refresh()
  }, [])

  const submitApplication = async (event) => {
    event.preventDefault()
    setMessage('')
    await api.post('/applications/', {
      ...form,
      bank_id: Number(form.bank_id),
      amount: Number(form.amount),
      tenure_months: Number(form.tenure_months),
    })
    setForm({
      bank_id: '',
      full_name: '',
      email: '',
      mobile_number: '',
      pan_number: '',
      aadhar_number: '',
      bank_account_number: '',
      ifsc_code: '',
      amount: '',
      purpose: '',
      tenure_months: '12',
    })
    setMessage('Application submitted successfully.')
    setBorrowerCheck(null)
    setBorrowerCheckError('')
    await refresh()
  }

  const checkBorrowerHistory = async (aadharNumber) => {
    if (!/^\d{12}$/.test(aadharNumber)) {
      setBorrowerCheck(null)
      setBorrowerCheckError('')
      return
    }
    setBorrowerCheckBusy(true)
    setBorrowerCheckError('')
    try {
      const response = await api.get('/applications/borrower-check/', {
        params: { aadhar_number: aadharNumber },
      })
      setBorrowerCheck(response.data)
    } catch (error) {
      setBorrowerCheck(null)
      setBorrowerCheckError(error.response?.data?.detail || 'Could not check borrower history right now.')
    } finally {
      setBorrowerCheckBusy(false)
    }
  }

  return (
    <AppShell title="User dashboard" subtitle="See loan offers and send an application to a bank.">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">LoanFlow marketplace</p>
          <h2>Find the right loan for your needs</h2>
          <p className="muted">
            Compare offers from Bajaj Finance, Tata Capital, and Shriram Finance — check eligibility, calculate EMIs, and apply in minutes.
          </p>
          <div className="hero-stats">
            <div>
              <span className="hero-stat-ico"><Icon name="card" size={16} /></span>
              <div>
                <strong>{ads.length}</strong>
                <span>Loan ads</span>
              </div>
            </div>
            <div>
              <span className="hero-stat-ico"><Icon name="bank" size={16} /></span>
              <div>
                <strong>{banks.length}</strong>
                <span>Partner banks</span>
              </div>
            </div>
            <div>
              <span className="hero-stat-ico"><Icon name="doc" size={16} /></span>
              <div>
                <strong>{applications.length}</strong>
                <span>My applications</span>
              </div>
            </div>
          </div>
        </div>
        <HeroArt />
      </section>
      <section className="dashboard-grid two-up">
        <div className="panel">
          <h3 className="panel-head"><PanelIcon name="ads" /> Loan advertisements</h3>
          <div className="stack">
            {ads.length ? ads.map((ad) => (
              <article className="mini-card ad-card" key={ad.id}>
                <div className="ad-icon"><AdIcon title={ad.title} /></div>
                <div className="ad-body">
                  <p className="card-label">{ad.bank_name}</p>
                  <h4>{ad.title}</h4>
                  <p>{ad.description}</p>
                  <p className="muted small">APR {ad.apr}% | {fmtINR(ad.min_amount)} to {fmtINR(ad.max_amount)}</p>
                </div>
              </article>
            )) : <div className="app-empty">No loan advertisements yet.</div>}
          </div>
        </div>
        <div className="panel form-panel">
          <h3 className="panel-head"><PanelIcon name="form" /> Loan application</h3>
          <form className="stack" onSubmit={submitApplication}>
            <div className="form-grid">
              <label className="full">
                <span className="field-label"><Icon name="bank" size={14} /> Bank</span>
                <select value={form.bank_id} onChange={(event) => setForm({ ...form, bank_id: event.target.value })} required>
                  <option value="">Choose a bank</option>
                  {banks.map((bank) => (
                    <option value={bank.id} key={bank.id}>{bank.organization || bank.username}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label"><Icon name="user" size={14} /> Full name</span>
                <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="email" size={14} /> Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="phone" size={14} /> Mobile number</span>
                <input type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit mobile number" value={form.mobile_number} onChange={(event) => setForm({ ...form, mobile_number: event.target.value })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="card" size={14} /> PAN card number</span>
                <input maxLength="10" placeholder="e.g. ABCDE1234F" value={form.pan_number} onChange={(event) => setForm({ ...form, pan_number: event.target.value.toUpperCase() })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="card" size={14} /> Aadhaar card number</span>
                <input
                  type="tel"
                  pattern="[0-9]{12}"
                  maxLength="12"
                  placeholder="12-digit Aadhaar number"
                  value={form.aadhar_number}
                  onChange={(event) => {
                    const next = event.target.value.replace(/\D/g, '')
                    setForm({ ...form, aadhar_number: next })
                    if (next.length !== 12) {
                      setBorrowerCheck(null)
                      setBorrowerCheckError('')
                    }
                  }}
                  onBlur={(event) => checkBorrowerHistory(event.target.value)}
                  required
                />
              </label>
              {form.aadhar_number.length === 12 && borrowerCheckBusy ? <p className="info-text full">Checking borrower hash history...</p> : null}
              {borrowerCheckError ? <p className="error-text full">{borrowerCheckError}</p> : null}
              {borrowerCheck ? (
                <p className={`info-text full ${borrowerCheck.loan_count > 0 ? 'warn' : 'safe'}`}>
                  Borrower hash: <code>{borrowerCheck.borrower_hash}</code> | On-chain loans: {borrowerCheck.loan_count}
                  {borrowerCheck.loan_hashes?.length ? ` | Loan hashes: ${borrowerCheck.loan_hashes.join(', ')}` : ''}
                </p>
              ) : null}
              <label>
                <span className="field-label"><Icon name="wallet" size={14} /> Bank account number</span>
                <input placeholder="Account number" value={form.bank_account_number} onChange={(event) => setForm({ ...form, bank_account_number: event.target.value })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="landmark" size={14} /> IFSC code</span>
                <input maxLength="11" placeholder="e.g. HDFC0001234" value={form.ifsc_code} onChange={(event) => setForm({ ...form, ifsc_code: event.target.value.toUpperCase() })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="rupee" size={14} /> Amount</span>
                <input type="number" min="100" placeholder="e.g. 500000" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="doc" size={14} /> Purpose</span>
                <input placeholder="e.g. Home renovation" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} required />
              </label>
              <label>
                <span className="field-label"><Icon name="calendar" size={14} /> Tenure months</span>
                <input type="number" min="1" value={form.tenure_months} onChange={(event) => setForm({ ...form, tenure_months: event.target.value })} required />
              </label>
            </div>
            <button><Icon name="send" size={14} /> Submit application</button>
            {message ? <p className="success-text">{message}</p> : null}
          </form>
        </div>
      </section>
      <section className="panel">
        <h3 className="panel-head"><PanelIcon name="apps" /> My applications</h3>
        <div className="stack">
          {applications.length ? applications.map((application) => (
            <article className="mini-card" key={application.id}>
              <div className="row">
                <div>
                  <h4>{application.purpose}</h4>
                  <p>{fmtINR(application.amount)} requested from {application.bank.username}</p>
                  {application.blockchain_tx_hash ? <p className="muted small">Tx: {application.blockchain_tx_hash}</p> : null}
                </div>
                <span className={`status-pill ${application.status}`}>
                  <Icon name={application.status === 'approved' ? 'check' : application.status === 'rejected' ? 'cross' : 'clock'} size={11} />
                  {application.status}
                </span>
              </div>
            </article>
          )) : <div className="app-empty">No applications yet — pick a bank and submit your first one.</div>}
        </div>
      </section>
      <AssistantWidget />
    </AppShell>
  )
}

function BankDashboard() {
  const [applications, setApplications] = useState([])
  const [verifications, setVerifications] = useState({})
  const [analyses, setAnalyses] = useState({})

  const refresh = async () => {
    const response = await api.get('/applications/')
    setApplications(response.data)
  }

  useEffect(() => {
    refresh()
  }, [])

  const updateStatus = async (applicationId, status) => {
    await api.patch(`/applications/${applicationId}/`, { status })
    await refresh()
  }

  const verifyBorrower = async (applicationId) => {
    setVerifications((previous) => ({ ...previous, [applicationId]: { busy: true } }))
    try {
      const response = await api.post(`/applications/${applicationId}/`)
      setVerifications((previous) => ({ ...previous, [applicationId]: { busy: false, result: response.data } }))
    } catch (error) {
      setVerifications((previous) => ({
        ...previous,
        [applicationId]: { busy: false, result: { verification: { level: 'flagged', label: 'ATTENTION', message: 'Verify with the federal register before releasing the loan.' }, message: 'Verification service could not confirm the borrower.' } },
      }))
    }
  }

  const deleteApplication = async (application, event) => {
    event.stopPropagation()
    if (window.confirm(`Delete the application from ${application.full_name} for ${fmtINR(application.amount)}?`)) {
      await api.delete(`/applications/${application.id}/`)
      await refresh()
    }
  }

  const runAnalysis = async (applicationId) => {
    setAnalyses((previous) => ({ ...previous, [applicationId]: { busy: true } }))
    try {
      const response = await api.post(`/applications/${applicationId}/analyse/`)
      setApplications((previous) => previous.map((app) => (app.id === applicationId ? response.data.application : app)))
      setAnalyses((previous) => ({ ...previous, [applicationId]: { busy: false, error: '' } }))
    } catch (error) {
      setAnalyses((previous) => ({
        ...previous,
        [applicationId]: { busy: false, error: error.response?.data?.detail || 'AI analyser could not run right now.' },
      }))
    }
  }

  return (
    <AppShell title="Bank dashboard" subtitle="Review the loan applications assigned to your bank.">
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-ico blue"><Icon name="doc" size={15} /></span>
          <strong>{applications.length}</strong>
          <span>Incoming applications</span>
        </div>
        <div className="stat-card">
          <span className="stat-ico green"><Icon name="check" size={15} /></span>
          <strong>{applications.filter((a) => a.status === 'approved').length}</strong>
          <span>Approved</span>
        </div>
        <div className="stat-card">
          <span className="stat-ico amber"><Icon name="clock" size={15} /></span>
          <strong>{applications.filter((a) => a.status === 'pending').length}</strong>
          <span>Pending review</span>
        </div>
      </section>
      <SystemHealth />
      <section className="dashboard-grid two-up">
        <div className="panel">
          <h3 className="panel-head"><PanelIcon name="apps" /> Incoming applications</h3>
          <div className="stack">
            {applications.length ? applications.map((application) => (
              <article className="mini-card" key={application.id}>
                <div className="row">
                  <div>
                    <p className="card-label">{application.applicant.username}</p>
                    <h4>{application.full_name}</h4>
                  </div>
                  <span className={`status-pill ${application.status}`}>
                    <Icon name={application.status === 'approved' ? 'check' : application.status === 'rejected' ? 'cross' : 'clock'} size={11} />
                    {application.status}
                  </span>
                </div>
                <p><strong>{fmtINR(application.amount)}</strong> for {application.purpose}</p>
                <p className="muted small">Tenure: {application.tenure_months} months | Email: {application.email} | Mobile: {application.mobile_number}</p>
                {application.blockchain_tx_hash ? <p className="muted small">Tx: {application.blockchain_tx_hash}</p> : null}
                <div className="kyc-details">
                  <span title="Federal cipher, no raw data"><Icon name="lock" size={11} /> PAN {application.pan_cipher}</span>
                  <span title="Federal cipher, no raw data"><Icon name="lock" size={11} /> Aadhaar {application.aadhar_cipher}</span>
                  <span>Account: {application.bank_account_number}</span>
                  <span>IFSC: {application.ifsc_code}</span>
                </div>
                <div className={`loan-alert ${application.verification?.level || 'pending'}`}>
                  <Icon name={application.verification?.level === 'cleared' ? 'check' : application.verification?.level === 'review' ? 'info' : application.verification?.level === 'flagged' ? 'cross' : 'clock'} size={14} />
                  <div>
                    <strong>{application.verification?.label || 'CIPHER'}</strong>
                    <span>{application.verification?.message || 'Encoded identity ready for verification.'}</span>
                  </div>
                </div>
                {verifications[application.id]?.result ? (
                  <div className={`loan-alert ${verifications[application.id].result.verification?.level || 'pending'}`}>
                    <Icon name={verifications[application.id].result.verification?.level === 'cleared' ? 'check' : 'cross'} size={14} />
                    <div>
                      <strong>{verifications[application.id].result.verification?.label || 'VERIFIED'}</strong>
                      <span>{verifications[application.id].result.message || verifications[application.id].result.verification?.message}</span>
                      {verifications[application.id].result.pan_cipher ? (
                        <code className="cipher-line">{verifications[application.id].result.aadhar_cipher}</code>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="ai-risk-box">
                  <div className="ai-risk-head">
                    <span className="ai-badge"><Icon name="shield" size={12} /> GenAI analyser</span>
                    {application.analysis_at ? <span className="ai-ran-at">analysed</span> : null}
                  </div>
                  <div className="ai-stat-grid">
                    <div className="ai-stat">
                      <span>Risk score</span>
                      <strong className={application.risk_score >= 70 ? 'risk-high' : application.risk_score >= 40 ? 'risk-medium' : 'risk-low'}>
                        {application.risk_score}/100
                      </strong>
                    </div>
                    <div className="ai-stat">
                      <span>Risk level</span>
                      <strong>{application.risk_level || 'LOW'}</strong>
                    </div>
                    <div className="ai-stat">
                      <span>Fraud detection</span>
                      <strong className={application.fraud_detected ? 'risk-high' : 'risk-low'}>
                        {application.fraud_detected ? 'FRAUD' : 'CLEAR'}
                      </strong>
                    </div>
                  </div>
                  {application.fraud_flags?.length ? application.fraud_flags.map((flag) => (
                    <p className="loan-alert flagged ai-flag" key={flag.code}>
                      <Icon name="cross" size={13} />
                      <span><strong>{flag.label}</strong> {flag.detail}</span>
                    </p>
                  )) : null}
                  {application.ai_reason ? <p className="ai-reasoning">{application.ai_reason}</p> : null}
                  {application.auto_rejected ? (
                    <div className="loan-alert flagged">
                      <Icon name="cross" size={14} />
                      <div>
                        <strong>AUTO-REJECTED BY AI</strong>
                        <span>Borrower already holds an active loan from another bank. Concurrent multi-bank lending is blocked by policy.</span>
                      </div>
                    </div>
                  ) : null}
                  {analyses[application.id]?.error ? <p className="error-text">{analyses[application.id].error}</p> : null}
                </div>
                <div className="card-actions">
                  <button className="ghost-button" onClick={() => runAnalysis(application.id)} disabled={analyses[application.id]?.busy}><Icon name="shield" size={13} /> {analyses[application.id]?.busy ? 'Analysing...' : 'AI Analyse'}</button>
                  <button className="ghost-button" onClick={() => verifyBorrower(application.id)} disabled={verifications[application.id]?.busy}><Icon name="shield" size={13} /> Verify borrower</button>
                  <button className="approve-btn" onClick={() => updateStatus(application.id, 'approved')} disabled={application.auto_rejected} title={application.auto_rejected ? 'Auto-rejected by AI analyser' : ''}><Icon name="check" size={14} /> Approve</button>
                  <button className="reject-btn" onClick={() => updateStatus(application.id, 'rejected')}><Icon name="cross" size={14} /> Reject</button>
                  <button className="ghost-button" onClick={(event) => deleteApplication(application, event)}><Icon name="trash" size={13} /> Delete</button>
                </div>
              </article>
            )) : <div className="app-empty">No incoming applications right now.</div>}
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function SystemHealth() {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await api.get('/health/metrics/')
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Health metrics unavailable.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const maxMs = Math.max(...(data?.metrics || []).map((metric) => metric.value_ms ?? 0), 1)
  const barColor = (metric) => {
    if (!metric.online || metric.value_ms == null) return 'bar-offline'
    if (metric.value_ms < 10) return 'bar-green'
    if (metric.value_ms < 50) return 'bar-amber'
    return 'bar-red'
  }

  return (
    <section className="panel health-panel">
      <h3 className="panel-head"><PanelIcon name="chart" /> System health & latency</h3>
      <div className="health-head">
        <span className={`pill ${data?.healthy ? 'role-user' : 'role-admin'}`}>
          {data ? (data.healthy ? 'SYSTEM HEALTHY' : 'DEGRADED') : 'MEASURING...'}
        </span>
        <button className="ghost-button" onClick={refresh} disabled={busy}>
          <Icon name="clock" size={13} /> {busy ? 'Measuring...' : 'Refresh'}
        </button>
      </div>
      <div className="bar-chart">
        {(data?.metrics || []).map((metric) => {
          const pct = metric.value_ms == null ? 0 : Math.max((metric.value_ms / maxMs) * 100, 3)
          return (
            <div className="bar-row" key={metric.key}>
              <span className="bar-label" title={metric.label}>{metric.label}</span>
              <div className="bar-track">
                <div className={`bar-fill ${barColor(metric)}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="bar-value">
                {metric.value_ms == null ? 'offline' : `${metric.value_ms} ms`}
              </span>
            </div>
          )
        })}
      </div>
      {data?.timestamping ? (
        <div className="kyc-details health-stamps">
          <span>Stamp: {data.generated_at ? data.generated_at.replace('T', ' ').slice(0, 19) : '—'}</span>
          <span>Total applications: {data.timestamping.total_applications}</span>
          {data.timestamping.latest_application_stamp ? (
            <span>Last ledger stamp: {data.timestamping.latest_application_stamp.replace('T', ' ').slice(0, 19)}</span>
          ) : null}
          {data.timestamping.latest_analysis_stamp ? (
            <span>Last AI analysis: {data.timestamping.latest_analysis_stamp.replace('T', ' ').slice(0, 19)}</span>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}

function AdminAnalyticsLineChart({ series }) {
  if (!series?.length) return null
  const width = 640
  const height = 230
  const padL = 36
  const padR = 14
  const padT = 16
  const padB = 28
  const plotW = width - padL - padR
  const plotH = height - padT - padB
  const maxLatency = Math.max(...series.map((point) => point.latency_ms ?? 0), 1)

  const xAt = (index) => series.length === 1 ? padL + plotW / 2 : padL + (index * plotW) / (series.length - 1)
  const yAt = (fraction) => padT + plotH - fraction * plotH
  const latencyPct = (value) => Math.min((value ?? 0) / maxLatency, 1)
  const linePath = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const latencyPoints = series.map((point, i) => [xAt(i), yAt(latencyPct(point.latency_ms))])
  const accuracyPoints = series.map((point, i) => [xAt(i), yAt(Math.min(point.cumulative_accuracy / 100, 1))])

  return (
    <div className="line-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Latency and accuracy line chart">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line className="chart-grid" x1={padL} x2={width - padR} y1={yAt(tick / 100)} y2={yAt(tick / 100)} />
            <text className="chart-axis" x={padL - 6} y={yAt(tick / 100) + 3} textAnchor="end">{tick}</text>
          </g>
        ))}
        <path className="chart-line chart-line-latency" d={linePath(latencyPoints)} />
        <path className="chart-line chart-line-accuracy" d={linePath(accuracyPoints)} />
        {latencyPoints.map(([x, y], i) => (
          <g key={`l-${i}`}>
            <circle className="chart-dot chart-dot-latency" cx={x} cy={y} r="3.5" />
            <title>{`${series[i].label} (${series[i].status}): latency ${series[i].latency_ms} ms (${(latencyPct(series[i].latency_ms) * 100).toFixed(0)}% of peak)`}</title>
          </g>
        ))}
        {accuracyPoints.map(([x, y], i) => (
          <g key={`a-${i}`}>
            <circle className="chart-dot chart-dot-accuracy" cx={x} cy={y} r="3.5" />
            <title>{`${series[i].label} (${series[i].status}): cumulative accuracy ${series[i].cumulative_accuracy}%`}</title>
          </g>
        ))}
        {series.map((point, i) => (
          <text className="chart-xlabel" key={`x-${i}`} x={xAt(i)} y={height - 8} textAnchor="middle">{point.id}</text>
        ))}
      </svg>
      <div className="chart-legend">
        <span><i className="legend-dot latency" /> Latency (% of peak, right: ms in tooltip)</span>
        <span><i className="legend-dot accuracy" /> Cumulative accuracy %</span>
      </div>
    </div>
  )
}

function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await api.get('/admin/analytics/')
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analytics unavailable.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <section className="panel">
      <h3 className="panel-head"><PanelIcon name="chart" /> Latency vs accuracy</h3>
      <div className="health-head">
        <span className="pill role-admin">AI DECISION MODEL</span>
        <button className="ghost-button" onClick={refresh} disabled={busy}>
          <Icon name="clock" size={13} /> {busy ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div className="analytics-summary">
        <div className="stat-card">
          <strong>{data?.summary?.avg_latency_ms ?? '—'} ms</strong>
          <span>Avg analysis latency</span>
        </div>
        <div className="stat-card">
          <strong>{data?.summary?.overall_accuracy ?? '—'}%</strong>
          <span>Model accuracy</span>
        </div>
        <div className="stat-card">
          <strong>{data?.summary?.samples ?? 0}</strong>
          <span>Decisions analysed</span>
        </div>
      </div>
      <div className="duo-chart">
        <AdminAnalyticsLineChart series={data?.series || []} />
        {!data?.series?.length && !busy ? <div className="app-empty">No applications analysed yet.</div> : null}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}

function AdminDashboard() {
  const [summary, setSummary] = useState({ users: [], banks: [], counts: {} })
  const [applications, setApplications] = useState([])
  const [bankForm, setBankForm] = useState({ username: '', organization: '', password: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ organization: '', password: '' })
  const [adminMsg, setAdminMsg] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminBusy, setAdminBusy] = useState(false)

  const refresh = async () => {
    const [summaryResponse, applicationsResponse] = await Promise.all([
      api.get('/admin/summary/'),
      api.get('/applications/'),
    ])
    setSummary(summaryResponse.data)
    setApplications(applicationsResponse.data)
  }

  useEffect(() => {
    refresh()
  }, [])

  const addBank = async (event) => {
    event.preventDefault()
    setAdminBusy(true)
    setAdminMsg('')
    setAdminError('')
    try {
      await api.post('/admin/banks/', bankForm)
      setBankForm({ username: '', organization: '', password: '' })
      setAdminMsg(`Bank "${bankForm.organization || bankForm.username}" added.`)
      await refresh()
    } catch (error) {
      setAdminError(error.response?.data?.detail || 'Could not add the bank.')
    } finally {
      setAdminBusy(false)
    }
  }

  const startEdit = (bank) => {
    setEditingId(bank.id)
    setEditForm({ organization: bank.organization || '', password: '' })
    setAdminMsg('')
    setAdminError('')
  }

  const saveEdit = async (bankId) => {
    setAdminBusy(true)
    setAdminError('')
    setAdminMsg('')
    try {
      const payload = { organization: editForm.organization }
      if (editForm.password) payload.password = editForm.password
      await api.patch(`/admin/banks/${bankId}/`, payload)
      setEditingId(null)
      setAdminMsg('Bank updated.')
      await refresh()
    } catch (error) {
      setAdminError(error.response?.data?.detail || 'Could not update the bank.')
    } finally {
      setAdminBusy(false)
    }
  }

  const deleteBank = async (bank) => {
    setAdminBusy(true)
    setAdminMsg('')
    setAdminError('')
    try {
      await api.delete(`/admin/banks/${bank.id}/`)
      setAdminMsg(`Bank "${bank.username}" deleted.`)
      await refresh()
    } catch (error) {
      setAdminError(error.response?.data?.detail || 'Could not delete the bank.')
    } finally {
      setAdminBusy(false)
    }
  }

  return (
    <AppShell title="Admin dashboard" subtitle="Manage users and banks in separate sections.">
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-ico blue"><Icon name="users" size={15} /></span>
          <strong>{summary.counts.users || 0}</strong>
          <span>Total users</span>
        </div>
        <div className="stat-card">
          <span className="stat-ico amber"><Icon name="bank" size={15} /></span>
          <strong>{summary.counts.banks || 0}</strong>
          <span>Total banks</span>
        </div>
        <div className="stat-card">
          <span className="stat-ico violet"><Icon name="doc" size={15} /></span>
          <strong>{summary.counts.applications || 0}</strong>
          <span>Applications</span>
        </div>
      </section>
      <AdminAnalytics />
      <section className="dashboard-grid two-up">
        <div className="panel">
          <h3 className="panel-head"><PanelIcon name="users" /> User section</h3>
          <div className="stack">
            {summary.users.length ? summary.users.map((user) => (
              <article className="mini-card user-line" key={user.id}>
                <span className="mini-avatar"><Icon name="user" size={15} /></span>
                <div>
                  <h4>{user.username}</h4>
                  <p>{user.email}</p>
                </div>
              </article>
            )) : <div className="app-empty">No user accounts yet.</div>}
          </div>
        </div>
        <div className="panel">
          <h3 className="panel-head"><PanelIcon name="bank" /> Bank section</h3>
          <form className="bank-add-form" onSubmit={addBank}>
            <div className="form-grid">
              <label>
                <span className="field-label"><Icon name="user" size={14} /> Username</span>
                <input value={bankForm.username} onChange={(event) => setBankForm({ ...bankForm, username: event.target.value })} placeholder="e.g. hdfc_bank" required />
              </label>
              <label>
                <span className="field-label"><Icon name="bank" size={14} /> Organization</span>
                <input value={bankForm.organization} onChange={(event) => setBankForm({ ...bankForm, organization: event.target.value })} placeholder="e.g. HDFC Bank Ltd" required />
              </label>
              <label className="full">
                <span className="field-label"><Icon name="lock" size={14} /> Password</span>
                <input type="text" value={bankForm.password} onChange={(event) => setBankForm({ ...bankForm, password: event.target.value })} placeholder="Login password for this bank" required />
              </label>
            </div>
            <button disabled={adminBusy}><Icon name="plus" size={14} /> Add bank</button>
          </form>
          <div className="stack bank-list">
            {summary.banks.length ? summary.banks.map((bank) => (
              <article className="mini-card user-line" key={bank.id}>
                <span className="mini-avatar amber"><Icon name="landmark" size={15} /></span>
                <div className="bank-info">
                  {editingId === bank.id ? (
                    <div className="stack">
                      <label>
                        <span className="field-label"><Icon name="bank" size={14} /> Organization</span>
                        <input value={editForm.organization} onChange={(event) => setEditForm({ ...editForm, organization: event.target.value })} />
                      </label>
                      <label>
                        <span className="field-label"><Icon name="lock" size={14} /> New password (leave blank to keep)</span>
                        <input value={editForm.password} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} placeholder="New password" />
                      </label>
                      <div className="card-actions">
                        <button className="approve-btn" onClick={() => saveEdit(bank.id)} disabled={adminBusy}><Icon name="check" size={14} /> Save</button>
                        <button className="ghost-button" onClick={() => setEditingId(null)} disabled={adminBusy}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4>{bank.organization || bank.username}</h4>
                      <p className="muted small">
                        @{bank.username}
                        {bank.application_count ? ` | ${bank.application_count} application(s)` : ''}
                      </p>
                    </div>
                  )}
                </div>
                {editingId !== bank.id ? (
                  <div className="card-actions bank-actions">
                    <button className="ghost-button" onClick={() => startEdit(bank)} disabled={adminBusy}><Icon name="edit" size={13} /> Edit</button>
                    <button className="reject-btn" onClick={() => deleteBank(bank)} disabled={adminBusy}><Icon name="trash" size={13} /> Delete</button>
                  </div>
                ) : null}
              </article>
            )) : <div className="app-empty">No bank accounts yet.</div>}
          </div>
          {adminMsg ? <p className="success-text"><Icon name="check" size={13} /> {adminMsg}</p> : null}
          {adminError ? <p className="error-text">{adminError}</p> : null}
        </div>
      </section>
      <section className="panel">
        <h3 className="panel-head"><PanelIcon name="apps" /> Application register</h3>
        <div className="stack">
          {applications.length ? applications.map((application) => (
            <article className="mini-card" key={application.id}>
              <div className="row">
                <div>
                  <p className="card-label">{application.applicant.username}</p>
                  <h4>{application.full_name}</h4>
                </div>
                <span className={`status-pill ${application.status}`}>
                  <Icon name={application.status === 'approved' ? 'check' : application.status === 'rejected' ? 'cross' : 'clock'} size={11} />
                  {application.status}
                </span>
              </div>
              <p><strong>{fmtINR(application.amount)}</strong> for {application.purpose}</p>
              <p className="muted small">Bank: {application.bank.organization || application.bank.username}</p>
              {application.blockchain_tx_hash ? <p className="muted small">Tx: {application.blockchain_tx_hash}</p> : null}
            </article>
          )) : <div className="app-empty">No applications available for admin review.</div>}
        </div>
      </section>
      <section className="panel">
        <h3 className="panel-head"><PanelIcon name="chart" /> System overview</h3>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-ico blue"><Icon name="users" size={15} /></span>
            <strong>{summary.counts.users || 0}</strong>
            <span>Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-ico amber"><Icon name="bank" size={15} /></span>
            <strong>{summary.counts.banks || 0}</strong>
            <span>Banks</span>
          </div>
          <div className="stat-card">
            <span className="stat-ico violet"><Icon name="doc" size={15} /></span>
            <strong>{summary.counts.applications || 0}</strong>
            <span>Applications</span>
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (role && user.role !== role) {
    return <Navigate to={`/dashboard/${user.role}`} replace />
  }
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/dashboard/${user.role}`} replace /> : <LandingPage />} />
      <Route path="/auth/combined" element={<CombinedLoginPage />} />
      <Route path="/auth/:mode/:role" element={<AuthPage />} />
      <Route path="/dashboard/user" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/bank" element={<ProtectedRoute role="bank"><BankDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
