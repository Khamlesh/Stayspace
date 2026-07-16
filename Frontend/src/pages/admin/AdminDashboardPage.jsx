import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import { formatRupees } from '../../utils/currency'
import DashboardFilter from '../../components/DashboardFilter'
import ExportButton from '../../components/ExportButton'
import {
  HiOutlineUserGroup, HiOutlineUserCircle, HiOutlineClock,
  HiOutlineBuildingOffice2, HiOutlineCalendarDays, HiOutlineCheckCircle,
  HiOutlineCurrencyRupee, HiOutlineStar, HiOutlineArrowUpRight,
  HiOutlineArrowDownRight, HiOutlineExclamationTriangle, HiOutlineArrowPath
} from 'react-icons/hi2'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#F43F5E', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']

function StatCard({ icon: Icon, label, value, change, isPositive, loading, highlight }) {
  return (
    <div className={`dashboard-card dashboard-card-hover ${highlight ? 'ring-2 ring-warning/40' : ''}`}>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-10 w-10 bg-divider rounded-xl mb-3" />
          <div className="h-4 w-24 bg-divider rounded mb-2" />
          <div className="h-7 w-20 bg-divider rounded" />
        </div>
      ) : (
        <>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${highlight ? 'bg-warning/10' : 'bg-primary/10'}`}>
            <Icon className={`w-5 h-5 ${highlight ? 'text-warning' : 'text-primary'}`} />
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
    Cancelled: 'bg-danger/10 text-danger',
    'Checked-In': 'bg-info/10 text-info'
  }
  return (
    <tr className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-main-text">{booking.guest_name || 'Guest'}</p>
      </td>
      <td className="py-3 px-4 text-sm text-main-text">{booking.property_title}</td>
      <td className="py-3 px-4 text-sm text-secondary-text">{booking.host_name || '-'}</td>
      <td className="py-3 px-4 text-sm text-secondary-text">{booking.check_in}</td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[booking.status] || 'bg-divider text-secondary-text'}`}>
          {booking.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-main-text">{formatRupees(booking.total_price)}</td>
    </tr>
  )
}

