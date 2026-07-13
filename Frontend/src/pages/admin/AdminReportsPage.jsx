import { useState, useEffect } from 'react'
import adminAPI from '../../api/adminApi'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineChartBar, HiOutlineUserGroup, HiOutlineBuildingOffice2,
  HiOutlineDocumentText, HiOutlineArrowPath
} from 'react-icons/hi2'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#FF385C', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']

function SectionSkeleton({ rows = 4 }) {
  return (
    <div className="dashboard-card animate-pulse">
      <div className="h-5 w-40 bg-divider rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-divider rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="dashboard-card animate-pulse">
      <div className="h-5 w-48 bg-divider rounded mb-4" />
      <div className="h-64 bg-divider rounded-xl" />
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-divider flex items-center justify-center mb-3">
        <HiOutlineDocumentText className="w-7 h-7 text-secondary-text" />
      </div>
      <p className="text-sm text-secondary-text">{message}</p>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-divider rounded-xl px-3 py-2 shadow-sm">
        <p className="text-xs font-medium text-main-text">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs text-secondary-text">
            <span style={{ color: entry.color }}>&#9679;</span>{' '}
            {entry.name}: {entry.name === 'Revenue' || entry.name === 'revenue' ? formatRupees(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getReports()
      if (res.data.status === 'success') {
        setData(res.data.data)
      }
    } catch (e) {
      console.error('Failed to load reports:', e)
    } finally {
      setLoading(false)
    }
  }

  const revenueByMonth = data?.revenue_by_month || []
  const revenueByType = data?.revenue_by_property_type || []
  const hostPerformance = data?.host_performance || []
  const guestActivity = data?.guest_activity || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Reports</h1>
          <p className="text-sm text-secondary-text mt-1">Comprehensive platform analytics and performance data</p>
        </div>
        <button onClick={loadReports} className="btn-outline text-sm flex items-center gap-2">
          <HiOutlineArrowPath className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineChartBar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-main-text">Revenue by Month</h2>
              </div>
              {revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#FF385C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No revenue data available" />
              )}
            </div>

            <div className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineBuildingOffice2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-main-text">Revenue by Property Type</h2>
              </div>
              {revenueByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="revenue"
                      nameKey="property_type"
                      paddingAngle={3}
                    >
                      {revenueByType.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }}
                      formatter={(value) => formatRupees(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No property type data available" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineUserGroup className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-main-text">Host Performance</h2>
              </div>
              {hostPerformance.length > 0 ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Name</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Properties</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Bookings</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Avg Rating</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostPerformance.map((host, i) => (
                        <tr key={i} className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-semibold text-xs">{(host.name || 'H').charAt(0)}</span>
                              </div>
                              <span className="text-sm font-medium text-main-text">{host.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-text">{host.properties ?? 0}</td>
                          <td className="py-3 px-4 text-sm text-secondary-text">{host.bookings ?? 0}</td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-main-text">
                              {host.avg_rating != null ? Number(host.avg_rating).toFixed(1) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-main-text">{formatRupees(host.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No host performance data available" />
              )}
            </div>

            <div className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineUserGroup className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-main-text">Guest Activity</h2>
              </div>
              {guestActivity.length > 0 ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Name</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Email</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Total Bookings</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Total Spent</th>
                        <th className="text-left text-xs font-semibold text-secondary-text py-2 px-4">Reviews Written</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestActivity.map((guest, i) => (
                        <tr key={i} className="border-b border-divider last:border-0 hover:bg-background/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-info font-semibold text-xs">{(guest.name || 'G').charAt(0)}</span>
                              </div>
                              <span className="text-sm font-medium text-main-text">{guest.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-text">{guest.email}</td>
                          <td className="py-3 px-4 text-sm text-secondary-text">{guest.total_bookings ?? 0}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-main-text">{formatRupees(guest.total_spent)}</td>
                          <td className="py-3 px-4 text-sm text-secondary-text">{guest.reviews_written ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No guest activity data available" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
