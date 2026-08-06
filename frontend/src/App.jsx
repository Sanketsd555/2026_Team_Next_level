import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import api from './api'
import { useAuth } from './AuthContext'
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
              {card.role === 'user' ? (
                <>
                  <button onClick={() => navigate(`/auth/signup/${card.role}`)}>
                    Sign up
                    <Icon name="arrow" size={14} />
                  </button>
                  <button className="ghost-button" onClick={() => navigate(`/auth/login/${card.role}`)}>Login</button>
                </>
              ) : card.role === 'bank' ? (
                <>
                  <button className="wide-button" onClick={() => navigate(`/auth/login/${card.role}`)}>
                    Login
                    <Icon name="arrow" size={14} />
                  </button>
                  <button className="ghost-button" onClick={() => navigate(`/auth/login/${card.role}`)}><Icon name="key" size={13} /> Demo accounts</button>
                </>
              ) : (
                <button className="wide-button" onClick={() => navigate(`/auth/login/${card.role}`)}>
                  Login
                  <Icon name="arrow" size={14} />
                </button>
              )}
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
    await refresh()
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
                <input type="tel" pattern="[0-9]{12}" maxLength="12" placeholder="12-digit Aadhaar number" value={form.aadhar_number} onChange={(event) => setForm({ ...form, aadhar_number: event.target.value })} required />
              </label>
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
    </AppShell>
  )
}

function BankDashboard() {
  const [applications, setApplications] = useState([])

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
                <div className="kyc-details">
                  <span>PAN: {application.pan_number}</span>
                  <span>Aadhaar: {application.aadhar_number}</span>
                  <span>Account: {application.bank_account_number}</span>
                  <span>IFSC: {application.ifsc_code}</span>
                </div>
                <div className="card-actions">
                  <button className="approve-btn" onClick={() => updateStatus(application.id, 'approved')}><Icon name="check" size={14} /> Approve</button>
                  <button className="reject-btn" onClick={() => updateStatus(application.id, 'rejected')}><Icon name="cross" size={14} /> Reject</button>
                </div>
              </article>
            )) : <div className="app-empty">No incoming applications right now.</div>}
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function AdminDashboard() {
  const [summary, setSummary] = useState({ users: [], banks: [], counts: {} })
  const [bankForm, setBankForm] = useState({ username: '', organization: '', password: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ organization: '', password: '' })
  const [adminMsg, setAdminMsg] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminBusy, setAdminBusy] = useState(false)

  const refresh = async () => {
    const response = await api.get('/admin/summary/')
    setSummary(response.data)
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
      <Route path="/auth/:mode/:role" element={<AuthPage />} />
      <Route path="/dashboard/user" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/bank" element={<ProtectedRoute role="bank"><BankDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
