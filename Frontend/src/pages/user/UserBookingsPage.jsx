import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsAPI } from '../../api/client'
import { formatRupees } from '../../utils/currency'
import { generateBookingReceipt } from '../../utils/receiptGenerator'
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineDocumentDuplicate,
  HiOutlineXMark,
  HiOutlineMapPin,
  HiOutlineHomeModern,
  HiOutlineChatBubbleLeftEllipsis,
} from 'react-icons/hi2'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
]

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-green-100 text-green-800',
  'Checked-In': 'bg-blue-100 text-blue-800',
  Completed: 'bg-gray-100 text-gray-700',
  Cancelled: 'bg-red-100 text-red-800',
}

export default function UserBookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await bookingsAPI.getGuestBookings()
      if (res.data.status === 'success') setBookings(res.data.data || [])
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    setCancellingId(bookingId)
    try {
      await bookingsAPI.cancelBooking(bookingId)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: 'Cancelled' }))
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  const filtered = bookings.filter(b => {
    if (activeTab === 'upcoming') return b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'Checked-In'
    if (activeTab === 'past') return b.status === 'Completed'
    if (activeTab === 'cancelled') return b.status === 'Cancelled'
    return true
  })

  const tabCounts = {
    all: bookings.length,
    upcoming: bookings.filter(b => ['Pending', 'Confirmed', 'Checked-In'].includes(b.status)).length,
    past: bookings.filter(b => b.status === 'Completed').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">My Bookings</h1>
        <p className="text-sm text-secondary-text mt-1">View and manage all your reservations</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
              ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-divider text-secondary-text hover:bg-border'}`}
          >
            {tab.label} ({tabCounts[tab.id] || 0})
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
          <button onClick={loadBookings} className="ml-2 underline font-semibold">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="dashboard-card">
              <div className="flex gap-4">
                <div className="w-28 h-20 bg-divider rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-divider rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-divider rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-divider rounded animate-pulse w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 dashboard-card">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-lg font-bold text-main-text mb-2">No bookings found</h3>
          <p className="text-sm text-secondary-text mb-6">
            {activeTab === 'all'
              ? "You haven't made any bookings yet."
              : `No ${activeTab} bookings to show.`}
          </p>
          <button onClick={() => navigate('/search')} className="btn-primary">
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              cancellingId={cancellingId}
              onSelect={() => setSelectedBooking(booking)}
            />
          ))}
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={handleCancel}
          cancellingId={cancellingId}
          onLeaveReview={(propertyId) => navigate(`/properties/${propertyId}/review`)}
        />
      )}
    </div>
  )
}

