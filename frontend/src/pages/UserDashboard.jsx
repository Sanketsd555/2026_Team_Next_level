import { useEffect, useState } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { AdIcon, Icon } from '../components/Icons'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function UserDashboard() {
  const [ads, setAds] = useState([])
  const [banks, setBanks] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('marketplace')
  const [form, setForm] = useState({
    bank_id: '', full_name: '', email: '', mobile_number: '', pan_number: '', 
    aadhar_number: '', bank_account_number: '', ifsc_code: '', amount: '', purpose: '', tenure_months: '12',
  })
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const [adsR, banksR, appsR] = await Promise.all([
        api.get('/loan-ads/'), api.get('/banks/'), api.get('/applications/'),
      ])
      setAds(adsR.data)
      setBanks(banksR.data)
      setApplications(appsR.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const submitApplication = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/applications/', {
        ...form, bank_id: Number(form.bank_id), amount: Number(form.amount), tenure_months: Number(form.tenure_months),
      })
      setForm({
        bank_id: '', full_name: '', email: '', mobile_number: '', pan_number: '', 
        aadhar_number: '', bank_account_number: '', ifsc_code: '', amount: '', purpose: '', tenure_months: '12',
      })
      setMessage('Application submitted successfully!')
      await refresh()
    } catch { setMessage('') }
  }

  const navItems = [
    { id: 'marketplace', icon: 'card', label: 'Marketplace', active: activeTab === 'marketplace', onClick: () => setActiveTab('marketplace') },
    { id: 'apply', icon: 'send', label: 'Apply', active: activeTab === 'apply', onClick: () => setActiveTab('apply') },
    { id: 'applications', icon: 'doc', label: 'My Applications', active: activeTab === 'applications', onClick: () => setActiveTab('applications') },
  ]

  if (loading) return <Layout title="Dashboard" navItems={navItems}><LoadingSpinner text="Loading data..." /></Layout>

  return (
    <Layout title="Dashboard" navItems={navItems}>
      {/* Stark Hero Section */}
      <div className="hero-banner animate-fade-in-up">
        <div className="eyebrow">Marketplace Overview</div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Loan Offerings & Applications</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '600px' }}>
          Compare offerings from partner banks and track your active loan applications.
        </p>
        <div className="hero-stats-row">
          <div className="hero-stat-data">
            <strong>{ads.length}</strong>
            <span>Active Offers</span>
          </div>
          <div className="hero-stat-data">
            <strong>{banks.length}</strong>
            <span>Partner Banks</span>
          </div>
          <div className="hero-stat-data">
            <strong>{applications.length}</strong>
            <span>My Applications</span>
          </div>
        </div>
      </div>

      {activeTab === 'marketplace' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title">Available Loans</div>
          </div>
          <div className="stack">
            {ads.length ? ads.map((ad) => (
              <div className="bank-item" key={ad.id}>
                <AdIcon title={ad.title} />
                <div style={{ flex: 1 }}>
                  <div className="row-between">
                    <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>{ad.title}</h4>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{fmtINR(ad.min_amount)} – {fmtINR(ad.max_amount)}</span>
                  </div>
                  <div className="row-between">
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{ad.bank_name} • APR: {ad.apr}%</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{ad.description}</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState title="No offers found" />}
          </div>
        </div>
      )}

      {activeTab === 'apply' && (
        <div className="card animate-fade-in" style={{ maxWidth: '800px' }}>
          <div className="card-header">
            <div className="card-title">New Application</div>
          </div>
          <form onSubmit={submitApplication}>
            <div className="grid-2">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Target Bank</label>
                <select value={form.bank_id} onChange={(e) => setForm({ ...form, bank_id: e.target.value })} required>
                  <option value="">Select a bank</option>
                  {banks.map((b) => <option value={b.id} key={b.id}>{b.organization || b.username}</option>)}
                </select>
              </div>
              <div className="field"><label className="field-label">Full Name</label><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div className="field"><label className="field-label">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="field"><label className="field-label">Mobile</label><input type="tel" pattern="[0-9]{10}" maxLength="10" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} required /></div>
              <div className="field"><label className="field-label">PAN</label><input maxLength="10" value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })} required /></div>
              <div className="field"><label className="field-label">Aadhaar</label><input type="tel" pattern="[0-9]{12}" maxLength="12" value={form.aadhar_number} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} required /></div>
              <div className="field"><label className="field-label">Account No</label><input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} required /></div>
              <div className="field"><label className="field-label">IFSC Code</label><input maxLength="11" value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })} required /></div>
              <div className="field"><label className="field-label">Amount (₹)</label><input type="number" min="100" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="field"><label className="field-label">Purpose</label><input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required /></div>
              <div className="field"><label className="field-label">Tenure (mo)</label><input type="number" min="1" value={form.tenure_months} onChange={(e) => setForm({ ...form, tenure_months: e.target.value })} required /></div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn-full" type="submit">Submit</button>
              {message && <span className="text-sm" style={{ color: 'var(--success)' }}>{message}</span>}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title">My Applications</div>
          </div>
          <div className="stack">
            {applications.length ? applications.map((app) => (
              <div className="bank-item" key={app.id}>
                <div style={{ flex: 1 }}>
                  <div className="row-between">
                    <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>{app.purpose}</h4>
                    <StatusBadge status={app.status} />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{fmtINR(app.amount)} from {app.bank.username}</p>
                </div>
              </div>
            )) : <EmptyState title="No applications yet" />}
          </div>
        </div>
      )}
    </Layout>
  )
}