function PendingHostCard({ host, onApprove, onReject, processing }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-divider hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
        <span className="text-warning font-semibold text-sm">{(host.name || 'H').charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-main-text truncate">{host.name}</p>
        <p className="text-xs text-secondary-text truncate">{host.email}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => onApprove(host.host_id || host.id)} disabled={processing}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50">Approve</button>
        <button onClick={() => onReject(host.host_id || host.id)} disabled={processing}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-50">Reject</button>
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
          {p.name}: {p.name?.toLowerCase().includes('revenue') || p.name?.toLowerCase().includes('earnings')
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="dashboard-card animate-pulse">
          <div className="h-10 w-10 bg-divider rounded-xl mb-3" />
          <div className="h-4 w-24 bg-divider rounded mb-2" />
          <div className="h-7 w-20 bg-divider rounded" />
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [hosts, setHosts] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [filter, setFilter] = useState({ key: 'all', start: null, end: null })

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, bookingsRes, hostsRes, complaintsRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getBookings(),
        adminAPI.getHosts(),
        adminAPI.getComplaints()
      ])
      if (statsRes.status === 'fulfilled' && statsRes.value.data.status === 'success') setStats(statsRes.value.data.data)
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data.status === 'success') setBookings(bookingsRes.value.data.data || [])
      if (hostsRes.status === 'fulfilled' && hostsRes.value.data.status === 'success') setHosts(hostsRes.value.data.data || [])
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data.status === 'success') setComplaints(complaintsRes.value.data.data || [])
    } catch (e) {
      console.error('Admin dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const pendingHosts = useMemo(() => hosts.filter(h => h.status === 'pending'), [hosts])
  const recentBookings = useMemo(() => {
    let data = bookings
    if (filter.start) {
      data = data.filter(b => b.check_in >= filter.start && (!filter.end || b.check_in <= filter.end))
    }
    return data.slice(0, 5)
  }, [bookings, filter])
  const openComplaints = useMemo(() => complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length, [complaints])
  const resolvedComplaints = useMemo(() => complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length, [complaints])

  const revenueChartData = stats?.monthly_revenue_chart || []
  const userGrowthData = stats?.user_growth || []
  const hostGrowthData = stats?.host_growth || []
  const propertyTypeDist = stats?.property_type_distribution || []
  const bookingStatusDist = stats?.booking_status_distribution || []
  const reviewAnalytics = stats?.review_analytics || []
  const totalBookings = stats?.total_bookings || 1
  const cancellationRate = stats?.cancelled_bookings ? ((stats.cancelled_bookings / totalBookings) * 100).toFixed(1) : 0

  const complaintData = [
    { name: 'Open', value: openComplaints },
    { name: 'Resolved', value: resolvedComplaints },
  ].filter(d => d.value > 0)

  const exportData = bookings.map(b => ({
    guest: b.guest_name, property: b.property_title, host: b.host_name,
    check_in: b.check_in, status: b.status, amount: b.total_price
  }))

  const handleApproveHost = async (hostId) => {
    setProcessing(true)
    try {
      await adminAPI.approveHost(hostId)
      setHosts(prev => prev.map(h => (h.host_id || h.id) === hostId ? { ...h, status: 'approved' } : h))
    } catch (e) { console.error('Approve failed:', e) }
    finally { setProcessing(false) }
  }

  const handleRejectHost = async (hostId) => {
    setProcessing(true)
    try {
      await adminAPI.rejectHost(hostId)
      setHosts(prev => prev.filter(h => (h.host_id || h.id) !== hostId))
    } catch (e) { console.error('Reject failed:', e) }
    finally { setProcessing(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Admin Dashboard</h1>
          <p className="text-sm text-secondary-text mt-1">Platform-wide statistics and management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-text bg-white border border-divider rounded-lg hover:bg-divider transition-colors">
            <HiOutlineArrowPath className="w-3.5 h-3.5" /> Refresh
          </button>
          <ExportButton data={exportData} filename="admin-bookings" title="Platform Bookings Report" />
        </div>
      </div>

      <DashboardFilter value={filter} onChange={setFilter} />

      {loading ? (
        <SkeletonGrid />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon={HiOutlineUserGroup} label="Total Users" value={stats?.total_users ?? 0} loading={loading} />
          <StatCard icon={HiOutlineUserCircle} label="Approved Hosts" value={stats?.active_hosts ?? 0} loading={loading} />
          <StatCard icon={HiOutlineCheckCircle} label="Completed" value={stats?.completed_bookings ?? 0} loading={loading} />
          <StatCard icon={HiOutlineBuildingOffice2} label="Properties" value={stats?.total_properties ?? 0} loading={loading} />
          <StatCard icon={HiOutlineCalendarDays} label="Total Bookings" value={stats?.total_bookings ?? 0} loading={loading} />
          <StatCard icon={HiOutlineClock} label="Cancelled" value={stats?.cancelled_bookings ?? 0} loading={loading} />
          <StatCard icon={HiOutlineCurrencyRupee} label="Platform Revenue" value={formatRupees(stats?.total_revenue ?? 0)} loading={loading} />
          <StatCard icon={HiOutlineStar} label="Total Reviews" value={stats?.total_reviews ?? 0} loading={loading} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Monthly Revenue</p>
          <p className="text-xl font-bold text-main-text">{formatRupees(stats?.revenue_this_month || 0)}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Cancellation Rate</p>
          <p className="text-xl font-bold text-danger">{cancellationRate}%</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Open Complaints</p>
          <p className="text-xl font-bold text-warning">{openComplaints}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-xs text-secondary-text font-medium mb-1">Pending Hosts</p>
          <p className="text-xl font-bold text-info">{stats?.pending_hosts ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Revenue & Bookings</h2>
          </div>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#F43F5E" strokeWidth={2.5} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No revenue data yet" />
          )}
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Platform Overview</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-divider rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-success/5 border border-success/10 p-4">
                <p className="text-xs font-medium text-success">Completed Bookings</p>
                <p className="text-2xl font-bold text-main-text mt-1">{stats?.completed_bookings ?? 0}</p>
              </div>
              <div className="rounded-xl bg-danger/5 border border-danger/10 p-4">
                <p className="text-xs font-medium text-danger">Cancelled Bookings</p>
                <p className="text-2xl font-bold text-main-text mt-1">{stats?.cancelled_bookings ?? 0}</p>
              </div>
              <div className="rounded-xl bg-warning/5 border border-warning/10 p-4">
                <div className="flex items-center gap-2">
                  <HiOutlineExclamationTriangle className="w-4 h-4 text-warning" />
                  <p className="text-xs font-medium text-warning">Open Complaints</p>
                </div>
                <p className="text-2xl font-bold text-main-text mt-1">{openComplaints}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">User Growth</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : userGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} name="Users" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No user growth data yet" />
          )}
        </div>

        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Host Growth</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : hostGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hostGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="hosts" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} name="Hosts" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No host growth data yet" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Property Types</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : propertyTypeDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={propertyTypeDist} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="count" nameKey="type"
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
                  {propertyTypeDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No property data yet" />
          )}
        </div>

        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Booking Status</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : bookingStatusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bookingStatusDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {bookingStatusDist.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No booking data yet" />
          )}
        </div>

        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Reviews by Rating</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-divider rounded-xl" />
          ) : reviewAnalytics.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reviewAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="rating" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
                <Bar dataKey="count" name="Reviews" radius={[6, 6, 0, 0]}>
                  {reviewAnalytics.map((entry, i) => <Cell key={i} fill={COLORS[entry.rating - 1] || COLORS[0]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No review data yet" />
          )}
        </div>
      </div>

      {complaintData.length > 0 && (
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Complaint Overview</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={complaintData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {complaintData.map((_, i) => <Cell key={i} fill={i === 0 ? '#F59E0B' : '#22C55E'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main-text">Recent Bookings</h2>
            <span className="text-xs text-secondary-text bg-divider px-2.5 py-1 rounded-full">{bookings.length} total</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-divider rounded-lg animate-pulse" />)}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Guest</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Property</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Host</th>
                    <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Check-in</th>
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
            <h2 className="text-lg font-semibold text-main-text">Pending Host Approvals</h2>
            {pendingHosts.length > 0 && (
              <span className="text-xs text-warning font-medium bg-warning/10 px-2.5 py-1 rounded-full">{pendingHosts.length} pending</span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-divider rounded-xl animate-pulse" />)}
            </div>
          ) : pendingHosts.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {pendingHosts.map((h, i) => (
                <PendingHostCard key={i} host={h} onApprove={handleApproveHost} onReject={handleRejectHost} processing={processing} />
              ))}
            </div>
          ) : (
            <EmptyState message="No pending host approvals" />
          )}
        </div>
      </div>
    </div>
  )
}
