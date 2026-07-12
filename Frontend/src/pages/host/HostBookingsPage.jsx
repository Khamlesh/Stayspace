import { useState, useEffect } from 'react'
import hostAPI from '../../api/hostApi'
import { formatRupees } from '../../utils/currency'
import { HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineUserCircle } from 'react-icons/hi2'

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

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
        <BookingDetailModal
          booking={selectedBooking}
          statusColors={statusColors}
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

function BookingDetailModal({ booking: b, statusColors, onClose, onAction, actionLoading }) {
  const [imgErr, setImgErr] = useState(false)
  const nights = b.nights || Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000*60*60*24)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-main-text">Booking #{b.id}</h2>
            <button onClick={onClose} className="text-secondary-text hover:text-main-text text-2xl">&times;</button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status}</span>
            {b.property_type && <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{b.property_type}</span>}
          </div>

          {b.image_url && !imgErr && (
            <img src={b.image_url} alt="" className="w-full h-40 object-cover rounded-lg mb-4" onError={() => setImgErr(true)} />
          )}

          <div className="space-y-4">
            <Section title="Guest Information">
              <Info label="Name" value={b.guest_name} />
              <Info label="Email" value={b.guest_email} />
              <Info label="Guests" value={`${b.guests_count || 1} person${(b.guests_count || 1) > 1 ? 's' : ''}`} />
            </Section>

            <Section title="Property Information">
              <Info label="Property" value={b.property_title} />
              <Info label="Type" value={b.property_type || 'House'} />
              <Info label="Location" value={b.property_address} />
            </Section>

            <Section title="Booking Information">
              <Info label="Check-in" value={b.check_in} />
              <Info label="Check-out" value={b.check_out} />
              <Info label="Nights" value={`${nights} night${nights > 1 ? 's' : ''}`} />
              <Info label="Booked On" value={b.created_at?.split(' ')[0]} />
            </Section>

            <Section title="Payment Information">
              <Info label="Total Amount" value={formatRupees(b.total_price)} bold />
              <Info label="Payment Method" value={b.payment_method || 'N/A'} />
              <Info label="Transaction ID" value={b.transaction_id || 'N/A'} mono />
              <Info label="Payment Status" value={b.payment_amount > 0 ? 'Paid' : 'Pending'} />
            </Section>

            {b.special_requests && (
              <Section title="Special Requests">
                <p className="text-sm text-secondary-text">{b.special_requests}</p>
              </Section>
            )}
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t border-divider">
            {b.status === 'Pending' && (
              <>
                <button onClick={() => { onAction(b.id, 'confirm'); onClose() }} className="btn-primary flex-1">Confirm</button>
                <button onClick={() => { onAction(b.id, 'cancel'); onClose() }} className="btn-danger flex-1">Reject</button>
              </>
            )}
            {b.status === 'Confirmed' && (
              <>
                <button onClick={() => { onAction(b.id, 'checkin'); onClose() }} className="btn-primary flex-1">Check-in Guest</button>
                <button onClick={() => { onAction(b.id, 'cancel'); onClose() }} className="btn-danger flex-1">Cancel</button>
              </>
            )}
            {b.status === 'Checked-In' && (
              <>
                <button onClick={() => { onAction(b.id, 'complete'); onClose() }} className="btn-primary flex-1">Complete Stay</button>
                <button onClick={() => { onAction(b.id, 'cancel'); onClose() }} className="btn-danger flex-1">Cancel</button>
              </>
            )}
            {b.status === 'Completed' && (
              <p className="text-sm text-secondary-text w-full text-center">This booking is completed.</p>
            )}
            {b.status === 'Cancelled' && (
              <p className="text-sm text-danger w-full text-center">This booking has been cancelled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">{title}</h3>
      <div className="bg-background rounded-lg p-3 space-y-1.5">
        {children}
      </div>
    </div>
  )
}

function Info({ label, value, bold, mono }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-secondary-text">{label}</span>
      <span className={`text-main-text ${bold ? 'font-bold' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{value || 'N/A'}</span>
    </div>
  )
}