function BookingCard({ booking: b, onCancel, cancellingId, onSelect }) {
  const [imgErr, setImgErr] = useState(false)
  const canCancel = b.status === 'Pending' || b.status === 'Confirmed'
  const canReview = b.status === 'Completed' && !b.has_review

  return (
    <div
      className="dashboard-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {b.image_url && !imgErr ? (
          <img
            src={b.image_url}
            alt={b.property_title}
            className="w-full sm:w-28 h-20 object-cover rounded-lg flex-shrink-0"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full sm:w-28 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary/30">{b.property_title?.charAt(0)}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-bold text-main-text truncate">{b.property_title}</h3>
              <div className="flex items-center gap-1 text-xs text-secondary-text mt-0.5">
                <HiOutlineMapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{b.property_address}</span>
              </div>
              {b.property_type && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
                  <HiOutlineHomeModern className="w-3 h-3" />
                  {b.property_type}
                </span>
              )}
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-800'}`}>
              {b.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary-text mt-2">
            <span className="inline-flex items-center gap-1">
              <HiOutlineCalendarDays className="w-3.5 h-3.5" />
              {b.check_in} → {b.check_out}
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineClock className="w-3.5 h-3.5" />
              {b.nights} night{(b.nights || 0) !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineUserGroup className="w-3.5 h-3.5" />
              {b.guests_count || 1} guest{(b.guests_count || 1) !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-main-text">
              <HiOutlineBanknotes className="w-3.5 h-3.5" />
              {formatRupees(b.total_price)}
            </span>
          </div>

          {b.payment_method && (
            <div className="flex items-center gap-1 text-xs text-secondary-text mt-1.5">
              <HiOutlineCreditCard className="w-3.5 h-3.5" />
              <span>{b.payment_method}</span>
              {b.transaction_id && (
                <>
                  <span>·</span>
                  <span className="font-mono">{b.transaction_id}</span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
            {canCancel && (
              <button
                onClick={() => onCancel(b.id)}
                disabled={cancellingId === b.id}
                className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
            {(b.status === 'Completed' || b.status === 'Confirmed') && (
              <button
                onClick={() => generateBookingReceipt({
                  bookingId: b.id, transactionId: b.transaction_id, amount: b.total_price,
                  nights: b.nights, paymentMethod: b.payment_method, propertyTitle: b.property_title,
                  propertyAddress: b.property_address, checkInDate: b.check_in, checkOutDate: b.check_out,
                  guests: b.guests_count, status: b.status, guest_name: b.guest_name, host_name: b.host_name,
                  bookingDate: b.created_at
                })}
                className="text-xs font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                Download Receipt
              </button>
            )}
            {canReview && (
              <button
                onClick={() => navigate(`/properties/${b.property_id}/review`)}
                className="text-xs font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <HiOutlineChatBubbleLeftEllipsis className="w-3.5 h-3.5" />
                Leave Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingDetailModal({ booking: b, onClose, onCancel, cancellingId, onLeaveReview }) {
  const [imgErr, setImgErr] = useState(false)
  const nights = b.nights || Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)))
  const canCancel = b.status === 'Pending' || b.status === 'Confirmed'
  const canReview = b.status === 'Completed' && !b.has_review

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-main-text">Booking #{b.id}</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-main-text p-1 rounded-lg hover:bg-divider transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status] || ''}`}>
              {b.status}
            </span>
            {b.property_type && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                {b.property_type}
              </span>
            )}
          </div>

          {b.image_url && !imgErr && (
            <img
              src={b.image_url}
              alt={b.property_title}
              className="w-full h-40 object-cover rounded-lg mb-4"
              onError={() => setImgErr(true)}
            />
          )}

          <div className="space-y-4">
            <Section title="Property">
              <Info label="Name" value={b.property_title} />
              <Info label="Type" value={b.property_type || 'House'} />
              <Info label="Location" value={b.property_address} />
            </Section>

            <Section title="Booking Details">
              <Info label="Check-in" value={b.check_in} />
              <Info label="Check-out" value={b.check_out} />
              <Info label="Duration" value={`${nights} night${nights > 1 ? 's' : ''}`} />
              <Info label="Guests" value={`${b.guests_count || 1} person${(b.guests_count || 1) > 1 ? 's' : ''}`} />
              {b.created_at && <Info label="Booked On" value={b.created_at.split(' ')[0]} />}
            </Section>

            <Section title="Payment">
              <Info label="Total Amount" value={formatRupees(b.total_price)} bold />
              <Info label="Payment Method" value={b.payment_method || 'N/A'} />
              <Info label="Transaction ID" value={b.transaction_id || 'N/A'} mono />
            </Section>

            {b.special_requests && (
              <Section title="Special Requests">
                <p className="text-sm text-secondary-text">{b.special_requests}</p>
              </Section>
            )}
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t border-divider">
            {(b.status === 'Completed' || b.status === 'Confirmed') && (
              <button
                onClick={() => generateBookingReceipt({
                  bookingId: b.id, transactionId: b.transaction_id, amount: b.total_price,
                  nights, paymentMethod: b.payment_method, propertyTitle: b.property_title,
                  propertyAddress: b.property_address, checkInDate: b.check_in, checkOutDate: b.check_out,
                  guests: b.guests_count, status: b.status, guest_name: b.guest_name, host_name: b.host_name,
                  bookingDate: b.created_at
                })}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <HiOutlineDocumentDuplicate className="w-4 h-4" />
                Download Receipt
              </button>
            )}
            {canCancel && (
              <>
                <button
                  onClick={() => { onCancel(b.id); onClose() }}
                  disabled={cancellingId === b.id}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 btn-primary text-center"
                >
                  Close
                </button>
              </>
            )}
            {canReview && (
              <button
                onClick={() => { onClose(); onLeaveReview(b.property_id) }}
                className="flex-1 btn-primary text-center"
              >
                Leave Review
              </button>
            )}
            {!canCancel && !canReview && (
              <button onClick={onClose} className="w-full btn-primary text-center">
                Close
              </button>
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
      <span className={`text-main-text ${bold ? 'font-bold' : ''} ${mono ? 'font-mono text-xs' : ''}`}>
        {value || 'N/A'}
      </span>
    </div>
  )
}
