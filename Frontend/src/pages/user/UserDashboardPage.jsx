import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import userAPI from '../../api/userApi'
import { bookingsAPI } from '../../api/client'
import { formatRupees } from '../../utils/currency'
import DashboardFilter from '../../components/DashboardFilter'
import ExportButton from '../../components/ExportButton'
import {
  HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineHeart,
  HiOutlineCurrencyRupee, HiOutlineClock, HiOutlineMapPin,
  HiOutlineArrowUpRight, HiOutlineArrowDownRight, HiOutlineStar,
  HiOutlineArrowPath
} from 'react-icons/hi2'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#F43F5E', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']

function StatCard({ icon: Icon, label, value, change, isPositive, loading, color }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  }
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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color] || colorMap.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-xs text-secondary-text font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-main-text">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {isPositive ? (
                <HiOutlineArrowUpRight className="w-3.5 h-3.5 text-success" />
              ) : (
                <HiOutlineArrowDownRight className="w-3.5 h-3.5 text-danger" />
              )}
              <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                {Math.abs(change)}
              </span>
            </div>
          )}
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
    Cancelled: 'bg-danger/10 text-danger',
    'Checked-In': 'bg-info/10 text-info'
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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-divider rounded-xl shadow-card p-3">
      <p className="text-xs font-semibold text-main-text mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('spending')
            ? formatRupees(p.value) : p.value}
        </p>
      ))}
    </div>
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
  const [filter, setFilter] = useState({ key: 'all', start: null, end: null })
  const navigate = useNavigate()
  const { user } = useAuth()

  const loadData = async () => {
    setLoading(true)
    setError(null)
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
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredBookings = useMemo(() => {
    if (!filter.start) return bookings
    return bookings.filter(b => {
      const d = b.check_in
      return d >= filter.start && (!filter.end || d <= filter.end)
    })
  }, [bookings, filter])

  const monthlySpending = stats?.monthly_spending || []
  const bookingStatusDist = stats?.booking_status_distribution || []
  const bookingChartData = useMemo(() => {
    const map = {}
    filteredBookings.forEach(b => {
      const m = (b.check_in || '').slice(0, 7)
      if (!m) return
      if (!map[m]) map[m] = { month: m, bookings: 0, spending: 0 }
      map[m].bookings++
      if (b.status === 'Completed' || b.status === 'Confirmed') {
        map[m].spending += Number(b.total_price || 0)
      }
    })
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
  }, [filteredBookings])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Welcome back, {user?.name?.split(' ')[0] || 'Guest'}!</h1>
          <p className="text-sm text-secondary-text mt-1">Here's an overview of your stays and bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-text bg-white border border-divider rounded-lg hover:bg-divider transition-colors">
            <HiOutlineArrowPath className="w-3.5 h-3.5" /> Refresh
          </button>
          <ExportButton data={filteredBookings.map(b => ({ property: b.property_title, check_in: b.check_in, check_out: b.check_out, status: b.status, amount: b.total_price }))} filename="my-bookings" title="My Bookings Report" />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>
      )}

      <DashboardFilter value={filter} onChange={setFilter} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={HiOutlineCalendarDays} label="Total Trips" value={stats?.total_bookings ?? bookings.length} loading={loading} color="primary" />
        <StatCard icon={HiOutlineCheckCircle} label="Upcoming" value={stats?.upcoming_bookings ?? 0} loading={loading} color="info" />
        <StatCard icon={HiOutlineCheckCircle} label="Completed" value={stats?.completed_bookings ?? 0} loading={loading} color="success" />
        <StatCard icon={HiOutlineClock} label="Cancelled" value={stats?.cancelled_bookings ?? 0} loading={loading} color="danger" />
        <StatCard icon={HiOutlineHeart} label="Wishlist" value={stats?.wishlist_count ?? 0} loading={loading} color="primary" />
        <StatCard icon={HiOutlineStar} label="Reviews" value={stats?.reviews_count ?? 0} loading={loading} color="warning" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Total Spending</p>
          <p className="text-xl font-bold text-main-text">{stats?.total_spent != null ? formatRupees(stats.total_spent) : formatRupees(0)}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Avg. Booking Cost</p>
          <p className="text-xl font-bold text-main-text">{stats?.average_booking_cost != null ? formatRupees(stats.average_booking_cost) : formatRupees(0)}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Favourite Destination</p>
          <p className="text-xl font-bold text-main-text truncate">{stats?.favourite_destination || 'No trips yet'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Monthly Spending</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : monthlySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlySpending}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="spending" name="Spending" stroke="#F43F5E" strokeWidth={2.5} fill="url(#colorSpending)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No spending data yet" />
          )}
        </div>

        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Booking History</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : bookingChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bookingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" name="Bookings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No booking history yet" />
          )}
        </div>
      </div>

      {bookingStatusDist.length > 0 && (
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Booking Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={bookingStatusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="status"
                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                {bookingStatusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => navigate('/user/explore')} className="dashboard-card dashboard-card-hover text-left group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <HiOutlineMapPin className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-main-text mb-0.5">Explore Stays</p>
          <p className="text-xs text-secondary-text">Discover your next getaway</p>
        </button>
        <button onClick={() => navigate('/user/bookings')} className="dashboard-card dashboard-card-hover text-left group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <HiOutlineCalendarDays className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-main-text mb-0.5">My Bookings</p>
          <p className="text-xs text-secondary-text">View and manage your reservations</p>
        </button>
        <button onClick={() => navigate('/user/wishlist')} className="dashboard-card dashboard-card-hover text-left group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <HiOutlineHeart className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-main-text mb-0.5">My Wishlist</p>
          <p className="text-xs text-secondary-text">Properties you've saved</p>
        </button>
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
        ) : filteredBookings.length > 0 ? (
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
                {filteredBookings.slice(0, 8).map((b, i) => <BookingRow key={i} booking={b} />)}
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
