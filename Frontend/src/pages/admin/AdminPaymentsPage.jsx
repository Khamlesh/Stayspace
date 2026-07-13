import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUserCircle,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineCurrencyRupee,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
} from 'react-icons/hi2'

const TABS = ['All', 'Success', 'Failed']

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getPayments()
      if (res.data.status === 'success') setPayments(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        p.guest_name?.toLowerCase().includes(q) ||
        p.property_title?.toLowerCase().includes(q) ||
        p.transaction_id?.toLowerCase().includes(q)
      const matchTab =
        activeTab === 'All' ||
        (activeTab === 'Success' && p.status === 'Success') ||
        (activeTab === 'Failed' && p.status === 'Failed')
      return matchSearch && matchTab
    })
  }, [payments, search, activeTab])

  const stats = useMemo(() => {
    const totalRevenue = payments
      .filter((p) => p.status === 'Success')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    return {
      totalRevenue,
      successful: payments.filter((p) => p.status === 'Success').length,
      failed: payments.filter((p) => p.status === 'Failed').length,
    }
  }, [payments])

  const tabCounts = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      acc[tab] =
        tab === 'All'
          ? payments.length
          : payments.filter((p) => p.status === tab).length
      return acc
    }, {})
  }, [payments])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Payments</h1>
          <p className="text-sm text-secondary-text mt-1">
            View all platform payment transactions
          </p>
        </div>
        <button
          onClick={loadPayments}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="dashboard-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200">
            <HiOutlineBanknotes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-text">Total Revenue</p>
            <p className="text-lg font-bold text-main-text">{formatRupees(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="dashboard-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg ring-1 bg-sky-50 text-sky-600 ring-sky-200">
            <HiOutlineCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-text">Successful Payments</p>
            <p className="text-lg font-bold text-main-text">{stats.successful}</p>
          </div>
        </div>
        <div className="dashboard-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg ring-1 bg-red-50 text-red-600 ring-red-200">
            <HiOutlineXCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-text">Failed Payments</p>
            <p className="text-lg font-bold text-main-text">{stats.failed}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by guest, property, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                ${activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-divider text-secondary-text hover:bg-border'
                }`}
            >
              {tab} ({tabCounts[tab] || 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="overflow-x-auto dashboard-card">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-divider">
                {['ID', 'Guest', 'Property', 'Dates', 'Amount', 'Method', 'Transaction ID', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-divider">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-divider rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto dashboard-card">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-divider">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Payment ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Transaction ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-divider hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-primary">#{p.id}</span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <HiOutlineUserCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-main-text truncate">{p.guest_name}</p>
                        <p className="text-xs text-secondary-text truncate">{p.guest_email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-main-text truncate">{p.property_title}</p>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-main-text">{formatDate(p.check_in)} → {formatDate(p.check_out)}</p>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-main-text">{formatRupees(p.amount)}</span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineCreditCard className="w-4 h-4 text-secondary-text flex-shrink-0" />
                      <span className="text-sm text-main-text">{p.payment_method || 'N/A'}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-xs text-secondary-text font-mono">{p.transaction_id || 'N/A'}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                        p.status === 'Success'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-red-50 text-red-700 ring-red-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-secondary-text">{formatDate(p.created_at || p.date)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 dashboard-card">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-secondary-text font-medium">No payments found</p>
          <p className="text-sm text-secondary-text mt-1">
            {search ? 'Try a different search term' : 'Payments will appear here once transactions are made'}
          </p>
        </div>
      )}
    </div>
  )
}
