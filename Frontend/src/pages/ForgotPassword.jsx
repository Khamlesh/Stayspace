import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api/client'
import AuthLayout from '../components/AuthLayout'

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    try {
      const response = await authAPI.checkEmail(email)
      if (response.data.status === 'success') {
        setStep(2)
        setSuccess('Email verified. Please enter your new password.')
      } else {
        setError('Email not found in our system')
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Email not found in our system')
      } else {
        setError('Error verifying email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const response = await authAPI.forgotPassword({ email, new_password: newPassword })
      if (response.data.status === 'success') {
        setSuccess('Password reset successfully! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(response.data.message || 'Failed to reset password')
      }
    } catch (err) {
      setError('Error resetting password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-[1.65rem] font-bold text-center mb-1.5 text-main-text">Reset Password</h1>
      <p className="text-sm text-secondary-text text-center mb-7">
        {step === 1
          ? "Enter your email and we'll help you reset your password."
          : "Enter your new password below."}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-danger/8 border border-danger/15 rounded-xl text-sm text-danger text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-success/8 border border-success/15 rounded-xl text-sm text-success text-center">
          {success}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <p className="text-sm text-secondary-text">
            Email: <span className="font-semibold text-main-text">{email}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Min 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-secondary-text hover:text-main-text text-sm"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Re-enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-secondary-text hover:text-main-text text-sm"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={() => { setStep(1); setEmail(''); setNewPassword(''); setConfirmPassword(''); setError(''); setSuccess('') }}
            className="w-full py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200"
          >
            Change Email
          </button>
        </form>
      )}

      <div className="mt-5 pt-5 border-t border-divider text-center">
        <p className="text-secondary-text text-sm">
          Remember your password?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default ForgotPassword
