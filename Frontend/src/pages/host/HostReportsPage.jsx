import { useState, useEffect } from 'react'
import hostAPI from '../../api/hostApi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { HiOutlineChartBar } from 'react-icons/hi2'

const COLORS = ['#FF385C', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']

export default function HostReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hostAPI.getReports()
      .then(res => {
        if (res.data.status === 'success') setData(res.data.data)
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-divider rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-72 bg-divider rounded-card animate-pulse" />)}
        </div>
      </div>
    )
  }

  const revenueByMonth = data?.revenue_by_month || []
  const byProperty = data?.by_property || []

  const pieData = byProperty.map(p => ({ name: p.title, value: p.revenue }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Reports</h1>
        <p className="text-sm text-secondary-text mt-1">Analytics and performance insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Revenue by Month</h2>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#FF385C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-secondary-text text-sm">No revenue data</p>
          )}
        </div>

        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Revenue by Property</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-secondary-text text-sm">No property data</p>
          )}
          {pieData.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-secondary-text">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {byProperty.length > 0 && (
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Property Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Property</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Bookings</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Revenue</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Avg Rating</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {byProperty.map((p, i) => (
                  <tr key={i} className="border-b border-divider last:border-0">
                    <td className="py-2.5 px-3 text-sm font-medium text-main-text">{p.title}</td>
                    <td className="py-2.5 px-3 text-sm text-secondary-text">{p.total_bookings}</td>
                    <td className="py-2.5 px-3 text-sm font-semibold text-success">₹{Number(p.revenue).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-sm text-secondary-text">{p.avg_rating} ★</td>
                    <td className="py-2.5 px-3 text-sm text-secondary-text">{p.review_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
