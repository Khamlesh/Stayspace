import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ratingColors = {
  5: 'bg-emerald-500',
  4: 'bg-green-400',
  3: 'bg-amber-400',
  2: 'bg-orange-400',
  1: 'bg-red-400',
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getReviews()
      if (res.data.status === 'success') setReviews(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId)
    try {
      await adminAPI.deleteReview(reviewId)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      setConfirmDelete(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const q = search.toLowerCase()
      return (
        !search ||
        r.guest_name?.toLowerCase().includes(q) ||
        r.property_title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      )
    })
  }, [reviews, search])

  const stats = useMemo(() => {
    const total = reviews.length
    const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total : 0
    const fiveStar = reviews.filter((r) => r.rating === 5).length
    const oneStar = reviews.filter((r) => r.rating === 1).length
    return { total, avgRating, fiveStar, oneStar }
  }, [reviews])

  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating: `${rating} Star`,
      count: reviews.filter((r) => r.rating === rating).length,
    }))
  }, [reviews])

  const maxCount = useMemo(() => Math.max(...distribution.map((d) => d.count), 1), [distribution])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Reviews Management</h1>
          <p className="text-sm text-secondary-text mt-1">
            Monitor and manage all guest reviews across properties
          </p>
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
        <StatCard label="Average Rating" value={loading ? '...' : stats.avgRating.toFixed(1)} tone="amber" />
        <StatCard label="5-Star Reviews" value={loading ? '...' : stats.fiveStar} tone="emerald" />
        <StatCard label="1-Star Reviews" value={loading ? '...' : stats.oneStar} tone="red" />
      </div>

      <div className="dashboard-card">
        <h2 className="text-sm font-semibold text-secondary-text mb-4">Rating Distribution</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-14 bg-divider rounded animate-pulse" />
                <div className="flex-1 h-4 bg-divider rounded animate-pulse" />
                <div className="h-4 w-8 bg-divider rounded animate-pulse" />
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
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#FF385C" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by guest name, property, or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="dashboard-card animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-divider" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-divider rounded mb-2" />
                  <div className="h-3 w-40 bg-divider rounded" />
                </div>
              </div>
              <div className="h-3 w-32 bg-divider rounded mb-3" />
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="h-4 w-4 bg-divider rounded" />
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-divider rounded" />
                <div className="h-3 w-3/4 bg-divider rounded" />
              </div>
              <div className="h-3 w-24 bg-divider rounded mt-3" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={() => setConfirmDelete(review)}
              deletingId={deletingId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 dashboard-card">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-secondary-text font-medium">No reviews found</p>
          <p className="text-sm text-secondary-text mt-1">
            {search ? 'Try a different search term' : 'Reviews will appear here once guests leave feedback'}
          </p>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <HiOutlineTrash className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-main-text text-center">Delete Review</h2>
            <p className="text-sm text-secondary-text text-center mt-2">
              Are you sure you want to delete this review by{' '}
              <span className="font-semibold text-main-text">{confirmDelete.guest_name}</span>? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-divider px-4 py-2.5 text-sm font-medium text-secondary-text hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete.id ? 'Deleting...' : 'Delete'}
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

function ReviewCard({ review, onDelete, deletingId }) {
  const stars = Number(review.rating || 0)

  return (
    <div className="dashboard-card flex flex-col h-full">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <HiOutlineChatBubbleOvalLeftEllipsis className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-main-text truncate">{review.guest_name || 'Anonymous'}</p>
          <p className="text-xs text-secondary-text truncate">{review.guest_email}</p>
        </div>
      </div>

      {review.property_title && (
        <p className="text-xs font-medium text-primary mb-2 truncate">{review.property_title}</p>
      )}

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <HiOutlineStar
            key={i}
            className={`w-4 h-4 ${i <= Math.round(stars) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-xs font-semibold text-main-text">{stars.toFixed(1)}</span>
      </div>

      {review.comment && (
        <p className="text-sm text-secondary-text leading-relaxed mb-3 line-clamp-4">{review.comment}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-divider">
        <span className="text-xs text-secondary-text">{formatDate(review.created_at || review.date)}</span>
        <button
          onClick={onDelete}
          disabled={deletingId === review.id}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <HiOutlineTrash className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  )
}
