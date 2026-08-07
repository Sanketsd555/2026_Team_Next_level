import { createContext, useContext, useEffect, useState } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('loanflow_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me/')
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('loanflow_token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async ({ username, password, role }) => {
    const response = await api.post('/auth/login/', { username, password, role })
    localStorage.setItem('loanflow_token', response.data.token)
    setUser(response.data.user)
    return response.data.user
  }

  const register = async (payload) => {
    const response = await api.post('/auth/register/', payload)
    localStorage.setItem('loanflow_token', response.data.token)
    setUser(response.data.user)
    return response.data.user
  }

  const logout = () => {
    localStorage.removeItem('loanflow_token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}