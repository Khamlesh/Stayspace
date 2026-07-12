import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('Guest')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    else if (!/(?=.*[A-Z])/.test(password)) errs.password = 'Password must contain an uppercase letter'
    else if (!/(?=.*[0-9])/.test(password)) errs.password = 'Password must contain a number'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (!['Guest', 'Host'].includes(role)) errs.role = 'Invalid role selected'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    if (!validate()) return
    const result = await register(name, email, password, role)
    if (result.success) {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-card shadow-card p-8">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-main-text">Create your account</h1>
        <p className="text-sm text-secondary-text text-center mb-6">Join StaySpace and start exploring</p>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })) }}
              className={`input-field ${fieldErrors.name ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
              placeholder="Enter your full name"
            />
            {fieldErrors.name && <p className="text-danger text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
              className={`input-field ${fieldErrors.email ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
              placeholder="your@email.com"
            />
            {fieldErrors.email && <p className="text-danger text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">I want to</label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setFieldErrors(p => ({ ...p, role: '' })) }}
              className={`input-field ${fieldErrors.role ? 'border-danger' : ''}`}
            >
              <option value="Guest">Book stays (Guest)</option>
              <option value="Host">List my property (Host)</option>
            </select>
            {fieldErrors.role && <p className="text-danger text-xs mt-1">{fieldErrors.role}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
                className={`input-field pr-10 ${fieldErrors.password ? 'border-danger' : ''}`}
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-secondary-text hover:text-main-text text-sm"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && <p className="text-danger text-xs mt-1">{fieldErrors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: '' })) }}
                className={`input-field pr-10 ${fieldErrors.confirmPassword ? 'border-danger' : ''}`}
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-secondary-text hover:text-main-text text-sm"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="text-danger text-xs mt-1">{fieldErrors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-secondary-text text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
