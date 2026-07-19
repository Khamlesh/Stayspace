import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineArrowPath,
  HiOutlineEyeSlash,
  HiOutlineEye,
  HiOutlineFunnel,
} from 'react-icons/hi2'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    rating: '',
    date_from: '',
    date_to: '',
    report_status: '',
    property_id: '',
    guest_name: '',
    host_name: '',
  })

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filters.rating) params.rating = filters.rating
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.report_status) params.report_status = filters.report_status
      if (filters.property_id) params.property_id = filters.property_id
      if (filters.guest_name) params.guest_name = filters.guest_name
      if (filters.host_name) params.host_name = filters.host_name

      const [reviewsRes, analyticsRes] = await Promise.all([
        adminAPI.getReviews(params),
        adminAPI.getReviewAnalytics(),
      ])
      if (reviewsRes.data.status === 'success') setReviews(reviewsRes.data.data || [])
      if (analyticsRes.data.status === 'success') setAnalytics(analyticsRes.data.data || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleHide = async (reviewId) => {
    setDeletingId(reviewId)
    try {
      await adminAPI.hideReview(reviewId)
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_hidden: 1 } : r))
      setConfirmAction(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hide review')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRestore = async (reviewId) => {
    setDeletingId(reviewId)
    try {
      await adminAPI.restoreReview(reviewId)
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_hidden: 0 } : r))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore review')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId)
    try {
      await adminAPI.deleteReview(reviewId)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      setConfirmAction(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  const applyFilters = () => {
    loadReviews()
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({ rating: '', date_from: '', date_to: '', report_status: '', property_id: '', guest_name: '', host_name: '' })
    setSearch('')
    setTimeout(() => loadReviews(), 100)
  }

  const filtered = useMemo(() => {
    if (!search) return reviews
    const q = search.toLowerCase()
    return reviews.filter(r =>
      r.guest_name?.toLowerCase().includes(q) ||
      r.property_title?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      r.host_name?.toLowerCase().includes(q)
    )
  }, [reviews, search])

  const stats = useMemo(() => {
    const total = analytics?.total_reviews || reviews.length
    const avgRating = analytics?.platform_rating || (reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0)
    const fiveStar = analytics?.positive_count || reviews.filter(r => r.rating === 5).length
    const oneStar = analytics?.negative_count || reviews.filter(r => r.rating === 1).length
    return { total, avgRating, fiveStar, oneStar }
  }, [reviews, analytics])

  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map(rating => ({
      rating: `${rating} Star`,
      count: reviews.filter(r => r.rating === rating).length,
    }))
  }, [reviews])

  const maxCount = useMemo(() => Math.max(...distribution.map(d => d.count), 1), [distribution])

  const activeFilterCount = Object.values(filters).filter(v => v).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Reviews Management</h1>
          <p className="text-sm text-secondary-text mt-1">Monitor and moderate all guest reviews across properties</p>
        </div>
        <button
          onClick={loadReviews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Reviews" value={loading ? '...' : stats.total} tone="gray" />
        <StatCard label="Average Rating" value={loading ? '...' : Number(stats.avgRating).toFixed(1)} tone="amber" />
        <StatCard label="5-Star Reviews" value={loading ? '...' : stats.fiveStar} tone="emerald" />
        <StatCard label="1-Star Reviews" value={loading ? '...' : stats.oneStar} tone="red" />
      </div>

      {analytics?.reviews_this_month !== undefined && (
        <div className="dashboard-card p-4">
          <p className="text-sm text-secondary-text">Reviews this month: <span className="font-bold text-main-text">{analytics.reviews_this_month}</span></p>
        </div>
      )}

      <div className="dashboard-card">
        <h2 className="text-sm font-semibold text-secondary-text mb-4">Rating Distribution</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-14 bg-divider rounded animate-pulse" />
                <div className="flex-1 h-4 bg-divider rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#FF385C" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {analytics?.most_reviewed_properties && analytics.most_reviewed_properties.length > 0 && (
        <div className="dashboard-card">
          <h2 className="text-sm font-semibold text-secondary-text mb-3">Most Reviewed Properties</h2>
          <div className="space-y-2">
            {analytics.most_reviewed_properties.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-divider last:border-0">
                <span className="text-sm font-medium text-main-text truncate">{p.title}</span>
                <span className="text-sm text-secondary-text">{p.review_count} reviews</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by guest name, property, comment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-divider text-secondary-text hover:bg-divider'
          }`}
        >
          <HiOutlineFunnel className="w-4 h-4" />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {showFilters && (
        <div className="dashboard-card p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Rating</label>
              <select value={filters.rating} onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))} className="input-field text-sm">
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Report Status</label>
              <select value={filters.report_status} onChange={e => setFilters(f => ({ ...f, report_status: e.target.value }))} className="input-field text-sm">
                <option value="">All</option>
                <option value="pending">Pending Reports</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Date From</label>
              <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Date To</label>
              <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Guest Name</label>
              <input type="text" value={filters.guest_name} onChange={e => setFilters(f => ({ ...f, guest_name: e.target.value }))} className="input-field text-sm" placeholder="Guest name..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Host Name</label>
              <input type="text" value={filters.host_name} onChange={e => setFilters(f => ({ ...f, host_name: e.target.value }))} className="input-field text-sm" placeholder="Host name..." />
            </div>
            <div className="flex gap-2 items-end">
              <button onClick={applyFilters} className="btn-primary text-sm flex-1">Apply</button>
              <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-secondary-text border border-divider rounded-xl hover:bg-divider transition-colors">Clear</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="dashboard-card animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-divider" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-divider rounded mb-2" />
                  <div className="h-3 w-40 bg-divider rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-divider rounded" />
                <div className="h-3 w-3/4 bg-divider rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onHide={() => setConfirmAction({ type: 'hide', review })}
              onRestore={() => handleRestore(review.id)}
              onDelete={() => setConfirmAction({ type: 'delete', review })}
              deletingId={deletingId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 dashboard-card">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-secondary-text font-medium">No reviews found</p>
          <p className="text-sm text-secondary-text mt-1">
            {search || activeFilterCount > 0 ? 'Try adjusting your filters' : 'Reviews will appear here once guests leave feedback'}
          </p>
        </div>
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-4 ${
              confirmAction.type === 'delete' ? 'bg-red-100' : confirmAction.type === 'hide' ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
              {confirmAction.type === 'delete' ? (
                <HiOutlineTrash className="h-6 w-6 text-red-600" />
              ) : confirmAction.type === 'hide' ? (
                <HiOutlineEyeSlash className="h-6 w-6 text-amber-600" />
              ) : (
                <HiOutlineEye className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <h2 className="text-lg font-bold text-main-text text-center">
              {confirmAction.type === 'delete' ? 'Delete Review' : confirmAction.type === 'hide' ? 'Hide Review' : 'Restore Review'}
            </h2>
            <p className="text-sm text-secondary-text text-center mt-2">
              {confirmAction.type === 'delete' && `Are you sure you want to permanently delete this review by ${confirmAction.review.guest_name}? This cannot be undone.`}
              {confirmAction.type === 'hide' && `This review will be hidden from public view. You can restore it later.`}
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-lg border border-divider px-4 py-2.5 text-sm font-medium text-secondary-text hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'delete') handleDelete(confirmAction.review.id)
                  else if (confirmAction.type === 'hide') handleHide(confirmAction.review.id)
                }}
                disabled={deletingId === confirmAction.review.id}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {deletingId === confirmAction.review.id ? 'Processing...' : confirmAction.type === 'delete' ? 'Delete' : 'Hide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const tones = {
    gray: 'bg-gray-50 text-gray-600 ring-gray-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
  }
  return (
    <div className="dashboard-card p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ring-1 ${tones[tone]}`}>
        <HiOutlineStar className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-secondary-text">{label}</p>
        <p className="text-lg font-bold text-main-text">{value}</p>
      </div>
    </div>
  )
}

