import { useState, useEffect } from 'react'
import hostAPI from '../../api/hostApi'
import { HiOutlineStar } from 'react-icons/hi2'

export default function HostReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hostAPI.getRecentReviews()
      .then(res => {
        if (res.data.status === 'success') setReviews(res.data.data || [])
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  const ratingDistribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Reviews</h1>
        <p className="text-sm text-secondary-text mt-1">Guest feedback on your properties</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-divider rounded-card animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="dashboard-card text-center">
              <p className="text-4xl font-bold text-main-text">{avgRating}</p>
              <div className="flex justify-center gap-0.5 my-1">
                {[1,2,3,4,5].map(s => (
                  <HiOutlineStar key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-rating fill-rating' : 'text-divider'}`} />
                ))}
              </div>
              <p className="text-xs text-secondary-text">{reviews.length} reviews</p>
            </div>
            <div className="sm:col-span-2 dashboard-card">
              <div className="space-y-2">
                {ratingDistribution.map(d => (
                  <div key={d.star} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-secondary-text w-8">{d.star} ★</span>
                    <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden">
                      <div className="h-full bg-rating rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs text-secondary-text w-8 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="dashboard-card">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">{(r.guest_name || 'G').charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-main-text">{r.guest_name}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-xs ${s <= r.rating ? 'text-rating' : 'text-divider'}`}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-secondary-text ml-auto">{r.created_at?.split(' ')[0]}</span>
                    </div>
                    <p className="text-sm text-secondary-text mb-1">{r.comment}</p>
                    <p className="text-xs text-info">Property: {r.property_title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length === 0 && (
            <div className="text-center py-16">
              <p className="text-secondary-text">No reviews yet</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
