import { useState, useEffect } from 'react'
import userAPI from '../../api/userApi'
import { formatRupees } from '../../utils/currency'
import { HiOutlineCurrencyRupee, HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCreditCard, HiOutlineClock } from 'react-icons/hi2'

const statusStyles = {
  success: { icon: HiOutlineCheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Success' },
  failed: { icon: HiOutlineXCircle, color: 'text-danger', bg: 'bg-danger/10', label: 'Failed' },
}

function SkeletonCard() {
  return (
    <div className="dashboard-card animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-divider rounded" />
        <div className="h-5 w-16 bg-divider rounded-full" />
      </div>
      <div className="h-3 w-48 bg-divider rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-3 bg-divider rounded" />)}
      </div>
    </div>
  )
}

export default function UserPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    userAPI.getPayments()
      .then(res => {
        if (res.data.status === 'success') {
          setPayments(res.data.data || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    return (
      p.property_title?.toLowerCase().includes(q) ||
      p.transaction_id?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    )
  })

  const successful = payments.filter(p => p.status === 'success')
  const totalSpent = successful.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-divider rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-divider rounded-card animate-pulse" />)}
        </div>
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Payments</h1>
        <p className="text-sm text-secondary-text mt-1">View your payment history and transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
              <HiOutlineCurrencyRupee className="w-5 h-5 text-success" />
            </div>
            <span className="text-xs font-medium text-secondary-text">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-main-text">{formatRupees(totalSpent)}</p>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center">
              <HiOutlineCheckCircle className="w-5 h-5 text-info" />
            </div>
            <span className="text-xs font-medium text-secondary-text">Successful Payments</span>
          </div>
          <p className="text-2xl font-bold text-main-text">{successful.length}</p>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HiOutlineClock className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-secondary-text">Total Payments</span>
          </div>
          <p className="text-2xl font-bold text-main-text">{payments.length}</p>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-main-text">Payment History</h2>
          <div className="sm:ml-auto relative w-full sm:w-72">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
            <input
              type="text"
              placeholder="Search by property or transaction ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-divider bg-secondary text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineCurrencyRupee className="w-12 h-12 text-divider mx-auto mb-3" />
            <p className="text-secondary-text text-sm">No payments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const status = statusStyles[p.status] || statusStyles.failed
              const StatusIcon = status.icon
              const MethodIcon = HiOutlineCreditCard
              return (
                <div key={p.id} className="dashboard-card-hover p-4 rounded-xl border border-divider">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-main-text">#{p.id}</span>
                      <span className="text-sm text-secondary-text truncate max-w-[200px]">{p.property_title}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-secondary-text mb-0.5">Check-in</p>
                      <p className="text-sm text-main-text">{p.check_in || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-text mb-0.5">Check-out</p>
                      <p className="text-sm text-main-text">{p.check_out || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-text mb-0.5">Amount</p>
                      <p className="text-sm font-semibold text-main-text">{formatRupees(p.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-text mb-0.5">Payment Date</p>
                      <p className="text-sm text-main-text">{p.created_at?.split(' ')[0] || '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 pt-3 border-t border-divider">
                    <div className="flex items-center gap-1.5">
                      <MethodIcon className="w-3.5 h-3.5 text-secondary-text" />
                      <span className="text-xs text-secondary-text">{p.payment_method || 'N/A'}</span>
                    </div>
                    <span className="text-divider hidden sm:inline">·</span>
                    <span className="text-xs text-secondary-text font-mono">{p.transaction_id || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
