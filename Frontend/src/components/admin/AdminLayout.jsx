import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import adminAPI from '../../api/adminApi'
import Logo from '../Logo'
import NotificationCenter from '../NotificationCenter'
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineUserCircle, HiOutlineBuildingOffice2,
  HiOutlineCalendarDays, HiOutlineCurrencyRupee, HiOutlineChartBar,
  HiOutlineDocumentChartBar, HiOutlineStar, HiOutlineExclamationTriangle,
  HiOutlineBell, HiOutlineCog6Tooth, HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3, HiOutlineXMark, HiOutlineChevronLeft
} from 'react-icons/hi2'

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: HiOutlineHome, path: '/admin' },
  { key: 'users', label: 'Users', icon: HiOutlineUserGroup, path: '/admin/users' },
  { key: 'hosts', label: 'Hosts', icon: HiOutlineUserCircle, path: '/admin/hosts' },
  { key: 'properties', label: 'Properties', icon: HiOutlineBuildingOffice2, path: '/admin/properties' },
  { key: 'bookings', label: 'Bookings', icon: HiOutlineCalendarDays, path: '/admin/bookings' },
  { key: 'payments', label: 'Payments', icon: HiOutlineCurrencyRupee, path: '/admin/payments' },
  { key: 'analytics', label: 'Analytics', icon: HiOutlineChartBar, path: '/admin/analytics' },
  { key: 'reports', label: 'Reports', icon: HiOutlineDocumentChartBar, path: '/admin/reports' },
  { key: 'reviews', label: 'Reviews', icon: HiOutlineStar, path: '/admin/reviews' },
  { key: 'complaints', label: 'Complaints', icon: HiOutlineExclamationTriangle, path: '/admin/complaints' },
  { key: 'notifications', label: 'Notifications', icon: HiOutlineBell, path: '/admin/notifications' },
  { key: 'settings', label: 'Settings', icon: HiOutlineCog6Tooth, path: '/admin/settings' },
  { key: 'profile', label: 'Admin Profile', icon: HiOutlineUserCircle, path: '/admin/profile' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleUnreadChange = useCallback((count) => {
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userName = user?.name || 'Admin'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white border-r border-divider
          transition-all duration-300 flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
      >
        <div className={`flex items-center h-16 border-b border-divider px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <Logo size="md" linkTo="/admin" />
            </div>
          )}
          {collapsed && (
            <Logo size="sm" showText={false} linkTo="/admin" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-divider transition-colors flex-shrink-0"
          >
            <HiOutlineChevronLeft className={`w-4 h-4 text-secondary-text transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-divider"
          >
            <HiOutlineXMark className="w-4 h-4 text-secondary-text" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {menuItems.map(item => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl mb-0.5 transition-all duration-200 group
                ${isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-secondary-text hover:bg-divider hover:text-main-text'}
                ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
              {item.key === 'notifications' && unreadCount > 0 && !collapsed && (
                <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {item.key === 'notifications' && unreadCount > 0 && collapsed && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-divider p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-main-text truncate">{userName}</p>
                <p className="text-xs text-secondary-text truncate">Admin</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-secondary-text"
              >
                <HiOutlineArrowLeftOnRectangle className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-secondary-text"
            >
              <HiOutlineArrowLeftOnRectangle className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-divider flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-divider"
          >
            <HiOutlineBars3 className="w-5 h-5 text-main-text" />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <Logo size="sm" showText={false} linkTo="/admin" className="lg:hidden" />
          </div>

          <NotificationCenter apiClient={adminAPI} basePath="/admin" onUnreadChange={handleUnreadChange} />

          <NavLink to="/admin/profile" className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">{userInitial}</span>
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
