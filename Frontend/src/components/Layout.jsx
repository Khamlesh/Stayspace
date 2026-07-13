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

      <footer className="bg-white border-t border-divider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Logo size="sm" linkTo="/" />
              </div>
              <p className="text-xs text-secondary-text leading-relaxed">
                Discover unique stays and create unforgettable memories across India.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-main-text mb-3">Explore</h4>
              <div className="space-y-2">
                <Link to="/search" className="block text-xs text-secondary-text hover:text-primary transition-colors">Browse Properties</Link>
                <Link to="/search" className="block text-xs text-secondary-text hover:text-primary transition-colors">Destinations</Link>
                <Link to="/search" className="block text-xs text-secondary-text hover:text-primary transition-colors">Featured</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-main-text mb-3">Host</h4>
              <div className="space-y-2">
                <Link to="/register" className="block text-xs text-secondary-text hover:text-primary transition-colors">Become a Host</Link>
                <Link to="/host" className="block text-xs text-secondary-text hover:text-primary transition-colors">Host Dashboard</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-main-text mb-3">Support</h4>
              <div className="space-y-2">
                <span className="block text-xs text-secondary-text">Help Center</span>
                <span className="block text-xs text-secondary-text">Safety</span>
                <span className="block text-xs text-secondary-text">Terms</span>
              </div>
            </div>
          </div>
          <div className="border-t border-divider mt-8 pt-6 text-center">
            <p className="text-xs text-secondary-text">© 2025 StaySpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
