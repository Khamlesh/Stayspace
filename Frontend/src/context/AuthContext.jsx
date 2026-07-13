import React, { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/client'
import apiClient from '../api/client'

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

  const checkHostStatus = useCallback(async (authToken) => {
    try {
      const res = await apiClient.post('/auth/host-status', { token: authToken })
      if (res.data.status === 'success') {
        return res.data.data
      }
      return null
    } catch {
      return null
    }
  }, [])

  const notifyHostRegistered = useCallback(async (authToken) => {
    try {
      await apiClient.post('/auth/host-registered', { token: authToken })
    } catch {
      // ignore notification errors
    }
  }, [])

  const register = async (name, email, password, role, hostFields = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.register(name, email, password, role, hostFields)
      if (response.data.status === 'success') {
        const userData = response.data.data?.user || { name, email, role }
        setUser(userData)

        if (role === 'Host' && response.data.data?.token) {
          const hostToken = response.data.data.token
          setToken(hostToken)
          localStorage.setItem('token', hostToken)
          localStorage.setItem('user', JSON.stringify({ ...userData, is_approved: false }))
          setUser({ ...userData, is_approved: false })
          await notifyHostRegistered(hostToken)
        }

        return { success: true, role }
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
        const { token: newToken, user: userData } = response.data.data
        setToken(newToken)

        if (userData.role === 'Host') {
          const hostStatus = await checkHostStatus(newToken)
          if (hostStatus) {
            userData.is_approved = hostStatus.is_approved
          } else {
            userData.is_approved = false
          }
        }

        setUser(userData)
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(userData))
        return { success: true, token: newToken, user: userData }
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
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout, isAuthenticated, checkHostStatus }}>
      {children}
    </AuthContext.Provider>
  )
}
