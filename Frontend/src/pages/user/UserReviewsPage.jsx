import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import userAPI from '../../api/userApi'
import { bookingsAPI } from '../../api/client'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlinePlus,
} from 'react-icons/hi2'

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

function StarInput({ value, onChange, color = 'yellow' }) {
  const [hover, setHover] = useState(0)
  const colorClass = color === 'teal'
    ? { filled: 'text-teal-500 fill-teal-500', empty: 'text-divider' }
    : { filled: 'text-yellow-400 fill-yellow-400', empty: 'text-divider' }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <HiOutlineStar
            className={`w-7 h-7 transition-colors ${
              star <= (hover || value) ? colorClass.filled : colorClass.empty
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="dashboard-card animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-40 bg-divider rounded" />
        <div className="h-5 w-20 bg-divider rounded" />
      </div>
      <div className="h-3 w-full bg-divider rounded" />
      <div className="h-3 w-3/4 bg-divider rounded" />
      <div className="h-3 w-24 bg-divider rounded" />
    </div>
  )
}

const CATEGORIES = [
  { key: 'cleanliness_rating', label: 'Cleanliness' },
  { key: 'location_rating', label: 'Location' },
  { key: 'communication_rating', label: 'Communication' },
  { key: 'amenities_rating', label: 'Amenities' },
  { key: 'value_rating', label: 'Value for Money' },
]

export default function UserReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editReview, setEditReview] = useState(null)
  const [completedBookings, setCompletedBookings] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await userAPI.getReviews()
      if (res.data.status === 'success') setReviews(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadCompletedBookings = async () => {
    try {
      const res = await bookingsAPI.getGuestBookings()
      if (res.data.status === 'success') {
        const completed = (res.data.data || []).filter(b => b.status === 'Completed')
        setCompletedBookings(completed)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    setDeletingId(reviewId)
    try {
      await userAPI.deleteReview(reviewId)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenModal = async () => {
    setEditReview(null)
    await loadCompletedBookings()
    setShowModal(true)
  }

  const handleEdit = (review) => {
    setEditReview(review)
    setShowModal(true)
  }

  const isEditable = (review) => {
    if (!review.created_at) return false
    const created = new Date(review.created_at)
    const now = new Date()
    const diffDays = (now - created) / (1000 * 60 * 60 * 24)
    return diffDays <= 30
  }

  const handleSubmitReview = async (propertyId, data) => {
    try {
      if (editReview) {
        await userAPI.updateReview({ review_id: editReview.id, ...data })
      } else {
        await userAPI.createReview({ property_id: propertyId, ...data })
      }
      setShowModal(false)
      setEditReview(null)
      loadReviews()
    } catch (e) {
      throw e
    }
  }

  const totalReviews = reviews.length
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main-text">My Reviews</h1>
          <p className="text-sm text-secondary-text mt-1">Manage the reviews you have written</p>
        </div>
        <button onClick={handleOpenModal} className="btn-primary inline-flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-divider rounded-card animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="dashboard-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HiOutlinePencilSquare className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-secondary-text">Total Reviews</span>
              </div>
              <p className="text-2xl font-bold text-main-text">{totalReviews}</p>
            </div>
            <div className="dashboard-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <HiOutlineStar className="w-5 h-5 text-yellow-500" />
                </div>
                <span className="text-xs font-medium text-secondary-text">Average Rating</span>
              </div>
              <p className="text-2xl font-bold text-main-text">{avgRating}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-main-text mb-4">Reviews</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-16 dashboard-card">
                <div className="text-4xl mb-4">✍️</div>
                <h3 className="text-lg font-bold text-main-text mb-2">No reviews yet</h3>
                <p className="text-sm text-secondary-text mb-6">You haven't written any reviews yet.</p>
                <button onClick={handleOpenModal} className="btn-primary inline-flex items-center gap-2">
                  <HiOutlinePlus className="w-4 h-4" />
                  Write a Review
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => {
                  const editable = isEditable(review)
                  return (
                    <div key={review.id} className="dashboard-card p-4 hover:border-primary/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              to={`/property/${review.property_id}`}
                              className="font-bold text-main-text hover:text-primary transition-colors truncate"
                            >
                              {review.property_title || 'Property'}
                            </Link>
                            <StarRating rating={review.rating} size="w-4 h-4" />
                          </div>
                          {review.title && (
                            <p className="text-sm font-semibold text-main-text mb-1">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-secondary-text leading-relaxed mb-2">
                              {review.comment}
                            </p>
                          )}
                          {(review.cleanliness_rating || review.location_rating || review.communication_rating || review.amenities_rating || review.value_rating) && (
                            <div className="flex flex-wrap gap-3 mb-2">
                              {CATEGORIES.map(cat => (
                                review[cat.key] ? (
                                  <span key={cat.key} className="text-xs text-secondary-text">
                                    {cat.label}: <span className="font-medium text-main-text">{review[cat.key]}★</span>
                                  </span>
                                ) : null
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-secondary-text">
                            <span>{review.created_at?.split(' ')[0] || ''}</span>
                            {review.has_reply === 1 && (
                              <span className="text-primary font-medium">Host replied</span>
                            )}
                            {review.updated_at && (
                              <span className="text-secondary-text/70">(edited)</span>
                            )}
                          </div>
                          {review.host_reply && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-xl border-l-3 border-primary">
                              <p className="text-xs font-semibold text-primary mb-1">Host Reply</p>
                              <p className="text-xs text-secondary-text">{review.host_reply}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {editable && (
                            <button
                              onClick={() => handleEdit(review)}
                              className="text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                            >
                              <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(review.id)}
                            disabled={deletingId === review.id}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                            {deletingId === review.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <ReviewModal
          completedBookings={completedBookings}
          onClose={() => { setShowModal(false); setEditReview(null) }}
          onSubmit={handleSubmitReview}
          existingPropertyIds={reviews.map(r => r.property_id)}
          editReview={editReview}
        />
      )}
    </div>
  )
}

function ReviewModal({ completedBookings, onClose, onSubmit, existingPropertyIds, editReview }) {
  const isEditing = !!editReview
  const [propertyId, setPropertyId] = useState(editReview?.property_id || '')
  const [rating, setRating] = useState(editReview?.rating || 0)
  const [title, setTitle] = useState(editReview?.title || '')
  const [comment, setComment] = useState(editReview?.comment || '')
  const [categories, setCategories] = useState({
    cleanliness_rating: editReview?.cleanliness_rating || 0,
    location_rating: editReview?.location_rating || 0,
    communication_rating: editReview?.communication_rating || 0,
    amenities_rating: editReview?.amenities_rating || 0,
    value_rating: editReview?.value_rating || 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const availableBookings = isEditing
    ? []
    : completedBookings.filter(b => !existingPropertyIds.includes(b.property_id))

  const setCategoryRating = (key, val) => {
    setCategories(prev => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isEditing && !propertyId) return setError('Please select a property')
    if (rating === 0) return setError('Please select an overall rating')
    if (!comment.trim()) return setError('Please write a review comment')

    setSubmitting(true)
    try {
      const data = {
        rating,
        title,
        comment,
        ...categories,
      }
      await onSubmit(isEditing ? null : Number(propertyId), data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-main-text">{isEditing ? 'Edit Review' : 'Write a Review'}</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-main-text p-1 rounded-lg hover:bg-divider transition-colors"
            >
              ✕
            </button>
          </div>

          {!isEditing && availableBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-secondary-text">
                No completed bookings available to review. You can only review properties after your stay is completed.
              </p>
              <button onClick={onClose} className="mt-4 btn-primary">Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5">Property</label>
                  <select
                    value={propertyId}
                    onChange={e => setPropertyId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-divider bg-secondary text-main-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  >
                    <option value="">Select a property you stayed at</option>
                    {availableBookings.map(b => (
                      <option key={b.id} value={b.property_id}>
                        {b.property_title} — Checked out {b.check_out}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-main-text mb-1.5">Overall Rating *</label>
                <StarInput value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="block text-sm font-medium text-main-text mb-3">Category Ratings (optional)</label>
                <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                  {CATEGORIES.map(cat => (
                    <div key={cat.key} className="flex items-center justify-between">
                      <span className="text-sm text-secondary-text">{cat.label}</span>
                      <StarInput value={categories[cat.key]} onChange={(v) => setCategoryRating(cat.key, v)} color="teal" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-main-text mb-1.5">Review Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Sum up your experience"
                  maxLength={200}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-divider bg-secondary text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-main-text mb-1.5">Your Review *</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience in detail..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-divider bg-secondary text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
                <p className="text-xs text-secondary-text mt-1 text-right">{comment.length}/500</p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-secondary-text bg-divider hover:bg-border rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
