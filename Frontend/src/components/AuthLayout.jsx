import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

const AuthLayout = ({ children }) => {
  const [loaded, setLoaded] = useState(false)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50)
    return () => clearTimeout(t)
  }, [])

  const getDashboardLink = () => {
    if (!isAuthenticated) return null
    if (user?.role === 'Host') return '/host'
    if (user?.role === 'Admin') return '/admin'
    return '/user'
  }

  const dashLink = getDashboardLink()

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Full-screen background image */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Dark overlays */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      </div>

      {/* Minimal Navbar */}
      <nav className="relative z-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <Logo size="md" linkTo="/" light />

            {/* Nav Links */}
            <div className="flex items-center gap-2">
              {dashLink ? (
                <Link
                  to={dashLink}
                  className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-white/15 backdrop-blur-sm rounded-xl hover:bg-white/25 border border-white/20 transition-all duration-200"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Centered Auth Card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4.5rem)] px-4 py-8">
        <div
          className={`w-full max-w-[420px] transition-all duration-700 ease-out ${
            loaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.97]'
          }`}
        >
          {/* Glassmorphism Card */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/50 p-8 sm:p-10">
            {children}
          </div>

          {/* Bottom tagline */}
          <p className="text-center text-white/50 text-xs mt-5 font-light tracking-wide">
            Discover unique stays across India
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
