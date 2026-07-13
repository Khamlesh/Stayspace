import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { HiOutlineBars3, HiOutlineXMark, HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import Logo from './Logo'

export default function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="sm" linkTo="/" />

            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search properties..."
                  className="w-full pl-10 pr-4 py-2 bg-divider border border-transparent rounded-full text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
            </form>

            <nav className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {user?.role === 'Host' && (
                    <Link to="/host" className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary transition-colors">
                      Host Dashboard
                    </Link>
                  )}
                  {user?.role === 'Admin' && (
                    <Link to="/admin" className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary transition-colors">
                      Admin Dashboard
                    </Link>
                  )}
                  {user?.role === 'Guest' && (
                    <Link to="/user" className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary transition-colors">
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-danger transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors">
                    Register
                  </Link>
                </>
              )}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-divider"
            >
              {mobileMenuOpen ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineBars3 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-divider bg-white px-4 py-3 space-y-2">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search properties..."
                  className="w-full pl-10 pr-4 py-2 bg-divider border border-transparent rounded-full text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </form>
            {isAuthenticated ? (
              <>
                {user?.role === 'Host' && (
                  <Link to="/host" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-secondary-text hover:text-primary">
                    Host Dashboard
                  </Link>
                )}
                {user?.role === 'Admin' && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-secondary-text hover:text-primary">
                    Admin Dashboard
                  </Link>
                )}
                {user?.role === 'Guest' && (
                  <Link to="/user" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-secondary-text hover:text-primary">
                    Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="block py-2 text-sm font-medium text-danger">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-secondary-text">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-main-text text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Logo size="md" linkTo="/" light />
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-sm mb-6">
                Discover unique stays and create unforgettable memories across India. Your perfect vacation is just a search away.
              </p>
              <div className="flex gap-3">
                {[
                  { label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                  { label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                  { label: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                  { label: 'Twitter', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                  { label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                ].map((s) => (
                  <a key={s.label} href="#" aria-label={s.label}
                    className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-primary transition-all duration-300 hover:scale-110 group">
                    <svg className="w-4 h-4 fill-white/60 group-hover:fill-white transition-colors" viewBox="0 0 24 24"><path d={s.icon} /></svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">Company</h4>
              <div className="space-y-3">
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">About Us</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Careers</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Blog</Link>
              </div>
            </div>

            {/* Explore */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">Explore</h4>
              <div className="space-y-3">
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Properties</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Destinations</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Experiences</Link>
              </div>
            </div>

            {/* Host + Support */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">Host</h4>
              <div className="space-y-3 mb-6">
                <Link to="/register" className="block text-sm text-white/50 hover:text-primary transition-colors">Become a Host</Link>
                <Link to="/host" className="block text-sm text-white/50 hover:text-primary transition-colors">Host Dashboard</Link>
              </div>
              <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">Support</h4>
              <div className="space-y-3">
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Help Center</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Contact</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">FAQ</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/search" className="block text-sm text-white/50 hover:text-primary transition-colors">Terms & Conditions</Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} StaySpace. All rights reserved.</p>
            <p className="text-xs text-white/30">v1.0.0 &middot; Made with ❤ in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
