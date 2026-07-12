import { useState, useEffect } from 'react'
import hostAPI from '../../api/hostApi'
import { HiOutlineBell, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi2'

export default function HostNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hostAPI.getNotifications()
      .then(res => {
        if (res.data.status === 'success') setNotifications(res.data.data || [])
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    try {
      await hostAPI.markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (e) { console.error(e) }
  }

  const markOneRead = async (id) => {
    try {
      await hostAPI.markNotificationsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) { console.error(e) }
  }

  const deleteNotif = async (id) => {
    try {
      await hostAPI.deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e) { console.error(e) }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Notifications</h1>
          <p className="text-sm text-secondary-text mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <HiOutlineCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-divider rounded-xl animate-pulse" />)}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                n.is_read ? 'bg-white border-divider' : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                n.is_read ? 'bg-divider' : 'bg-primary/10'
              }`}>
                <HiOutlineBell className={`w-4 h-4 ${n.is_read ? 'text-secondary-text' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.is_read ? 'text-secondary-text' : 'text-main-text font-medium'}`}>
                  {n.message}
                </p>
                <p className="text-xs text-secondary-text mt-1">{n.created_at}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.is_read && (
                  <button
                    onClick={() => markOneRead(n.id)}
                    className="p-1.5 rounded-lg hover:bg-divider transition-colors text-secondary-text"
                    title="Mark as read"
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(n.id)}
                  className="p-1.5 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-secondary-text"
                  title="Delete"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-divider flex items-center justify-center mx-auto mb-3">
            <HiOutlineBell className="w-7 h-7 text-secondary-text" />
          </div>
          <p className="text-secondary-text">No notifications</p>
        </div>
      )}
    </div>
  )
}
