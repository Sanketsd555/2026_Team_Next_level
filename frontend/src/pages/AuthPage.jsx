import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import { Icon } from '../components/Icons'
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

  const heading = useMemo(
    () => `${mode === 'signup' ? 'Sign up' : 'Login'} as ${roleLabels[role]}`,
    [mode, role]
  )

  useEffect(() => {
    if (mode === 'signup' && role !== 'user') {
      navigate(`/auth/login/${role}`, { replace: true })
    }
    if (role === 'bank' && mode === 'login') {
      api.get('/demo-banks/').then((r) => setDemoBanks(r.data)).catch(() => {})
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

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') {
        await register({ ...form, role })
      } else {
        await login({ username: form.username, password: form.password, role })
      }
      navigate(`/dashboard/${role}`)
    } catch (err) {
      setError(formatError(err.response?.data))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <div className="auth-brand-icon">
            <Icon name="trending" size={18} />
          </div>
          <span className="auth-brand-name">LoanFlow</span>
          <div style={{ marginLeft: 'auto' }}>
            <ThemeToggle />
          </div>
        </div>

        <div className="auth-header">
          <h2 className="auth-title">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'signup'
              ? `Joining LoanFlow as a ${roleLabels[role]}`
              : `Sign in to your ${roleLabels[role]} dashboard`}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label className="field-label">
              <Icon name="user" size={14} /> Username
            </label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter your username"
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="field">
              <label className="field-label">
                <Icon name="email" size={14} /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          <div className="field">
            <label className="field-label">
              <Icon name="lock" size={14} /> Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>

          {role === 'bank' && mode === 'login' && demoBanks.length > 0 && (
            <div className="demo-box">
              <p className="demo-box-title">
                <Icon name="bank" size={13} /> Demo NBFC Bank Accounts
              </p>
              {demoBanks.map((bank) => (
                <button
                  type="button"
                  className="demo-row"
                  key={bank.username}
                  onClick={() => setForm({ ...form, username: bank.username, password: bank.password })}
                >
                  <span className="demo-row-name">
                    <Icon name="landmark" size={14} /> {bank.organization}
                  </span>
                  <span className="demo-row-creds">
                    <code>{bank.username}</code> / <code>{bank.password}</code>
                  </span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="alert error">
              <Icon name="cross" size={14} /> {error}
            </div>
          )}

          <button type="submit" className="btn-lg btn-full" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Working...
              </>
            ) : (
              <>
                {mode === 'signup' ? 'Create account' : 'Login'}
                <Icon name={mode === 'signup' ? 'check' : 'arrow'} size={14} />
              </>
            )}
          </button>
        </form>

        {role === 'user' && (
          <div className="auth-switch">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => navigate(`/auth/signup/${role}`)}>Sign up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => navigate(`/auth/login/${role}`)}>Login</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
