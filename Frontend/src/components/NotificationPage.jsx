import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotificationRelativeTime } from '../utils/chatTimestamp'
import {
  HiOutlineBell, HiOutlineCheck, HiOutlineTrash, HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays, HiOutlineCurrencyRupee, HiOutlineStar,
  HiOutlineExclamationTriangle, HiOutlineBuildingOffice2, HiOutlineCog6Tooth,
  HiOutlineUserGroup, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineFunnel, HiOutlineArrowPath
} from 'react-icons/hi2'

const CATEGORY_CONFIG = {
  booking:    { icon: HiOutlineCalendarDays,        color: 'text-info',     bg: 'bg-info/10',     label: 'Booking' },
  payment:    { icon: HiOutlineCurrencyRupee,       color: 'text-success',  bg: 'bg-success/10',  label: 'Payment' },
  review:     { icon: HiOutlineStar,                color: 'text-warning',  bg: 'bg-warning/10',  label: 'Review' },
  complaint:  { icon: HiOutlineExclamationTriangle, color: 'text-danger',   bg: 'bg-danger/10',   label: 'Complaint' },
  property:   { icon: HiOutlineBuildingOffice2,     color: 'text-primary',  bg: 'bg-primary/10',  label: 'Property' },
  admin:      { icon: HiOutlineUserGroup,           color: 'text-info',     bg: 'bg-info/10',     label: 'Admin' },
  system:     { icon: HiOutlineCog6Tooth,           color: 'text-secondary-text', bg: 'bg-divider', label: 'System' },
  wishlist:   { icon: HiOutlineStar,                color: 'text-primary',  bg: 'bg-primary/10',  label: 'Wishlist' },
}

const CATEGORIES = Object.keys(CATEGORY_CONFIG)

function getCategoryConfig(type) {
  return CATEGORY_CONFIG[type] || CATEGORY_CONFIG.system
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-divider animate-pulse">
          <div className="w-10 h-10 rounded-full bg-divider flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-3.5 bg-divider rounded w-3/4" />
            <div className="h-3 bg-divider rounded w-full" />
            <div className="h-2.5 bg-divider rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function NotificationPage({ apiClient }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeCategory, setActiveCategory] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const navigate = useNavigate()
  const limit = 15

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit, sort: sortOrder }
      if (searchQuery) params.search = searchQuery
      if (activeCategory) params.type = activeCategory
      if (activeFilter === 'unread') params.read = 'unread'
      if (activeFilter === 'read') params.read = 'read'

      const res = await apiClient.getNotifications(params)
      if (res.data.status === 'success') {
        setNotifications(res.data.data || [])
        setTotal(res.data.total || 0)
        setUnreadCount(res.data.unread_count ?? 0)
      }
    } catch {}
    setLoading(false)
  }, [page, searchQuery, activeCategory, activeFilter, sortOrder, apiClient])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, activeCategory, activeFilter, sortOrder])

  const markAllRead = async () => {
    try {
      await apiClient.markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const markOneRead = async (id) => {
    try {
      await apiClient.markNotificationsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const deleteNotif = async (id) => {
    try {
      await apiClient.deleteNotification(id)
      const wasUnread = notifications.find(n => n.id === id && !n.is_read)
      setNotifications(prev => prev.filter(n => n.id !== id))
      setTotal(prev => prev - 1)
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) markOneRead(notif.id)
    if (notif.link_url) navigate(notif.link_url)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Notifications</h1>
          <p className="text-sm text-secondary-text mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-text bg-white border border-divider rounded-lg hover:bg-divider transition-colors"
            title="Refresh"
          >
            <HiOutlineArrowPath className="w-3.5 h-3.5" /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <HiOutlineCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-2.5 border border-divider rounded-xl bg-white text-sm text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              aria-label="Search notifications"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2.5 border border-divider rounded-xl bg-white text-sm text-main-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              aria-label="Sort order"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Read/Unread Filter Tabs */}
        <div className="flex items-center gap-1 bg-divider/50 p-1 rounded-xl">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'read', label: 'Read' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeFilter === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary-text hover:text-main-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
              !activeCategory
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-secondary-text border-divider hover:border-primary/30 hover:text-primary'
            }`}
          >
            All Types
          </button>
          {CATEGORIES.map(cat => {
            const cfg = getCategoryConfig(cat)
            const CatIcon = cfg.icon
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-primary text-white border-primary'
                    : `bg-white text-secondary-text border-divider hover:border-primary/30 hover:text-primary`
                }`}
              >
                <CatIcon className="w-3 h-3" />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <LoadingSkeleton />
      ) : notifications.length > 0 ? (
        <>
          <div className="space-y-2">
            {notifications.map(notif => {
              const cat = getCategoryConfig(notif.type)
              const CatIcon = cat.icon
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                    !notif.is_read
                      ? 'bg-primary/[0.03] border-primary/15 hover:border-primary/30'
                      : 'bg-white border-divider hover:border-border hover:shadow-soft'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notif) }}
                  aria-label={`${notif.title || notif.message}${notif.is_read ? '' : ' (unread)'}`}
                >
                  <div className={`w-10 h-10 rounded-full ${cat.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <CatIcon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.is_read ? 'text-main-text font-semibold' : 'text-secondary-text'}`}>
                        {notif.title || notif.message}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    {notif.title && notif.message && (
                      <p className="text-xs text-secondary-text mt-0.5 line-clamp-2">{notif.message}</p>
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
                        aria-label="Mark as read"
                      >
                        <HiOutlineCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id) }}
                      className="p-1.5 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-secondary-text"
                      title="Delete"
                      aria-label="Delete notification"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-secondary-text">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-divider hover:bg-divider disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <HiOutlineChevronLeft className="w-4 h-4 text-secondary-text" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) pageNum = i + 1
                  else if (page <= 3) pageNum = i + 1
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = page - 2 + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-primary text-white'
                          : 'text-secondary-text hover:bg-divider'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-divider hover:bg-divider disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <HiOutlineChevronRight className="w-4 h-4 text-secondary-text" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-divider flex items-center justify-center mx-auto mb-3">
            <HiOutlineBell className="w-7 h-7 text-secondary-text" />
          </div>
          <p className="text-main-text font-medium mb-1">
            {searchQuery || activeCategory || activeFilter !== 'all' ? 'No matching notifications' : 'No notifications'}
          </p>
          <p className="text-sm text-secondary-text">
            {searchQuery || activeCategory || activeFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'When you get notifications, they\'ll show up here.'}
          </p>
        </div>
      )}
    </div>
  )
}
