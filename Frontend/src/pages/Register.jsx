import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'
import { authAPI } from '../api/client'

const MAJOR_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
  'Bhopal', 'Patna', 'Visakhapatnam', 'Vijayawada', 'Coimbatore', 'Kochi',
  'Thiruvananthapuram', 'Mysuru', 'Chandigarh', 'Ludhiana', 'Noida', 'Gurugram',
  'Ghaziabad', 'Faridabad', 'Varanasi', 'Prayagraj', 'Bhubaneswar', 'Raipur',
  'Ranchi', 'Guwahati', 'Jodhpur',
]

const TOURIST_CITIES = [
  'Shimla', 'Manali', 'Dharamshala', 'Dalhousie', 'Leh', 'Srinagar', 'Gulmarg',
  'Pahalgam', 'Mussoorie', 'Nainital', 'Rishikesh', 'Auli', 'Munnar', 'Ooty',
  'Kodaikanal', 'Coorg', 'Darjeeling', 'Gangtok', 'Mahabaleshwar', 'Mount Abu',
]

const Register = () => {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('Guest')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [hostPending, setHostPending] = useState(false)
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()

  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [cityOther, setCityOther] = useState('')
  const [phoneChecking, setPhoneChecking] = useState(false)

  const validateStep1 = () => {
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

  const validateStep2 = async () => {
    const errs = {}
    if (!gender) errs.gender = 'Gender is required'
    if (!phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^[6-9]\d{9}$/.test(phone.trim())) errs.phone = 'Enter a valid 10-digit Indian mobile number'
    const finalCity = city === 'Other' ? cityOther.trim() : city
    if (!finalCity) errs.city = 'City is required'
    else if (city === 'Other' && cityOther.trim().length < 2) errs.city = 'Please enter a valid city name'

    if (!errs.phone && phone.trim()) {
      try {
        setPhoneChecking(true)
        const res = await authAPI.checkPhone(phone.trim())
        if (res.data.status !== 'success') {
          errs.phone = res.data.message || 'Phone number already registered'
        }
      } catch (err) {
        const msg = err.response?.data?.message
        if (msg) errs.phone = msg
      } finally {
        setPhoneChecking(false)
      }
    }

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleStep1Submit = (e) => {
    e.preventDefault()
    if (!validateStep1()) return
    if (role === 'Host') {
      setStep(2)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async (hostFields = {}) => {
    const result = await register(name, email, password, role, hostFields)
    if (result.success) {
      if (role === 'Host') {
        setHostPending(true)
      } else {
        navigate('/login')
      }
    }
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    if (!(await validateStep2())) return
    const finalCity = city === 'Other' ? cityOther.trim() : city
    handleSubmit({ gender, phone: phone.trim(), city: finalCity })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-card shadow-card p-8">
        {hostPending ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-main-text mb-2">Registration Submitted!</h1>
            <p className="text-secondary-text mb-4">
              Thank you for registering as a Host, <strong>{name}</strong>.
            </p>
            <p className="text-secondary-text mb-6">
              Your host registration has been submitted successfully. Your account is currently <strong>pending Admin approval</strong>. You will be able to access the Host Dashboard once your account has been verified and approved.
            </p>
            <p className="text-sm text-secondary-text mb-6">
              This usually takes 24-48 hours. You will receive a notification once approved.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-main-text">Create your account</h1>
            {step === 1 && (
              <p className="text-sm text-secondary-text text-center mb-6">Join StaySpace and start exploring</p>
            )}
            {step === 2 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <p className="text-sm text-secondary-text">Host Details</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Step 2 of 2</span>
              </div>
            )}

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
            {error}
          </div>
        )}

        {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
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
            {role === 'Host' ? 'Continue' : 'Create Account'}
          </button>
        </form>
        )}

        {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => { setGender(e.target.value); setFieldErrors(p => ({ ...p, gender: '' })) }}
              className={`input-field ${fieldErrors.gender ? 'border-danger' : ''}`}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {fieldErrors.gender && <p className="text-danger text-xs mt-1">{fieldErrors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFieldErrors(p => ({ ...p, phone: '' })) }}
              className={`input-field ${fieldErrors.phone ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {fieldErrors.phone && <p className="text-danger text-xs mt-1">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">City</label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setFieldErrors(p => ({ ...p, city: '' }))
                if (e.target.value !== 'Other') setCityOther('')
              }}
              className={`input-field ${fieldErrors.city ? 'border-danger' : ''}`}
            >
              <option value="">Select your city</option>
              <optgroup label="Major Cities">
                {MAJOR_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
              <optgroup label="Tourist Cities">
                {TOURIST_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
              <option value="Other">Other</option>
            </select>
            {fieldErrors.city && <p className="text-danger text-xs mt-1">{fieldErrors.city}</p>}
          </div>

          {city === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-main-text mb-1.5">Enter your city</label>
              <input
                type="text"
                value={cityOther}
                onChange={(e) => { setCityOther(e.target.value); setFieldErrors(p => ({ ...p, city: '' })) }}
                className={`input-field ${fieldErrors.city ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
                placeholder="Enter city name"
              />
              {fieldErrors.city && <p className="text-danger text-xs mt-1">{fieldErrors.city}</p>}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || phoneChecking}
              className="flex-1 btn-primary"
            >
              {loading ? 'Creating account...' : phoneChecking ? 'Checking...' : 'Register'}
            </button>
          </div>
        </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-secondary-text text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Register
