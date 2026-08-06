import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const roleLabels = { user: 'User', bank: 'Bank', admin: 'Admin' }

export default function AuthPage() {
  const { mode, role } = useParams()
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [demoBanks, setDemoBanks] = useState([])

  const heading = useMemo(() => `${mode === 'signup' ? 'Sign up' : 'Log in'} as ${roleLabels[role]}`, [mode, role])

  useEffect(() => {
    if (mode === 'signup' && role !== 'user') navigate(`/auth/login/${role}`, { replace: true })
    if (role === 'bank' && mode === 'login') api.get('/demo-banks/').then((r) => setDemoBanks(r.data)).catch(() => {})
  }, [role, mode, navigate])

  const formatError = (data) => {
    if (typeof data === 'string') return data
    if (data?.detail) return data.detail
    if (data?.non_field_errors) return data.non_field_errors.join(' ')
    const first = data && Object.entries(data)[0]
    if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(' ') : first[1]}`
    return 'Authentication failed.'
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      if (mode === 'signup') await register({ ...form, role })
      else await login({ username: form.username, password: form.password, role })
      navigate(`/dashboard/${role}`)
    } catch (err) { setError(formatError(err.response?.data)) }
    finally { setBusy(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div style={{ width: 24, height: 24, background: 'var(--accent)', color: 'var(--text-inverted)', display: 'grid', placeItems: 'center', borderRadius: 4, marginRight: 8 }}>LF</div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>LoanFlow</span>
          <div style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}><ThemeToggle /></div>
        </div>

        <div className="auth-header">
          <h2 className="auth-title">{heading}</h2>
          <p className="auth-subtitle">Enter your details to proceed.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label className="field-label">Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>

          {mode === 'signup' && (
            <div className="field">
              <label className="field-label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          )}

          <div className="field">
            <label className="field-label">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          {role === 'bank' && mode === 'login' && demoBanks.length > 0 && (
            <div className="demo-box">
              <p className="demo-box-title">Demo Integrations</p>
              {demoBanks.map((bank) => (
                <button type="button" className="demo-row" key={bank.username} onClick={() => setForm({ ...form, username: bank.username, password: bank.password })}>
                  <span style={{ fontWeight: 500 }}>{bank.organization}</span>
                  <span><code>{bank.username}</code></span>
                </button>
              ))}
            </div>
          )}

          {error && <div className="alert error" style={{ marginTop: '12px' }}>{error}</div>}

          <button type="submit" className="btn-full" style={{ marginTop: '16px', height: '40px' }} disabled={busy}>
            {busy ? 'Working...' : 'Continue'}
          </button>
        </form>

        {role === 'user' && (
          <div className="auth-switch">
            {mode === 'login' ? (
              <>No account? <button onClick={() => navigate(`/auth/signup/${role}`)} style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Sign up</button></>
            ) : (
              <>Have an account? <button onClick={() => navigate(`/auth/login/${role}`)} style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Log in</button></>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
