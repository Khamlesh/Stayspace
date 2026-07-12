import React, { createContext, useState, useEffect } from 'react'
import { authAPI } from '../api/client'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  const register = async (name, email, password, role) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.register(name, email, password, role)
      if (response.data.status === 'success') {
        setUser(response.data.data?.user || { name, email, role })
        return { success: true }
      }
      setError(response.data.message)
      return { success: false, error: response.data.message }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.login(email, password)
      if (response.data.status === 'success') {
        const { token, user } = response.data.data
        setToken(token)
        setUser(user)
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        return { success: true, token, user }
      }
      setError(response.data.message)
      return { success: false, error: response.data.message }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}
