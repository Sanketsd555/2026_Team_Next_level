import { useEffect, useState } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { Icon } from '../components/Icons'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function BankDashboard() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const refresh = async () => {
    try {
      const r = await api.get('/applications/')
      setApplications(r.data)
    } catch {
      /* keep existing */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const updateStatus = async (id, status) => {
    await api.patch(`/applications/${id}/`, { status })
    await refresh()
  }

  const filtered = filter === 'all'
    ? applications
    : applications.filter((a) => a.status === filter)

  const counts = {
    total: applications.length,
    approved: applications.filter((a) => a.status === 'approved').length,
    pending: applications.filter((a) => a.status === 'pending').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  const navItems = [
    { id: 'all', icon: 'doc', label: `All (${counts.total})`, active: filter === 'all', onClick: () => setFilter('all') },
    { id: 'pending', icon: 'clock', label: `Pending (${counts.pending})`, active: filter === 'pending', onClick: () => setFilter('pending') },
    { id: 'approved', icon: 'check', label: `Approved (${counts.approved})`, active: filter === 'approved', onClick: () => setFilter('approved') },
    { id: 'rejected', icon: 'cross', label: `Rejected (${counts.rejected})`, active: filter === 'rejected', onClick: () => setFilter('rejected') },
  ]

  if (loading) {
    return (
      <Layout title="Bank Dashboard" navItems={navItems}>
        <LoadingSpinner text="Loading applications..." size="lg" />
      </Layout>
    )
  }

  return (
    <Layout title="Bank Dashboard" subtitle="Review and manage applications" navItems={navItems}>
      {/* Stats Row */}
      <div className="grid-4 animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon="doc" iconColor="accent" value={counts.total} label="Total Applications" colorClass="accent" />
        <StatCard icon="check" iconColor="success" value={counts.approved} label="Approved" colorClass="success" />
        <StatCard icon="clock" iconColor="warning" value={counts.pending} label="Pending Review" colorClass="warning" />
        <StatCard icon="cross" iconColor="danger" value={counts.rejected} label="Rejected" colorClass="danger" />
      </div>

      {/* Application List */}
      <div className="card animate-fade-in">
        <div className="card-header">
          <div className="card-title">
            <Icon name="doc" size={18} />
            {filter === 'all' ? 'All Applications' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`}
          </div>
          <span className="text-muted text-sm">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="stack">
          {filtered.length ? filtered.map((app, i) => (
            <div className="bank-app-card" key={app.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="bank-app-header">
                <div>
                  <div className="eyebrow">{app.applicant.username}</div>
                  <h4 style={{ margin: '0.125rem 0 0.25rem' }}>{app.full_name}</h4>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <div className="row-between">
                <span className="bank-app-amount">{fmtINR(app.amount)}</span>
                <span className="bank-app-purpose text-secondary text-sm">for {app.purpose}</span>
              </div>
              <p className="bank-app-meta text-sm">
                Tenure: {app.tenure_months}mo &nbsp;·&nbsp; {app.email} &nbsp;·&nbsp; {app.mobile_number}
              </p>
              <div className="tag-row">
                <span className="tag">PAN: {app.pan_number}</span>
                <span className="tag">Aadhaar: {app.aadhar_number}</span>
                <span className="tag">Acct: {app.bank_account_number}</span>
                <span className="tag">IFSC: {app.ifsc_code}</span>
              </div>
              <div className="bank-app-actions">
                <button className="btn-success btn-sm" onClick={() => updateStatus(app.id, 'approved')}>
                  <Icon name="check" size={14} /> Approve
                </button>
                <button className="btn-danger btn-sm" onClick={() => updateStatus(app.id, 'rejected')}>
                  <Icon name="cross" size={14} /> Reject
                </button>
              </div>
            </div>
          )) : (
            <EmptyState icon="doc" title="No applications found" message={filter === 'all' ? 'No applications submitted yet.' : `No ${filter} applications.`} />
          )}
        </div>
      </div>
    </Layout>
  )
}
