import { useState, useEffect } from 'react'
import hostAPI from '../../api/hostApi'
import { HiOutlineStar, HiOutlineChatBubbleOvalLeftEllipsis } from 'react-icons/hi2'

function StarRating({ rating, size = 'w-5 h-5' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <HiOutlineStar
          key={star}
          className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-divider'}`}
        />
      ))}
    </div>
  )
}

function CategoryBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-secondary-text w-32">{label}</span>
      <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden">
        <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-main-text w-8 text-right">{Number(value).toFixed(1)}</span>
    </div>
  )
}

function ReplyModal({ review, onClose, onReply }) {
  const [reply, setReply] = useState(review.host_reply || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return setError('Reply cannot be empty')
    setSubmitting(true)
    try {
      await onReply(review.id, reply)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-main-text">Reply to {review.guest_name}</h2>
            <button onClick={onClose} className="text-secondary-text hover:text-main-text p-1 rounded-lg hover:bg-divider transition-colors">✕</button>
          </div>

          <div className="mb-4 p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-main-text">{review.guest_name}</span>
              <StarRating rating={review.rating} size="w-3.5 h-3.5" />
            </div>
            <p className="text-sm text-secondary-text">{review.comment}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-main-text mb-1.5">Your Reply</label>
              <textarea
                rows={4}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a professional reply to the guest..."
                maxLength={1000}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-divider bg-secondary text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              />
              <p className="text-xs text-secondary-text mt-1 text-right">{reply.length}/1000</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-secondary-text bg-divider hover:bg-border rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-50">{submitting ? 'Sending...' : review.host_reply ? 'Update Reply' : 'Send Reply'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function HostReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyModal, setReplyModal] = useState(null)
  const [sortOrder, setSortOrder] = useState('newest')

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await hostAPI.getRecentReviews()
      if (res.data.status === 'success') {
        const data = res.data.data
        if (data?.reviews) {
          setReviews(data.reviews)
          setAnalytics(data.analytics)
        } else {
          setReviews(data || [])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (reviewId, reply) => {
    await hostAPI.replyToReview({ review_id: reviewId, reply })
    loadReviews()
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortOrder) {
      case 'newest': return new Date(b.created_at) - new Date(a.created_at)
      case 'highest': return b.rating - a.rating
      case 'lowest': return a.rating - b.rating
      default: return 0
    }
  })

  const avgRating = analytics?.avg_rating || (reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0')

  const totalReviews = analytics?.total_reviews || reviews.length

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }))

  const categoryAverages = analytics?.category_averages || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Reviews</h1>
        <p className="text-sm text-secondary-text mt-1">Guest feedback on your properties</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-divider rounded-card animate-pulse" />)}
          </div>
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-divider rounded-card animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="dashboard-card text-center">
              <p className="text-4xl font-bold text-main-text">{avgRating}</p>
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <HiOutlineStar key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-divider'}`} />
                ))}
              </div>
              <p className="text-xs text-secondary-text">{totalReviews} reviews</p>
            </div>
            <div className="sm:col-span-2 dashboard-card">
              <div className="space-y-2">
                {ratingDistribution.map(d => (
                  <div key={d.star} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-secondary-text w-8">{d.star} ★</span>
                    <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs text-secondary-text w-8 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {Object.keys(categoryAverages).length > 0 && (
            <div className="dashboard-card">
              <h2 className="text-sm font-semibold text-secondary-text mb-3">Category Averages</h2>
              <div className="space-y-2.5">
                {[
                  { key: 'cleanliness', label: 'Cleanliness' },
                  { key: 'location', label: 'Location' },
                  { key: 'communication', label: 'Communication' },
                  { key: 'amenities', label: 'Amenities' },
                  { key: 'value', label: 'Value for Money' },
                ].map(cat => (
                  categoryAverages[cat.key] ? (
                    <CategoryBar key={cat.key} label={cat.label} value={categoryAverages[cat.key]} />
                  ) : null
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-main-text">All Reviews</h2>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="input-field text-sm py-1.5 px-3"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          <div className="space-y-3">
            {sortedReviews.map((r, i) => (
              <div key={i} className="dashboard-card p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">{(r.guest_name || 'G').charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-main-text">{r.guest_name}</span>
                      <StarRating rating={r.rating} size="w-3.5 h-3.5" />
                      <span className="text-xs text-secondary-text ml-auto">{r.created_at?.split(' ')[0]}</span>
                    </div>
                    {r.title && <p className="text-sm font-semibold text-main-text mb-1">{r.title}</p>}
                    <p className="text-sm text-secondary-text mb-2">{r.comment}</p>
                    {(r.cleanliness_rating || r.location_rating || r.communication_rating || r.amenities_rating || r.value_rating) && (
                      <div className="flex flex-wrap gap-3 mb-2">
                        {[
                          { key: 'cleanliness_rating', label: 'Clean' },
                          { key: 'location_rating', label: 'Location' },
                          { key: 'communication_rating', label: 'Communication' },
                          { key: 'amenities_rating', label: 'Amenities' },
                          { key: 'value_rating', label: 'Value' },
                        ].map(cat => (
                          r[cat.key] ? (
                            <span key={cat.key} className="text-xs text-secondary-text">
                              {cat.label}: <span className="font-medium text-main-text">{r[cat.key]}★</span>
                            </span>
                          ) : null
                        ))}
                      </div>
                    )}
                    {r.verified_stay === 1 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
                        ✓ Verified Stay
                      </span>
                    )}
                    <p className="text-xs text-secondary-text mb-2">Property: {r.property_title}</p>
                    {r.host_reply ? (
                      <div className="p-3 bg-slate-50 rounded-xl border-l-3 border-primary mt-2">
                        <p className="text-xs font-semibold text-primary mb-1">Your Reply</p>
                        <p className="text-xs text-secondary-text">{r.host_reply}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyModal(r)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 mt-2"
                      >
                        <HiOutlineChatBubbleOvalLeftEllipsis className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length === 0 && (
            <div className="text-center py-16 dashboard-card">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-secondary-text font-medium">No reviews yet</p>
              <p className="text-sm text-secondary-text mt-1">Reviews will appear here once guests leave feedback</p>
            </div>
          )}
        </>
      )}

      {replyModal && (
        <ReplyModal review={replyModal} onClose={() => setReplyModal(null)} onReply={handleReply} />
      )}
    </div>
  )
}
