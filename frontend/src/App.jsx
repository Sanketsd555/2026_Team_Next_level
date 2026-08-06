import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import UserDashboard from './pages/UserDashboard'
import BankDashboard from './pages/BankDashboard'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner lg" />
        <span>Loading...</span>
      </div>
    )
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
