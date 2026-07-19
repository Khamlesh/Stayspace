import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import hostAPI from '../../api/hostApi'
import { formatRupees } from '../../utils/currency'
import DashboardFilter from '../../components/DashboardFilter'
import ExportButton from '../../components/ExportButton'
import {
  HiOutlineBuildingOffice2, HiOutlineCalendarDays,
  HiOutlineCurrencyRupee, HiOutlineStar, HiOutlineArrowUpRight,
  HiOutlineArrowDownRight, HiOutlineClock, HiOutlineArrowPath,
  HiOutlineUserGroup, HiOutlineHomeModern, HiOutlineChartBar
} from 'react-icons/hi2'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#F43F5E', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']

function StatCard({ icon: Icon, label, value, change, isPositive, loading }) {
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
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {isPositive ? (
                <HiOutlineArrowUpRight className="w-3.5 h-3.5 text-success" />
              ) : (
                <HiOutlineArrowDownRight className="w-3.5 h-3.5 text-danger" />
              )}
              <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-secondary-text">vs last month</span>
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
    Cancelled: 'bg-danger/10 text-danger'
  }
  return (
    <tr className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-main-text">{booking.guest_name || 'Guest'}</p>
      </td>
      <td className="py-3 px-4 text-sm text-main-text">{booking.property_title}</td>
      <td className="py-3 px-4 text-sm text-secondary-text">{booking.check_in}</td>
      <td className="py-3 px-4 text-sm text-secondary-text">{booking.check_out}</td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[booking.status] || 'bg-divider text-secondary-text'}`}>
          {booking.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-main-text">{'\u20B9'}{Number(booking.total_price).toLocaleString('en-IN')}</td>
    </tr>
  )
}

function CheckinCard({ checkin }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-divider hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-primary font-semibold text-sm">{(checkin.guest_name || 'G').charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-main-text truncate">{checkin.guest_name}</p>
        <p className="text-xs text-secondary-text truncate">{checkin.property_title}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-medium text-primary">{checkin.check_in}</p>
        <p className="text-xs text-secondary-text">{checkin.guest_count || 1} guest(s)</p>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-divider rounded-xl shadow-card p-3">
      <p className="text-xs font-semibold text-main-text mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {p.name?.toLowerCase().includes('earnings') || p.name?.toLowerCase().includes('revenue')
            ? `₹${Number(p.value).toLocaleString('en-IN')}` : `${p.value}${p.name?.toLowerCase().includes('occupancy') ? '%' : ''}`}
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

export default function HostDashboardPage() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [checkins, setCheckins] = useState([])
  const [chartData, setChartData] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ key: 'all', start: null, end: null })
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, bookingsRes, checkinsRes, chartRes, reviewsRes] = await Promise.allSettled([
        hostAPI.getDashboardKPI(),
        hostAPI.getRecentBookings(),
        hostAPI.getUpcomingCheckins(),
        hostAPI.getMonthlyEarnings(),
        hostAPI.getRecentReviews()
      ])
      if (statsRes.status === 'fulfilled' && statsRes.value.data.status === 'success') setStats(statsRes.value.data.data)
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data.status === 'success') setBookings(bookingsRes.value.data.data || [])
      if (checkinsRes.status === 'fulfilled' && checkinsRes.value.data.status === 'success') setCheckins(checkinsRes.value.data.data || [])
      if (chartRes.status === 'fulfilled' && chartRes.value.data.status === 'success') setChartData(chartRes.value.data.data || [])
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data.status === 'success') setReviews(reviewsRes.value.data.data || [])
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const bookingStatusDist = stats?.booking_status_distribution || []
  const propertyPerformance = stats?.property_performance || []

  const filteredBookings = useMemo(() => {
    let data = bookings
    if (filter.start) {
      data = data.filter(b => b.check_in >= filter.start && (!filter.end || b.check_in <= filter.end))
    }
    return data
  }, [bookings, filter])

  const recentBookings = useMemo(() => filteredBookings.slice(0, 8), [filteredBookings])

  const filteredStats = useMemo(() => {
    if (!stats) return null
    if (!filter.start) return stats
    const fb = filteredBookings
    const completedBookings = fb.filter(b => b.status === 'Completed').length
    const cancelledBookings = fb.filter(b => b.status === 'Cancelled').length
    const pendingBookings = fb.filter(b => b.status === 'Pending').length
    const filteredRevenue = fb.reduce((sum, b) => sum + Number(b.total_price || 0), 0)
    return {
      ...stats,
      total_bookings: fb.length,
      completed_bookings: completedBookings,
      cancelled_bookings: cancelledBookings,
      pending_bookings: pendingBookings,
    }
  }, [stats, filteredBookings, filter])

  const avgOccupancy = useMemo(() => {
    if (chartData.length === 0) return 0
    const total = chartData.reduce((sum, d) => sum + (d.occupancy || 0), 0)
    return Math.round(total / chartData.length)
  }, [chartData])

  const filteredChartData = useMemo(() => {
    if (!filter.start) return chartData
    return chartData.filter(d => {
      return true
    })
  }, [chartData, filter])

  const filteredBookingStatusDist = useMemo(() => {
    if (!filter.start) return bookingStatusDist
    const map = {}
    filteredBookings.forEach(b => {
      map[b.status] = (map[b.status] || 0) + 1
    })
    return Object.entries(map).map(([status, count]) => ({ status, count }))
  }, [filteredBookings, filter, bookingStatusDist])

  const filteredPropertyPerformance = useMemo(() => {
    if (!filter.start) return propertyPerformance
    const propMap = {}
    filteredBookings.forEach(b => {
      const title = b.property_title || 'Unknown'
      if (!propMap[title]) propMap[title] = { title, total_bookings: 0, revenue: 0 }
      propMap[title].total_bookings++
      propMap[title].revenue += Number(b.total_price || 0)
    })
    return Object.values(propMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [filteredBookings, filter, propertyPerformance])

  const exportData = filteredBookings.map(b => ({
    guest: b.guest_name, property: b.property_title, check_in: b.check_in, check_out: b.check_out, status: b.status, amount: b.total_price
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Dashboard</h1>
          <p className="text-sm text-secondary-text mt-1">Welcome back, here's your property overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-text bg-white border border-divider rounded-lg hover:bg-divider transition-colors">
            <HiOutlineArrowPath className="w-3.5 h-3.5" /> Refresh
          </button>
          <ExportButton data={exportData} filename="host-bookings" title="Host Bookings Report" />
        </div>
      </div>

      <DashboardFilter value={filter} onChange={setFilter} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={HiOutlineBuildingOffice2} label="Total Properties" value={stats?.total_properties ?? 0} loading={loading} />
        <StatCard icon={HiOutlineCalendarDays} label="Total Bookings" value={filteredStats?.total_bookings ?? stats?.total_bookings ?? 0} change={stats?.bookings_this_month} isPositive={stats?.bookings_this_month > 0} loading={loading} />
        <StatCard icon={HiOutlineCurrencyRupee} label="Monthly Revenue" value={`₹${Number(stats?.monthly_earnings || 0).toLocaleString('en-IN')}`} change={stats?.earnings_growth_pct} isPositive={stats?.earnings_growth_pct >= 0} loading={loading} />
        <StatCard icon={HiOutlineStar} label="Guest Satisfaction" value={stats?.average_rating?.toFixed(1) || '0.0'} change={stats?.rating_change} isPositive={stats?.rating_change >= 0} loading={loading} />
        <StatCard icon={HiOutlineChartBar} label="Occupancy Rate" value={`${avgOccupancy}%`} loading={loading} />
        <StatCard icon={HiOutlineHomeModern} label="Top Property" value={stats?.top_performing_property || 'N/A'} loading={loading} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Annual Revenue</p>
          <p className="text-xl font-bold text-main-text">₹{Number(stats?.annual_earnings || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Completed</p>
          <p className="text-xl font-bold text-success">{filteredStats?.completed_bookings ?? stats?.completed_bookings ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Pending</p>
          <p className="text-xl font-bold text-warning">{filteredStats?.pending_bookings ?? stats?.pending_bookings ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Cancelled</p>
          <p className="text-xl font-bold text-danger">{filteredStats?.cancelled_bookings ?? stats?.cancelled_bookings ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Revenue & Bookings</h2>
            <button onClick={() => navigate('/host/earnings')} className="text-xs text-primary font-medium hover:underline">View Details</button>
          </div>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : filteredChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filteredChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF385C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FF385C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="earnings" name="Earnings" stroke="#FF385C" strokeWidth={2.5} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No earnings data yet" />
          )}
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Upcoming Check-ins</h2>
            <button onClick={() => navigate('/host/bookings')} className="text-xs text-primary font-medium hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-divider rounded-xl animate-pulse" />)}
            </div>
          ) : checkins.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {checkins.map((c, i) => <CheckinCard key={i} checkin={c} />)}
            </div>
          ) : (
            <EmptyState message="No upcoming check-ins" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChartData.length > 0 && (
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-main-text mb-4">Booking Trend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" name="Bookings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {filteredChartData.length > 0 && (
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-main-text mb-4">Occupancy Trend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={filteredChartData}>
                <defs>
                  <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="occupancy" name="Occupancy" stroke="#22C55E" strokeWidth={2.5} fill="url(#colorOccupancy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {filteredBookingStatusDist.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-main-text mb-4">Booking Status</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={filteredBookingStatusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="count" nameKey="status"
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                  {filteredBookingStatusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {filteredPropertyPerformance.length > 0 && (
            <div className="dashboard-card">
              <h2 className="text-lg font-semibold text-main-text mb-4">Property Performance</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filteredPropertyPerformance.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 11, fill: '#6B7280' }} width={120} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#F43F5E" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {filteredPropertyPerformance.length > 0 && (
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Property Details</h2>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Property</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Bookings</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Rating</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredPropertyPerformance.slice(0, 5).map((p, i) => (
                  <tr key={i} className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-main-text">{p.title}</td>
                    <td className="py-3 px-4 text-sm text-secondary-text">{p.total_bookings}</td>
                    <td className="py-3 px-4 text-sm text-warning">{p.avg_rating > 0 ? `★ ${p.avg_rating}` : '-'}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-main-text">₹{Number(p.revenue).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Recent Bookings</h2>
            <button onClick={() => navigate('/host/bookings')} className="text-xs text-primary font-medium hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-divider rounded-lg animate-pulse" />)}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Guest</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Property</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Check-in</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Check-out</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Status</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b, i) => <BookingRow key={i} booking={b} />)}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No bookings yet" />
          )}
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Recent Reviews</h2>
            <button onClick={() => navigate('/host/reviews')} className="text-xs text-primary font-medium hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-divider rounded-xl animate-pulse" />)}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {reviews.map((r, i) => (
                <div key={i} className="p-3 rounded-xl border border-divider">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs font-semibold">{(r.guest_name || 'G').charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-main-text">{r.guest_name}</span>
                    <span className="text-xs text-secondary-text ml-auto">{r.created_at?.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-xs ${s <= r.rating ? 'text-rating' : 'text-divider'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-secondary-text line-clamp-2">{r.comment}</p>
                  <p className="text-[11px] text-info mt-1">Re: {r.property_title}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No reviews yet" />
          )}
        </div>
      </div>
    </div>
  )
}
