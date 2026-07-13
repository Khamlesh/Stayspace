import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import userAPI from '../../api/userApi'
import { bookingsAPI } from '../../api/client'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineHeart,
  HiOutlineCurrencyRupee, HiOutlineClock, HiOutlineMapPin
} from 'react-icons/hi2'

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="dashboard-card dashboard-card-hover">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-10 w-10 bg-divider rounded-xl mb-3" />
          <div className="h-4 w-24 bg-divider rounded mb-2" />
          <div className="h-7 w-20 bg-divider rounded" />
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs text-secondary-text font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-main-text">{value}</p>
        </>
      )}
    </div>
  )
}

function BookingRow({ booking }) {
  const statusColors = {
    Pending: 'bg-warning/10 text-warning',
    Confirmed: 'bg-success/10 text-success',
    Completed: 'bg-info/10 text-info',
    Cancelled: 'bg-danger/10 text-danger'
  }
  return (
    <tr className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-main-text">{booking.property_title}</p>
      </td>
      <td className="py-3 px-4 text-sm text-secondary-text">{booking.check_in}</td>
      <td className="py-3 px-4 text-sm text-secondary-text">{booking.check_out}</td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[booking.status] || 'bg-divider text-secondary-text'}`}>
          {booking.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-main-text">{formatRupees(booking.total_price)}</td>
    </tr>
  )
}

function QuickAction({ icon: Icon, label, description, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      className="dashboard-card dashboard-card-hover text-left group"
      disabled={loading}
    >
      {loading ? (
        <div className="animate-pulse">
          <div className="h-10 w-10 bg-divider rounded-xl mb-3" />
          <div className="h-4 w-28 bg-divider rounded mb-1" />
          <div className="h-3 w-40 bg-divider rounded" />
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-main-text mb-0.5">{label}</p>
          <p className="text-xs text-secondary-text">{description}</p>
        </>
      )}
    </button>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-divider flex items-center justify-center mb-3">
        <HiOutlineClock className="w-7 h-7 text-secondary-text" />
      </div>
      <p className="text-sm text-secondary-text">{message}</p>
    </div>
  )
}

export default function UserDashboardPage() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, bookingsRes] = await Promise.allSettled([
          userAPI.getDashboardStats(),
          bookingsAPI.getGuestBookings()
        ])
        if (statsRes.status === 'fulfilled' && statsRes.value.data.status === 'success') {
          setStats(statsRes.value.data.data)
        }
        if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data.status === 'success') {
          setBookings(bookingsRes.value.data.data || [])
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalSpent = bookings.reduce((sum, b) => {
    if (b.status === 'Completed' || b.status === 'Confirmed') {
      return sum + Number(b.total_price || 0)
    }
    return sum
  }, 0)

  const activeBookings = stats?.active_bookings ?? bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Welcome back, {user?.name?.split(' ')[0] || 'Guest'}!</h1>
        <p className="text-sm text-secondary-text mt-1">Here's an overview of your stays and bookings</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HiOutlineCalendarDays}
          label="Total Bookings"
          value={stats?.total_bookings ?? bookings.length}
          loading={loading}
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Active Bookings"
          value={activeBookings}
          loading={loading}
        />
        <StatCard
          icon={HiOutlineHeart}
          label="Wishlist Items"
          value={stats?.wishlist_count ?? 0}
          loading={loading}
        />
        <StatCard
          icon={HiOutlineCurrencyRupee}
          label="Total Spent"
          value={stats?.total_spent != null ? formatRupees(stats.total_spent) : formatRupees(totalSpent)}
          loading={loading}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-main-text mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            icon={HiOutlineMapPin}
            label="Explore Stays"
            description="Discover your next getaway"
            onClick={() => navigate('/user/explore')}
            loading={loading}
          />
          <QuickAction
            icon={HiOutlineCalendarDays}
            label="My Bookings"
            description="View and manage your reservations"
            onClick={() => navigate('/user/bookings')}
            loading={loading}
          />
          <QuickAction
            icon={HiOutlineHeart}
            label="My Wishlist"
            description="Properties you've saved"
            onClick={() => navigate('/user/wishlist')}
            loading={loading}
          />
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-main-text">Recent Bookings</h2>
          <button onClick={() => navigate('/user/bookings')} className="text-xs text-primary font-medium hover:underline">View All</button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-divider rounded-lg animate-pulse" />)}
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Property</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Check-in</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Check-out</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Status</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((b, i) => <BookingRow key={i} booking={b} />)}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No bookings yet" />
        )}
      </div>
    </div>
  )
}
