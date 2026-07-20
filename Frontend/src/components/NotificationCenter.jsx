import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotificationRelativeTime } from '../utils/chatTimestamp'
import {
  HiOutlineBell, HiOutlineCheck, HiOutlineTrash, HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays, HiOutlineCurrencyRupee, HiOutlineStar,
  HiOutlineExclamationTriangle, HiOutlineBuildingOffice2, HiOutlineCog6Tooth,
  HiOutlineUserGroup, HiOutlineXMark, HiOutlineChevronRight
} from 'react-icons/hi2'

const CATEGORY_CONFIG = {
  booking:    { icon: HiOutlineCalendarDays,     color: 'text-info',        bg: 'bg-info/10',        label: 'Booking' },
  payment:    { icon: HiOutlineCurrencyRupee,    color: 'text-success',     bg: 'bg-success/10',     label: 'Payment' },
  review:     { icon: HiOutlineStar,             color: 'text-warning',     bg: 'bg-warning/10',     label: 'Review' },
  complaint:  { icon: HiOutlineExclamationTriangle, color: 'text-danger',   bg: 'bg-danger/10',      label: 'Complaint' },
  property:   { icon: HiOutlineBuildingOffice2,  color: 'text-primary',     bg: 'bg-primary/10',     label: 'Property' },
  admin:      { icon: HiOutlineUserGroup,        color: 'text-info',        bg: 'bg-info/10',        label: 'Admin' },
  system:     { icon: HiOutlineCog6Tooth,        color: 'text-secondary-text', bg: 'bg-divider',     label: 'System' },
  wishlist:   { icon: HiOutlineStar,             color: 'text-primary',     bg: 'bg-primary/10',     label: 'Wishlist' },
}

function getCategoryConfig(type) {
  return CATEGORY_CONFIG[type] || CATEGORY_CONFIG.system
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-divider animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-divider rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-divider rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function NotificationCenter({ apiClient, basePath, onUnreadChange }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const res = await apiClient.getNotifications({ limit: 10 })
      if (res.data.status === 'success') {
        setNotifications(res.data.data || [])
        const count = res.data.unread_count ?? (res.data.data || []).filter(n => !n.is_read).length
        setUnreadCount(count)
        if (onUnreadChange) onUnreadChange(count)
      }
    } catch {}
    setLoading(false)
    setInitialLoaded(true)
  }, [apiClient, onUnreadChange])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => fetchNotifications(), 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const markAllRead = async () => {
    try {
      await apiClient.markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      if (onUnreadChange) onUnreadChange(0)
    } catch {}
  }

  const markOneRead = async (id) => {
    try {
      await apiClient.markNotificationsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      if (onUnreadChange) onUnreadChange(Math.max(0, unreadCount - 1))
    } catch {}
  }

  const deleteNotif = async (id) => {
    try {
      await apiClient.deleteNotification(id)
      const wasUnread = notifications.find(n => n.id === id && !n.is_read)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
        if (onUnreadChange) onUnreadChange(Math.max(0, unreadCount - 1))
      }
    } catch {}
  }

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) markOneRead(notif.id)
    setOpen(false)
    if (notif.link_url) {
      navigate(notif.link_url)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-divider transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <HiOutlineBell className="w-5 h-5 text-secondary-text" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)} />

          <div
            ref={panelRef}
            className="fixed inset-x-0 bottom-0 top-16 z-50 bg-white lg:absolute lg:inset-auto lg:right-0 lg:mt-2 lg:w-[420px] lg:rounded-2xl lg:shadow-card-lg lg:border lg:border-divider animate-slide-down flex flex-col max-h-[calc(100vh-4rem)] lg:max-h-[520px]"
            role="dialog"
            aria-label="Notification center"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-main-text">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <HiOutlineCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-divider transition-colors"
                >
                  <HiOutlineXMark className="w-4 h-4 text-secondary-text" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!initialLoaded || (loading && notifications.length === 0) ? (
                <NotificationSkeleton />
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-14 h-14 rounded-full bg-divider flex items-center justify-center mb-3">
                    <HiOutlineBell className="w-6 h-6 text-secondary-text" />
                  </div>
                  <p className="text-sm font-medium text-main-text mb-1">All caught up</p>
                  <p className="text-xs text-secondary-text text-center">No notifications yet. We'll let you know when something happens.</p>
                </div>
              ) : (
                <div className="divide-y divide-divider">
                  {notifications.map(notif => {
                    const cat = getCategoryConfig(notif.type)
                    const CatIcon = cat.icon
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-5 py-3.5 transition-colors cursor-pointer hover:bg-divider/50 ${
                          !notif.is_read ? 'bg-primary/[0.03]' : ''
                        }`}
                        onClick={() => handleNotificationClick(notif)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notif) }}
                        aria-label={`${notif.title || notif.message}${notif.is_read ? '' : ' (unread)'}`}
                      >
                        <div className={`w-9 h-9 rounded-full ${cat.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <CatIcon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug ${!notif.is_read ? 'text-main-text font-medium' : 'text-secondary-text'}`}>
                              {notif.title || notif.message}
                            </p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          {notif.title && notif.message && (
                            <p className="text-xs text-secondary-text mt-0.5 line-clamp-1">{notif.message}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-secondary-text">{getNotificationRelativeTime(notif.created_at)}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
                              {cat.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markOneRead(notif.id) }}
                              className="p-1.5 rounded-lg hover:bg-divider transition-colors text-secondary-text"
                              title="Mark as read"
                            >
                              <HiOutlineCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id) }}
                            className="p-1.5 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-secondary-text"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-divider px-5 py-3 flex-shrink-0">
              <button
                onClick={() => { setOpen(false); navigate(`${basePath}/notifications`) }}
                className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/5 py-2 rounded-xl transition-colors"
              >
                View all notifications
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
