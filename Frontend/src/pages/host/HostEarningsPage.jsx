import { useState, useEffect } from 'react'
import hostAPI from '../../api/hostApi'
import { HiOutlineCurrencyRupee, HiOutlineArrowUpRight, HiOutlineArrowDownRight } from 'react-icons/hi2'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function HostEarningsPage() {
  const [earnings, setEarnings] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      hostAPI.getEarnings(),
      hostAPI.getMonthlyEarnings()
    ])
      .then(([earnRes, chartRes]) => {
        if (earnRes.status === 'fulfilled' && earnRes.value.data.status === 'success') {
          setEarnings(earnRes.value.data.data)
        }
        if (chartRes.status === 'fulfilled' && chartRes.value.data.status === 'success') {
          setChartData(chartRes.value.data.data || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-divider rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-divider rounded-card animate-pulse" />)}
        </div>
        <div className="h-72 bg-divider rounded-card animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Earnings</h1>
        <p className="text-sm text-secondary-text mt-1">Track your revenue and payment history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
              <HiOutlineCurrencyRupee className="w-5 h-5 text-success" />
            </div>
            <span className="text-xs font-medium text-secondary-text">This Month</span>
          </div>
          <p className="text-2xl font-bold text-main-text">₹{Number(earnings?.this_month || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center">
              <HiOutlineCurrencyRupee className="w-5 h-5 text-info" />
            </div>
            <span className="text-xs font-medium text-secondary-text">This Year</span>
          </div>
          <p className="text-2xl font-bold text-main-text">₹{Number(earnings?.this_year || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HiOutlineCurrencyRupee className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-secondary-text">All Time</span>
          </div>
          <p className="text-2xl font-bold text-main-text">₹{Number(earnings?.total_earnings || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="dashboard-card">
        <h2 className="text-lg font-semibold text-main-text mb-4">Monthly Revenue</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Bar dataKey="earnings" fill="#FF385C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center py-12 text-secondary-text text-sm">No earnings data yet</p>
        )}
      </div>

      {earnings?.recent_payments?.length > 0 && (
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-main-text mb-4">Recent Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Property</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Method</th>
                  <th className="text-left text-xs font-semibold text-secondary-text py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {earnings.recent_payments.map((p, i) => (
                  <tr key={i} className="border-b border-divider last:border-0">
                    <td className="py-2.5 px-3 text-sm text-main-text">{p.title}</td>
                    <td className="py-2.5 px-3 text-sm font-semibold text-success">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-sm text-secondary-text">{p.payment_method}</td>
                    <td className="py-2.5 px-3 text-sm text-secondary-text">{p.created_at?.split(' ')[0]}</td>
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
