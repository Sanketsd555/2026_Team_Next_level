import { useEffect, useState } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ users: [], banks: [], counts: {} })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [bankForm, setBankForm] = useState({ username: '', organization: '', password: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ organization: '', password: '' })
  const [adminMsg, setAdminMsg] = useState('')
  const [adminError, setAdminError] = useState('')

  const refresh = async () => {
    try {
      const r = await api.get('/admin/summary/')
      setSummary(r.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const addBank = async (e) => {
    e.preventDefault()
    setAdminMsg(''); setAdminError('')
    try {
      await api.post('/admin/banks/', bankForm)
      setBankForm({ username: '', organization: '', password: '' })
      setAdminMsg('Bank integration added successfully.')
      await refresh()
    } catch (err) { setAdminError(err.response?.data?.detail || 'Error adding bank') }
  }

  const saveEdit = async (bankId) => {
    setAdminMsg(''); setAdminError('')
    try {
      const payload = { organization: editForm.organization }
      if (editForm.password) payload.password = editForm.password
      await api.patch(`/admin/banks/${bankId}/`, payload)
      setEditingId(null)
      setAdminMsg('Integration updated.')
      await refresh()
    } catch (err) { setAdminError('Update failed') }
  }

  const deleteBank = async (bankId) => {
    setAdminMsg(''); setAdminError('')
    try {
      await api.delete(`/admin/banks/${bankId}/`)
      setAdminMsg('Integration deleted.')
      await refresh()
    } catch (err) { setAdminError('Delete failed') }
  }

  const navItems = [
    { id: 'overview', icon: 'chart', label: 'System Overview', active: activeTab === 'overview', onClick: () => setActiveTab('overview') },
    { id: 'users', icon: 'users', label: 'User Directory', active: activeTab === 'users', onClick: () => setActiveTab('users') },
    { id: 'banks', icon: 'bank', label: 'Bank Integrations', active: activeTab === 'banks', onClick: () => setActiveTab('banks') },
  ]

  if (loading) return <Layout title="Admin Console" navItems={navItems}><LoadingSpinner text="Connecting..." /></Layout>

  return (
    <Layout title="Admin Console" navItems={navItems}>
      <div className="grid-3 animate-fade-in-up" style={{ marginBottom: '24px' }}>
        <StatCard icon="users" value={summary.counts.users || 0} label="Active Users" />
        <StatCard icon="bank" value={summary.counts.banks || 0} label="Bank Integrations" />
        <StatCard icon="doc" value={summary.counts.applications || 0} label="Processed Apps" />
      </div>

      {activeTab === 'overview' && (
        <div className="grid-2 animate-fade-in">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Users</div>
              <button className="btn-ghost btn-sm" onClick={() => setActiveTab('users')}>View All</button>
            </div>
            <div className="stack">
              {summary.users.slice(0, 5).map((u) => (
                <div className="user-item" key={u.id}>
                  <div>
                    <h4>{u.username}</h4>
                    <p className="text-muted text-sm">{u.email || 'No email'}</p>
                  </div>
                </div>
              ))}
              {!summary.users.length && <EmptyState title="No users yet" />}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Bank Integrations</div>
              <button className="btn-ghost btn-sm" onClick={() => setActiveTab('banks')}>Manage</button>
            </div>
            <div className="stack">
              {summary.banks.slice(0, 5).map((b) => (
                <div className="user-item" key={b.id}>
                  <div>
                    <h4>{b.organization || b.username}</h4>
                    <p className="text-muted text-sm">@{b.username} • {b.application_count || 0} apps</p>
                  </div>
                </div>
              ))}
              {!summary.banks.length && <EmptyState title="No integrations yet" />}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card animate-fade-in">
          <div className="card-header"><div className="card-title">User Directory</div></div>
          <div className="stack">
            {summary.users.length ? summary.users.map((u) => (
              <div className="user-item" key={u.id}>
                <div><h4>{u.username}</h4><p className="text-muted text-sm">{u.email || 'No email provided'}</p></div>
              </div>
            )) : <EmptyState title="No user accounts" />}
          </div>
        </div>
      )}

      {activeTab === 'banks' && (
        <div className="card animate-fade-in">
          <div className="card-header"><div className="card-title">Bank Integrations</div></div>
          
          <form className="admin-form" onSubmit={addBank}>
            <div className="eyebrow" style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Add Integration</div>
            <div className="grid-3">
              <div className="field"><input value={bankForm.username} onChange={(e) => setBankForm({ ...bankForm, username: e.target.value })} placeholder="System Username (e.g. hdfc_api)" required /></div>
              <div className="field"><input value={bankForm.organization} onChange={(e) => setBankForm({ ...bankForm, organization: e.target.value })} placeholder="Display Name (e.g. HDFC Bank)" required /></div>
              <div className="field"><input value={bankForm.password} onChange={(e) => setBankForm({ ...bankForm, password: e.target.value })} placeholder="Initial Password" required /></div>
            </div>
            <button className="btn-full">Create Integration</button>
          </form>

          {adminMsg && <div className="alert success" style={{ marginBottom: '16px' }}>{adminMsg}</div>}
          {adminError && <div className="alert error" style={{ marginBottom: '16px' }}>{adminError}</div>}

          <div className="stack">
            {summary.banks.length ? summary.banks.map((bank) => (
              <div className="bank-item" key={bank.id} style={{ justifyContent: 'space-between' }}>
                {editingId === bank.id ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                    <input style={{ width: '200px' }} value={editForm.organization} onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })} />
                    <input style={{ width: '150px' }} type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="New password" />
                    <button className="btn-success btn-sm" onClick={() => saveEdit(bank.id)}>Save</button>
                    <button className="btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4>{bank.organization || bank.username}</h4>
                      <p className="text-muted text-sm">@{bank.username}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary btn-sm" onClick={() => { setEditingId(bank.id); setEditForm({ organization: bank.organization || '', password: '' }) }}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => deleteBank(bank.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            )) : <EmptyState title="No integrations" />}
          </div>
        </div>
      )}
    </Layout>
  )
}
