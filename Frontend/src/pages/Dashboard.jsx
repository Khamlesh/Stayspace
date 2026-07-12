import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { bookingsAPI } from '../api/client'
import { formatRupees } from '../utils/currency'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  const tabs = [
    { id: 'bookings', label: 'My Bookings' },
    { id: 'profile', label: 'Profile' },
  ]

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings()
  }, [activeTab])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const res = await bookingsAPI.getGuestBookings()
      if (res.data.status === 'success') setBookings(res.data.data || [])
    } catch (e) {
      console.error(e)
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
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-green-100 text-green-800',
    'Checked-In': 'bg-blue-100 text-blue-800',
    Completed: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800'
  }

  const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending' || b.status === 'Checked-In')
  const pastBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8 text-main-text">My Dashboard</h1>

      <div className="flex gap-4 mb-8 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.id === 'bookings' && bookings.length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{bookings.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-main-text">My Bookings</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-divider rounded-xl animate-pulse" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-main-text mb-2">No bookings yet</h3>
              <p className="text-secondary-text mb-6">Start exploring properties and make your first booking!</p>
              <button onClick={() => navigate('/search')} className="btn-primary">Browse Properties</button>
            </div>
          ) : (
            <div className="space-y-8">
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-text mb-4">Upcoming & Active</h3>
                  <div className="space-y-4">
                    {upcomingBookings.map(booking => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        statusColors={statusColors}
                        onCancel={handleCancel}
                        cancellingId={cancellingId}
                        canCancel={booking.status === 'Pending' || booking.status === 'Confirmed'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {pastBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-text mb-4">Past & Cancelled</h3>
                  <div className="space-y-4">
                    {pastBookings.map(booking => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        statusColors={statusColors}
                        onCancel={handleCancel}
                        cancellingId={cancellingId}
                        canCancel={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6 text-main-text">Your Profile</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                  <input type="text" value={user?.name || ''} readOnly className="input-field bg-gray-100" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input type="email" value={user?.email || ''} readOnly className="input-field bg-gray-100" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Role</label>
                  <input type="text" value={user?.role || ''} readOnly className="input-field bg-gray-100" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 mx-auto">
              {user?.name?.charAt(0)}
            </div>
            <h3 className="text-center font-bold text-lg text-main-text">{user?.name}</h3>
            <p className="text-center text-gray-600 text-sm mb-4">{user?.email}</p>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Role: <span className="font-semibold">{user?.role}</span></p>
              <p className="text-sm text-gray-600">Total Bookings: <span className="font-semibold">{bookings.length}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const BookingCard = ({ booking, statusColors, onCancel, cancellingId, canCancel }) => {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all bg-white">
      <div className="flex flex-col sm:flex-row gap-4">
        {booking.image_url && !imgError ? (
          <img
            src={booking.image_url}
            alt={booking.property_title}
            className="w-full sm:w-32 h-24 object-cover rounded-lg flex-shrink-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full sm:w-32 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary/30">{booking.property_title?.charAt(0)}</span>
          </div>
        )}

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-main-text">{booking.property_title}</h3>
              <p className="text-sm text-gray-600">{booking.property_address}</p>
              {booking.property_type && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">{booking.property_type}</span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
              {booking.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mt-3">
            <span>📅 {booking.check_in} → {booking.check_out}</span>
            <span>🌙 {booking.nights} night{booking.nights > 1 ? 's' : ''}</span>
            <span>👥 {booking.guests_count || 1} guest{(booking.guests_count || 1) > 1 ? 's' : ''}</span>
            <span className="font-semibold text-gray-900">💰 {formatRupees(booking.total_price)}</span>
          </div>

          {booking.payment_method && (
            <div className="flex gap-x-6 text-xs text-gray-500 mt-2">
              <span>Payment: {booking.payment_method}</span>
              {booking.transaction_id && <span>Txn: {booking.transaction_id}</span>}
            </div>
          )}

          {canCancel && (
            <div className="mt-3">
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancellingId === booking.id}
                className="text-sm text-red-600 hover:text-red-800 font-semibold disabled:opacity-50"
              >
                {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
