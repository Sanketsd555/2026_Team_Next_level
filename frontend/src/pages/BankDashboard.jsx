import { useEffect, useState } from 'react'
import api from '../api'
import Layout from '../components/Layout'
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
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const updateStatus = async (id, status) => {
    await api.patch(`/applications/${id}/`, { status })
    await refresh()
  }

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter)
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

  if (loading) return <Layout title="Bank Operations" navItems={navItems}><LoadingSpinner text="Loading..." /></Layout>

  return (
    <Layout title="Bank Operations" navItems={navItems}>
      <div className="grid-4 animate-fade-in-up" style={{ marginBottom: '24px' }}>
        <StatCard icon="doc" iconColor="accent" value={counts.total} label="Total Volume" />
        <StatCard icon="check" iconColor="success" value={counts.approved} label="Approved" />
        <StatCard icon="clock" iconColor="warning" value={counts.pending} label="Pending Review" />
        <StatCard icon="cross" iconColor="danger" value={counts.rejected} label="Rejected" />
      </div>

      <div className="card animate-fade-in">
        <div className="card-header">
          <div className="card-title">{filter === 'all' ? 'All Applications' : `${filter.charAt(0).toUpperCase() + filter.slice(1)}`}</div>
          <span className="text-muted text-sm">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="stack">
          {filtered.length ? filtered.map((app) => (
            <div className="bank-app-card" key={app.id}>
              <div className="row-between">
                <div>
                  <h4 style={{ fontSize: '14px', marginBottom: '2px' }}>{app.full_name}</h4>
                  <div className="text-secondary text-sm" style={{ marginBottom: '8px' }}>
                    @{app.applicant.username} • {app.email} • {app.mobile_number}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="bank-app-amount">{fmtINR(app.amount)}</div>
                  <div className="text-secondary text-sm">for {app.purpose} ({app.tenure_months}mo)</div>
                </div>
              </div>
              
              <div className="tag-row" style={{ marginTop: '0', marginBottom: '12px' }}>
                <span className="tag">PAN: {app.pan_number}</span>
                <span className="tag">UID: {app.aadhar_number}</span>
                <span className="tag">ACC: {app.bank_account_number}</span>
                <span className="tag">IFSC: {app.ifsc_code}</span>
              </div>
              
              <div className="row-between" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <StatusBadge status={app.status} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-success btn-sm" onClick={() => updateStatus(app.id, 'approved')}>Approve</button>
                  <button className="btn-danger btn-sm" onClick={() => updateStatus(app.id, 'rejected')}>Reject</button>
                </div>
              </div>
            </div>
          )) : <EmptyState title="No records found" />}
        </div>
      </div>
    </Layout>
  )
}
