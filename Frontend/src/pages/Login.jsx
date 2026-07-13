import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'
import AuthLayout from '../components/AuthLayout'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!email.trim()) errs.email = 'Email is required'
    if (!password) errs.password = 'Password is required'
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    const result = await login(email, password)
    if (result.success) {
      const role = result.user?.role
      if (role === 'Host') navigate('/host')
      else if (role === 'Admin') navigate('/admin')
      else navigate('/user')
    }
  }

  return (
    <AuthLayout>
      <div className="flex justify-center mb-7">
        <Logo size="lg" />
      </div>

      <h1 className="text-[1.65rem] font-bold text-center mb-1.5 text-main-text">Welcome back</h1>
      <p className="text-sm text-secondary-text text-center mb-7">Sign in to your StaySpace account</p>

      {error && (
        <div className="mb-5 p-3 bg-danger/8 border border-danger/15 rounded-xl text-sm text-danger text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
            className={`input-field ${fieldErrors.email ? 'border-danger' : ''}`}
            placeholder="your@email.com"
          />
          {fieldErrors.email && <p className="text-danger text-xs mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
              className={`input-field pr-16 ${fieldErrors.password ? 'border-danger' : ''}`}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-secondary-text hover:text-main-text text-sm font-medium"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && <p className="text-danger text-xs mt-1">{fieldErrors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 mt-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link to="/forgot-password" className="text-primary text-sm font-medium hover:underline">
          Forgot Password?
        </Link>
      </div>

      <div className="mt-5 pt-5 border-t border-divider">
        <p className="text-secondary-text text-sm text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Login
