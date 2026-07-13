import { useState, useEffect } from 'react'
import adminAPI from '../../api/adminApi'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineChartBar, HiOutlineClock, HiOutlineBuildingOffice2,
  HiOutlineUserGroup, HiOutlineStar, HiOutlineCurrencyRupee
} from 'react-icons/hi2'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#FF385C', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']

function ChartSkeleton({ height = 280 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 mb-2">
        <div className="h-4 w-20 bg-divider rounded animate-pulse" />
        <div className="h-4 w-20 bg-divider rounded animate-pulse" />
      </div>
      <div className="h-8 flex items-end gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-divider rounded-t animate-pulse"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-divider rounded animate-pulse" style={{ flex: j === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-divider flex items-center justify-center mb-3">
        <HiOutlineChartBar className="w-7 h-7 text-secondary-text" />
      </div>
      <p className="text-sm text-secondary-text">{message}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-divider shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-main-text mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-secondary-text">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.name === 'Revenue' || entry.name === 'earnings' ? formatRupees(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-divider shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-main-text">{payload[0].name}</p>
      <p className="text-secondary-text">
        Count: <span className="font-medium text-main-text">{payload[0].value}</span>
      </p>
      {payload[0].payload?.percentage !== undefined && (
        <p className="text-secondary-text">
          Share: <span className="font-medium text-main-text">{payload[0].payload.percentage}%</span>
        </p>
      )}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getAnalytics()
      if (res.data.status === 'success') {
        setAnalytics(res.data.data)
      }
    } catch (e) {
      console.error('Analytics load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const monthlyData = analytics?.monthly_data || []
  const propertyTypeData = analytics?.property_type_distribution || []
  const bookingStatusData = analytics?.booking_status_distribution || []
  const dailyBookings = analytics?.daily_bookings || []
  const topHosts = analytics?.top_hosts || []
  const topProperties = analytics?.top_properties || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Analytics</h1>
          <p className="text-sm text-secondary-text mt-1">Detailed platform analytics and insights</p>
        </div>
        <button onClick={loadAnalytics} className="btn-outline text-sm">
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="dashboard-card">
                <div className="h-5 w-40 bg-divider rounded animate-pulse mb-4" />
                <ChartSkeleton />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="dashboard-card">
                <div className="h-5 w-40 bg-divider rounded animate-pulse mb-4" />
                <ChartSkeleton height={200} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="dashboard-card">
                <div className="h-5 w-40 bg-divider rounded animate-pulse mb-4" />
                <TableSkeleton rows={5} cols={4} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-main-text">Monthly Revenue & Bookings</h2>
                <HiOutlineChartBar className="w-5 h-5 text-secondary-text" />
              </div>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#FF385C" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="bookings" name="Bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No monthly data available" />
              )}
            </div>

            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-main-text">Daily Bookings</h2>
                <HiOutlineClock className="w-5 h-5 text-secondary-text" />
              </div>
              {dailyBookings.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyBookings}>
                    <defs>
                      <linearGradient id="colorDailyBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#22C55E" strokeWidth={2.5} fill="url(#colorDailyBookings)" dot={{ r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No daily bookings data available" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-main-text">Property Type Distribution</h2>
                <HiOutlineBuildingOffice2 className="w-5 h-5 text-secondary-text" />
              </div>
              {propertyTypeData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={240}>
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="type"
                      >
                        {propertyTypeData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {propertyTypeData.map((entry, i) => {
                      const total = propertyTypeData.reduce((sum, d) => sum + d.count, 0)
                      const percentage = total > 0 ? ((entry.count / total) * 100).toFixed(1) : 0
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-main-text font-medium truncate">{entry.type}</span>
                              <span className="text-xs text-secondary-text ml-2">{percentage}%</span>
                            </div>
                            <div className="w-full bg-divider rounded-full h-1.5 mt-1">
                              <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState message="No property type data available" />
              )}
            </div>

            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-main-text">Booking Status Distribution</h2>
                <HiOutlineChartBar className="w-5 h-5 text-secondary-text" />
              </div>
              {bookingStatusData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={240}>
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                      >
                        {bookingStatusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {bookingStatusData.map((entry, i) => {
                      const total = bookingStatusData.reduce((sum, d) => sum + d.count, 0)
                      const percentage = total > 0 ? ((entry.count / total) * 100).toFixed(1) : 0
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-main-text font-medium truncate">{entry.status}</span>
                              <span className="text-xs text-secondary-text ml-2">{percentage}%</span>
                            </div>
                            <div className="w-full bg-divider rounded-full h-1.5 mt-1">
                              <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState message="No booking status data available" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-main-text">Top Hosts</h2>
                <HiOutlineUserGroup className="w-5 h-5 text-secondary-text" />
                {topHosts.length > 0 && (
                  <span className="text-xs text-secondary-text bg-divider px-2.5 py-1 rounded-full">{topHosts.length} hosts</span>
                )}
              </div>
              {topHosts.length > 0 ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Name</th>
                        <th className="text-center text-xs font-semibold text-secondary-text py-2 px-4">Properties</th>
                        <th className="text-center text-xs font-semibold text-secondary-text py-2 px-4">Bookings</th>
                        <th className="text-right text-xs font-semibold text-secondary-text py-2 px-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topHosts.map((host, i) => (
                        <tr key={i} className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-semibold text-xs">{(host.name || 'H').charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-main-text truncate">{host.name}</p>
                                <p className="text-xs text-secondary-text truncate">{host.email || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-secondary-text" />
                              <span className="text-sm text-main-text font-medium">{host.properties ?? 0}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <HiOutlineChartBar className="w-3.5 h-3.5 text-secondary-text" />
                              <span className="text-sm text-main-text font-medium">{host.bookings ?? 0}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-semibold text-main-text">{formatRupees(host.revenue ?? 0)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No host data available" />
              )}
            </div>

            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-main-text">Top Properties</h2>
                <HiOutlineBuildingOffice2 className="w-5 h-5 text-secondary-text" />
                {topProperties.length > 0 && (
                  <span className="text-xs text-secondary-text bg-divider px-2.5 py-1 rounded-full">{topProperties.length} properties</span>
                )}
              </div>
              {topProperties.length > 0 ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full min-w-[550px]">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Title</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Address</th>
                        <th className="text-center text-xs font-semibold text-secondary-text py-2 px-4">Bookings</th>
                        <th className="text-center text-xs font-semibold text-secondary-text py-2 px-4">Rating</th>
                        <th className="text-right text-xs font-semibold text-secondary-text py-2 px-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProperties.map((prop, i) => (
                        <tr key={i} className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-main-text truncate max-w-[160px]">{prop.title}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-secondary-text truncate max-w-[140px]">{prop.address || '-'}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm text-main-text font-medium">{prop.bookings ?? 0}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <HiOutlineStar className="w-3.5 h-3.5 text-warning fill-warning" />
                              <span className="text-sm font-medium text-main-text">{prop.rating != null ? Number(prop.rating).toFixed(1) : '-'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-semibold text-main-text">{formatRupees(prop.revenue ?? 0)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No property data available" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
