import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import hostAPI from '../../api/hostApi'
import {
  HiOutlineBuildingOffice2, HiOutlineCalendarDays,
  HiOutlineCurrencyRupee, HiOutlineStar, HiOutlineArrowUpRight,
  HiOutlineArrowDownRight, HiOutlineClock
} from 'react-icons/hi2'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#FF385C', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']

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
        <p className="text-xs text-secondary-text">{booking.guest_email || ''}</p>
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
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, bookingsRes, checkinsRes, chartRes, reviewsRes] = await Promise.allSettled([
          hostAPI.getDashboardKPI(),
          hostAPI.getRecentBookings(),
          hostAPI.getUpcomingCheckins(),
          hostAPI.getMonthlyEarnings(),
          hostAPI.getRecentReviews()
        ])
        if (statsRes.status === 'fulfilled' && statsRes.value.data.status === 'success') {
          setStats(statsRes.value.data.data)
        }
        if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data.status === 'success') {
          setBookings(bookingsRes.value.data.data || [])
        }
        if (checkinsRes.status === 'fulfilled' && checkinsRes.value.data.status === 'success') {
          setCheckins(checkinsRes.value.data.data || [])
        }
        if (chartRes.status === 'fulfilled' && chartRes.value.data.status === 'success') {
          setChartData(chartRes.value.data.data || [])
        }
        if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data.status === 'success') {
          setReviews(reviewsRes.value.data.data || [])
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Dashboard</h1>
        <p className="text-sm text-secondary-text mt-1">Welcome back, here's your property overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HiOutlineBuildingOffice2}
          label="Total Properties"
          value={stats?.total_properties ?? 0}
          loading={loading}
        />
        <StatCard
          icon={HiOutlineCalendarDays}
          label="Total Bookings"
          value={stats?.total_bookings ?? 0}
          change={stats?.bookings_this_month}
          isPositive={stats?.bookings_this_month > 0}
          loading={loading}
        />
        <StatCard
          icon={HiOutlineCurrencyRupee}
          label="Monthly Earnings"
          value={`₹${Number(stats?.monthly_earnings || 0).toLocaleString('en-IN')}`}
          change={stats?.earnings_growth_pct}
          isPositive={stats?.earnings_growth_pct >= 0}
          loading={loading}
        />
        <StatCard
          icon={HiOutlineStar}
          label="Average Rating"
          value={stats?.average_rating?.toFixed(1) || '0.0'}
          change={stats?.rating_change}
          isPositive={stats?.rating_change >= 0}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Revenue & Bookings</h2>
            <button onClick={() => navigate('/host/earnings')} className="text-xs text-primary font-medium hover:underline">View Details</button>
          </div>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF385C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FF385C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }}
                  formatter={(value, name) => [name === 'earnings' ? `₹${Number(value).toLocaleString('en-IN')}` : value, name === 'earnings' ? 'Revenue' : 'Bookings']}
                />
                <Area type="monotone" dataKey="earnings" stroke="#FF385C" strokeWidth={2.5} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
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
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Recent Bookings</h2>
            <button onClick={() => navigate('/host/bookings')} className="text-xs text-primary font-medium hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-divider rounded-lg animate-pulse" />)}
            </div>
          ) : bookings.length > 0 ? (
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
                  {bookings.slice(0, 5).map((b, i) => <BookingRow key={i} booking={b} />)}
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
