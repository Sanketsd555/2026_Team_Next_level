import { useEffect, useState } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { Icon } from '../components/Icons'
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
  const [adminBusy, setAdminBusy] = useState(false)

  const refresh = async () => {
    try {
      const r = await api.get('/admin/summary/')
      setSummary(r.data)
    } catch {
      /* keep existing */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const addBank = async (e) => {
    e.preventDefault()
    setAdminBusy(true)
    setAdminMsg('')
    setAdminError('')
    try {
      await api.post('/admin/banks/', bankForm)
      setBankForm({ username: '', organization: '', password: '' })
      setAdminMsg(`Bank "${bankForm.organization || bankForm.username}" added.`)
      await refresh()
    } catch (err) {
      setAdminError(err.response?.data?.detail || 'Could not add the bank.')
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
    } catch (err) {
      setAdminError(err.response?.data?.detail || 'Could not update the bank.')
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
    } catch (err) {
      setAdminError(err.response?.data?.detail || 'Could not delete the bank.')
    } finally {
      setAdminBusy(false)
    }
  }

  const navItems = [
    { id: 'overview', icon: 'chart', label: 'Overview', active: activeTab === 'overview', onClick: () => setActiveTab('overview') },
    { id: 'users', icon: 'users', label: 'Users', active: activeTab === 'users', onClick: () => setActiveTab('users') },
    { id: 'banks', icon: 'bank', label: 'Banks', active: activeTab === 'banks', onClick: () => setActiveTab('banks') },
  ]

  if (loading) {
    return (
      <Layout title="Admin Dashboard" navItems={navItems}>
        <LoadingSpinner text="Loading admin data..." size="lg" />
      </Layout>
    )
  }

  return (
    <Layout title="Admin Dashboard" subtitle="Manage users and banks" navItems={navItems}>
      {/* Stats Row - always visible */}
      <div className="grid-3 animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon="users" iconColor="accent" value={summary.counts.users || 0} label="Total Users" colorClass="accent" />
        <StatCard icon="bank" iconColor="warning" value={summary.counts.banks || 0} label="Total Banks" colorClass="warning" />
        <StatCard icon="doc" iconColor="success" value={summary.counts.applications || 0} label="Applications" colorClass="success" />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid-2 animate-fade-in">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Icon name="users" size={18} /> Recent Users</div>
              <button className="btn-ghost btn-sm" onClick={() => setActiveTab('users')}>View all</button>
            </div>
            <div className="stack">
              {summary.users.slice(0, 5).map((u) => (
                <div className="user-item" key={u.id}>
                  <div className="avatar accent"><Icon name="user" size={15} /></div>
                  <div>
                    <h4>{u.username}</h4>
                    <p className="text-muted text-sm">{u.email || 'No email'}</p>
                  </div>
                </div>
              ))}
              {!summary.users.length && <EmptyState icon="users" title="No users yet" />}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Icon name="bank" size={18} /> Banks</div>
              <button className="btn-ghost btn-sm" onClick={() => setActiveTab('banks')}>Manage</button>
            </div>
            <div className="stack">
              {summary.banks.slice(0, 5).map((b) => (
                <div className="user-item" key={b.id}>
                  <div className="avatar warning"><Icon name="landmark" size={15} /></div>
                  <div>
                    <h4>{b.organization || b.username}</h4>
                    <p className="text-muted text-sm">
                      @{b.username}{b.application_count ? ` · ${b.application_count} app(s)` : ''}
                    </p>
                  </div>
                </div>
              ))}
              {!summary.banks.length && <EmptyState icon="bank" title="No banks yet" />}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title"><Icon name="users" size={18} /> All Users</div>
            <span className="text-muted text-sm">{summary.users.length} user{summary.users.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="stack">
            {summary.users.length ? summary.users.map((u, i) => (
              <div className="user-item animate-fade-in-up" key={u.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="avatar accent"><Icon name="user" size={15} /></div>
                <div>
                  <h4>{u.username}</h4>
                  <p className="text-muted text-sm">{u.email || 'No email provided'}</p>
                </div>
              </div>
            )) : <EmptyState icon="users" title="No user accounts" message="Users can create accounts from the signup page." />}
          </div>
        </div>
      )}

      {/* Banks Tab */}
      {activeTab === 'banks' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title"><Icon name="bank" size={18} /> Bank Management</div>
          </div>

          {/* Add Bank Form */}
          <form className="admin-form" onSubmit={addBank}>
            <div className="form-grid">
              <div className="field">
                <label className="field-label"><Icon name="user" size={14} /> Username</label>
                <input value={bankForm.username} onChange={(e) => setBankForm({ ...bankForm, username: e.target.value })} placeholder="e.g. hdfc_bank" required />
              </div>
              <div className="field">
                <label className="field-label"><Icon name="bank" size={14} /> Organization</label>
                <input value={bankForm.organization} onChange={(e) => setBankForm({ ...bankForm, organization: e.target.value })} placeholder="e.g. HDFC Bank Ltd" required />
              </div>
              <div className="field full-span">
                <label className="field-label"><Icon name="lock" size={14} /> Password</label>
                <input type="text" value={bankForm.password} onChange={(e) => setBankForm({ ...bankForm, password: e.target.value })} placeholder="Login password for this bank" required />
              </div>
            </div>
            <button disabled={adminBusy}><Icon name="plus" size={14} /> Add Bank</button>
          </form>

          {/* Messages */}
          {adminMsg && <div className="alert success" style={{ marginBottom: '0.75rem' }}><Icon name="check" size={14} /> {adminMsg}</div>}
          {adminError && <div className="alert error" style={{ marginBottom: '0.75rem' }}><Icon name="cross" size={14} /> {adminError}</div>}

          {/* Bank List */}
          <div className="stack">
            {summary.banks.length ? summary.banks.map((bank, i) => (
              <div className="bank-item animate-fade-in-up" key={bank.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="avatar warning"><Icon name="landmark" size={15} /></div>
                <div className="bank-item-info">
                  {editingId === bank.id ? (
                    <div className="bank-edit-form">
                      <div className="field">
                        <label className="field-label"><Icon name="bank" size={14} /> Organization</label>
                        <input value={editForm.organization} onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })} />
                      </div>
                      <div className="field">
                        <label className="field-label"><Icon name="lock" size={14} /> New password (blank to keep)</label>
                        <input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="New password" />
                      </div>
                      <div className="bank-edit-actions">
                        <button className="btn-success btn-sm" onClick={() => saveEdit(bank.id)} disabled={adminBusy}>
                          <Icon name="check" size={14} /> Save
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => setEditingId(null)} disabled={adminBusy}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4>{bank.organization || bank.username}</h4>
                      <p className="text-muted text-sm">
                        @{bank.username}{bank.application_count ? ` · ${bank.application_count} application(s)` : ''}
                      </p>
                    </div>
                  )}
                </div>
                {editingId !== bank.id && (
                  <div className="bank-item-actions">
                    <button className="btn-ghost btn-sm" onClick={() => startEdit(bank)} disabled={adminBusy}>
                      <Icon name="edit" size={13} />
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => deleteBank(bank)} disabled={adminBusy}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                )}
              </div>
            )) : <EmptyState icon="bank" title="No bank accounts" message="Add a new bank using the form above." />}
          </div>
        </div>
      )}
    </Layout>
  )
}