function ReviewCard({ review, onHide, onRestore, onDelete, deletingId }) {
  const stars = Number(review.rating || 0)
  const isHidden = review.is_hidden === 1

  return (
    <div className={`dashboard-card flex flex-col h-full ${isHidden ? 'opacity-60 border-amber-200 bg-amber-50/30' : ''}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <HiOutlineChatBubbleOvalLeftEllipsis className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-main-text truncate">{review.guest_name || 'Anonymous'}</p>
          <p className="text-xs text-secondary-text truncate">{review.guest_email}</p>
        </div>
        {isHidden && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
            <HiOutlineEyeSlash className="w-3 h-3" /> Hidden
          </span>
        )}
      </div>

      {review.property_title && (
        <p className="text-xs font-medium text-primary mb-2 truncate">{review.property_title}</p>
      )}

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(i => (
          <HiOutlineStar
            key={i}
            className={`w-4 h-4 ${i <= Math.round(stars) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-xs font-semibold text-main-text">{stars.toFixed(1)}</span>
      </div>

      {review.title && <p className="text-sm font-semibold text-main-text mb-1">{review.title}</p>}
      {review.comment && <p className="text-sm text-secondary-text leading-relaxed mb-3 line-clamp-4">{review.comment}</p>}

      {(review.cleanliness_rating || review.location_rating || review.communication_rating || review.amenities_rating || review.value_rating) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { key: 'cleanliness_rating', label: 'Clean' },
            { key: 'location_rating', label: 'Location' },
            { key: 'communication_rating', label: 'Comm' },
            { key: 'amenities_rating', label: 'Amenities' },
            { key: 'value_rating', label: 'Value' },
          ].map(cat => (
            review[cat.key] ? (
              <span key={cat.key} className="text-[11px] text-secondary-text bg-background px-2 py-0.5 rounded-full">
                {cat.label}: {review[cat.key]}★
              </span>
            ) : null
          ))}
        </div>
      )}

      {review.host_name && (
        <p className="text-xs text-secondary-text mb-1">Host: {review.host_name}</p>
      )}

      {review.host_reply && (
        <div className="p-2 bg-slate-50 rounded-lg border-l-3 border-primary mb-3">
          <p className="text-[11px] font-semibold text-primary mb-0.5">Host Reply</p>
          <p className="text-xs text-secondary-text">{review.host_reply}</p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-divider">
        <span className="text-xs text-secondary-text">{formatDate(review.created_at || review.date)}</span>
        <div className="flex gap-1.5">
          {isHidden ? (
            <button
              onClick={onRestore}
              disabled={deletingId === review.id}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <HiOutlineEye className="h-3.5 w-3.5" /> Restore
            </button>
          ) : (
            <button
              onClick={onHide}
              disabled={deletingId === review.id}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <HiOutlineEyeSlash className="h-3.5 w-3.5" /> Hide
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={deletingId === review.id}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <HiOutlineTrash className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}
