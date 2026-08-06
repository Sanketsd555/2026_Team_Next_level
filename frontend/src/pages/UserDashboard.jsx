import { useEffect, useState } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { AdIcon, HeroArt, Icon } from '../components/Icons'
import StatCard from '../components/StatCard'
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
    try {
      const [adsR, banksR, appsR] = await Promise.all([
        api.get('/loan-ads/'),
        api.get('/banks/'),
        api.get('/applications/'),
      ])
      setAds(adsR.data)
      setBanks(banksR.data)
      setApplications(appsR.data)
    } catch {
      /* keep existing data */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const submitApplication = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/applications/', {
        ...form,
        bank_id: Number(form.bank_id),
        amount: Number(form.amount),
        tenure_months: Number(form.tenure_months),
      })
      setForm({
        bank_id: '', full_name: '', email: '', mobile_number: '',
        pan_number: '', aadhar_number: '', bank_account_number: '',
        ifsc_code: '', amount: '', purpose: '', tenure_months: '12',
      })
      setMessage('Application submitted successfully!')
      await refresh()
    } catch {
      setMessage('')
    }
  }

  const navItems = [
    { id: 'marketplace', icon: 'card', label: 'Loan Marketplace', active: activeTab === 'marketplace', onClick: () => setActiveTab('marketplace') },
    { id: 'apply', icon: 'send', label: 'Apply for Loan', active: activeTab === 'apply', onClick: () => setActiveTab('apply') },
    { id: 'applications', icon: 'doc', label: 'My Applications', active: activeTab === 'applications', onClick: () => setActiveTab('applications') },
  ]

  if (loading) {
    return (
      <Layout title="User Dashboard" navItems={navItems}>
        <LoadingSpinner text="Loading dashboard..." size="lg" />
      </Layout>
    )
  }

  return (
    <Layout title="User Dashboard" subtitle="Browse offers and apply" navItems={navItems}>
      {/* Hero Banner */}
      <div className="hero-banner animate-fade-in-up">
        <div className="hero-banner-content">
          <div className="eyebrow">LoanFlow Marketplace</div>
          <h2>Find the right loan for your needs</h2>
          <p>Compare offers from partner banks — check rates, calculate EMIs, and apply in minutes.</p>
          <div className="hero-stats-row">
            <div className="hero-stat">
              <div className="hero-stat-icon"><Icon name="card" size={16} /></div>
              <div className="hero-stat-data">
                <strong>{ads.length}</strong>
                <span>Loan Ads</span>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon"><Icon name="bank" size={16} /></div>
              <div className="hero-stat-data">
                <strong>{banks.length}</strong>
                <span>Banks</span>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon"><Icon name="doc" size={16} /></div>
              <div className="hero-stat-data">
                <strong>{applications.length}</strong>
                <span>Applications</span>
              </div>
            </div>
          </div>
        </div>
        <HeroArt />
      </div>

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title"><Icon name="card" size={18} /> Loan Advertisements</div>
          </div>
          <div className="stack">
            {ads.length ? ads.map((ad, i) => (
              <div className="ad-card animate-fade-in-up" key={ad.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="ad-card-icon"><AdIcon title={ad.title} /></div>
                <div className="ad-card-body">
                  <div className="eyebrow">{ad.bank_name}</div>
                  <h4>{ad.title}</h4>
                  <p>{ad.description}</p>
                  <div className="ad-card-meta">APR {ad.apr}% &nbsp;|&nbsp; {fmtINR(ad.min_amount)} – {fmtINR(ad.max_amount)}</div>
                </div>
              </div>
            )) : (
              <EmptyState icon="card" title="No loan advertisements" message="Check back later for new offers from banks." />
            )}
          </div>
        </div>
      )}

      {/* Apply Tab */}
      {activeTab === 'apply' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title"><Icon name="send" size={18} /> Loan Application</div>
          </div>
          <form onSubmit={submitApplication}>
            <div className="form-grid">
              <div className="field full-span">
                <label className="field-label"><Icon name="bank" size={14} /> Bank</label>
                <select value={form.bank_id} onChange={(e) => setForm({ ...form, bank_id: e.target.value })} required>
                  <option value="">Choose a bank</option>
                  {banks.map((b) => <option value={b.id} key={b.id}>{b.organization || b.username}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label"><Icon name="user" size={14} /> Full Name</label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="email" size={14} /> Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="phone" size={14} /> Mobile Number</label>
                <input type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit mobile" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="card" size={14} /> PAN Number</label>
                <input maxLength="10" placeholder="e.g. ABCDE1234F" value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="card" size={14} /> Aadhaar Number</label>
                <input type="tel" pattern="[0-9]{12}" maxLength="12" placeholder="12-digit Aadhaar" value={form.aadhar_number} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="wallet" size={14} /> Bank Account</label>
                <input placeholder="Account number" value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="landmark" size={14} /> IFSC Code</label>
                <input maxLength="11" placeholder="e.g. HDFC0001234" value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="rupee" size={14} /> Amount (₹)</label>
                <input type="number" min="100" placeholder="e.g. 500000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="doc" size={14} /> Purpose</label>
                <input placeholder="e.g. Home renovation" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="calendar" size={14} /> Tenure (months)</label>
                <input type="number" min="1" value={form.tenure_months} onChange={(e) => setForm({ ...form, tenure_months: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn-full btn-lg" type="submit">
                <Icon name="send" size={15} /> Submit Application
              </button>
            </div>
            {message && <div className="alert success" style={{ marginTop: '0.75rem' }}><Icon name="check" size={14} /> {message}</div>}
          </form>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title"><Icon name="doc" size={18} /> My Applications</div>
          </div>
          <div className="stack">
            {applications.length ? applications.map((app, i) => (
              <div className="app-card animate-fade-in-up" key={app.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="app-card-header">
                  <h4>{app.purpose}</h4>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-secondary text-sm">{fmtINR(app.amount)} requested from {app.bank.username}</p>
              </div>
            )) : (
              <EmptyState icon="doc" title="No applications yet" message="Pick a bank and submit your first loan application." />
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
