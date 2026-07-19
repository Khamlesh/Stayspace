import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import hostAPI from '../../api/hostApi'
import { formatRupees } from '../../utils/currency'
import BookingDetailsModal from '../../components/BookingDetailsModal'
import { HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineUserCircle, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    hostAPI.getRecentBookings()
      .then(res => {
        if (res.data.status === 'success') setBookings(res.data.data || [])
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (bookingId, action) => {
    setActionLoading(`${bookingId}-${action}`)
    try {
      await hostAPI.bookingAction(bookingId, action)
      const statusMap = { confirm: 'Confirmed', cancel: 'Cancelled', checkin: 'Checked-In', complete: 'Completed' }
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: statusMap[action] } : b
      ))
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: statusMap[action] }))
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.property_title?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.id).includes(search)
    const matchFilter = filter === 'All' || b.status === filter
    return matchSearch && matchFilter
  })

  const statusColors = {
    Pending: 'bg-warning/10 text-warning',
    Confirmed: 'bg-success/10 text-success',
    'Checked-In': 'bg-info/10 text-info',
    Completed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-danger/10 text-danger'
  }

  const counts = {
    All: bookings.length,
    Pending: bookings.filter(b => b.status === 'Pending').length,
    Confirmed: bookings.filter(b => b.status === 'Confirmed').length,
    'Checked-In': bookings.filter(b => b.status === 'Checked-In').length,
    Completed: bookings.filter(b => b.status === 'Completed').length,
    Cancelled: bookings.filter(b => b.status === 'Cancelled').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Bookings</h1>
        <p className="text-sm text-secondary-text mt-1">Manage all your property bookings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by guest, property, or booking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Object.keys(counts).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                ${filter === s ? 'bg-primary text-white' : 'bg-divider text-secondary-text hover:bg-border'}`}
            >
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-divider rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(b => (
            <BookingRow
              key={b.id}
              booking={b}
              statusColors={statusColors}
              onAction={handleAction}
              actionLoading={actionLoading}
              onSelect={() => setSelectedBooking(b)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-secondary-text">No bookings found</p>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          role="host"
          onClose={() => setSelectedBooking(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}
    </div>
  )
}

function BookingRow({ booking: b, statusColors, onAction, actionLoading, onSelect }) {
  const [imgErr, setImgErr] = useState(false)
  const navigate = useNavigate()
  const nights = b.nights || Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000*60*60*24)))

  const nextActions = {
    Pending: [{ action: 'confirm', label: 'Confirm', icon: HiOutlineCheckCircle, color: 'text-success bg-success/10 hover:bg-success/20' }],
    Confirmed: [
      { action: 'checkin', label: 'Check-in', icon: HiOutlineCheckCircle, color: 'text-info bg-info/10 hover:bg-info/20' },
      { action: 'cancel', label: 'Cancel', icon: HiOutlineXCircle, color: 'text-danger bg-danger/10 hover:bg-danger/20' }
    ],
    'Checked-In': [
      { action: 'complete', label: 'Complete', icon: HiOutlineCheckCircle, color: 'text-success bg-success/10 hover:bg-success/20' },
      { action: 'cancel', label: 'Cancel', icon: HiOutlineXCircle, color: 'text-danger bg-danger/10 hover:bg-danger/20' }
    ]
  }

  return (
    <div className="dashboard-card p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={onSelect}>
      <div className="flex items-center gap-4">
        {b.image_url && !imgErr ? (
          <img src={b.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary/30">{b.property_title?.charAt(0)}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-secondary-text">#{b.id}</span>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[b.status] || ''}`}>{b.status}</span>
            {b.property_type && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{b.property_type}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-main-text truncate mt-1">{b.property_title}</p>
          <div className="flex items-center gap-1 text-xs text-secondary-text mt-0.5">
            <HiOutlineUserCircle className="w-3 h-3" />
            <span>{b.guest_name}</span>
            <span>·</span>
            <span>{b.check_in} → {b.check_out}</span>
            <span>·</span>
            <span>{nights} night{nights > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-main-text">{formatRupees(b.total_price)}</p>
          {b.guests_count > 1 && <p className="text-xs text-secondary-text">{b.guests_count} guests</p>}
        </div>

        {(nextActions[b.status] || []).length > 0 && (
          <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {['Confirmed', 'Checked-In'].includes(b.status) && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/host/messages?booking_id=${b.id}`) }}
                className="p-1.5 rounded-lg transition-colors text-primary bg-primary/10 hover:bg-primary/20"
                title="Message Guest"
              >
                <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
              </button>
            )}
            {nextActions[b.status].map(({ action, label, icon: Icon, color }) => (
              <button
                key={action}
                onClick={() => onAction(b.id, action)}
                disabled={actionLoading === `${b.id}-${action}`}
                className={`p-1.5 rounded-lg transition-colors ${color} disabled:opacity-50`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
