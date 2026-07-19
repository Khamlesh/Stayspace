import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { propertiesAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { formatRupees } from '../utils/currency'
import userAPI from '../api/userApi'
import toast from 'react-hot-toast'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import { HiOutlineHeart, HiHeart, HiOutlineCalendarDays } from 'react-icons/hi2'

const PropertyDetails = () => {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guests, setGuests] = useState(1)
  const [imgError, setImgError] = useState(false)
  const [bookedRanges, setBookedRanges] = useState([])
  const [blockedRanges, setBlockedRanges] = useState([])
  const [dateError, setDateError] = useState('')
  const [availLoading, setAvailLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [reviewSort, setReviewSort] = useState('newest')

  useEffect(() => {
    loadPropertyDetails()
    loadAvailability()
  }, [id])

  const loadPropertyDetails = async () => {
    try {
      const response = await propertiesAPI.getDetails(id)
      if (response.data.status === 'success') {
        setProperty(response.data.data)
      }
    } catch (error) {
      console.error('Error loading property:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailability = async () => {
    setAvailLoading(true)
    try {
      const response = await propertiesAPI.getAvailability(id)
      if (response.data.status === 'success') {
        setBookedRanges(response.data.data || [])
        setBlockedRanges(response.data.blocked || [])
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setAvailLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role === 'Guest') {
      userAPI.checkWishlist(id)
        .then(res => setIsWishlisted(res.data?.data?.is_wishlisted === true))
        .catch(() => {})
    }
  }, [id, isAuthenticated])

  const toggleWishlist = async () => {
    if (wishlistLoading) return
    const previous = isWishlisted
    setWishlistLoading(true)
    setIsWishlisted(!previous)
    try {
      if (previous) {
        await userAPI.removeFromWishlist(id)
        toast.success('Removed from wishlist')
      } else {
        await userAPI.addToWishlist(id)
        toast.success('Added to wishlist')
      }
    } catch {
      setIsWishlisted(previous)
      toast.error('Failed to update wishlist')
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleDateSelect = (action) => {
    switch (action.type) {
      case 'set-checkin':
        setCheckInDate(action.date)
        setCheckOutDate('')
        setDateError('')
        break
      case 'set-checkout':
        setCheckInDate(action.checkIn)
        setCheckOutDate(action.checkOut)
        setDateError('')
        break
      case 'new-selection':
        setCheckInDate(action.date)
        setCheckOutDate('')
        setDateError('')
        break
      case 'overlap':
        setDateError('Selected dates overlap with an existing booking or blocked period')
        break
      default:
        break
    }
  }

  const nights = checkInDate && checkOutDate
    ? Math.max(1, Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)))
    : 0
  const subtotal = property ? property.price_per_night * nights : 0
  const serviceFee = Math.round(subtotal * 0.1)
  const total = subtotal + serviceFee

  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!checkInDate || !checkOutDate) {
      setDateError('Please select check-in and check-out dates')
      return
    }
    navigate(`/booking/${id}`, {
      state: {
        checkInDate,
        checkOutDate,
        guests,
        propertyTitle: property.title,
        propertyAddress: property.address,
        propertyType: property.property_type,
        imageUrl: property.image_url,
        pricePerNight: property.price_per_night,
        maxGuests: property.max_guests
      }
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="h-96 bg-divider rounded-card animate-pulse mb-8" />
        <div className="h-8 w-64 bg-divider rounded animate-pulse mx-auto" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-secondary-text text-lg">Property not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {property.image_url && !imgError ? (
        <div className="rounded-card overflow-hidden h-64 sm:h-80 lg:h-96 mb-8">
          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-card h-64 sm:h-80 lg:h-96 flex items-center justify-center mb-8">
          <span className="text-7xl font-bold text-primary/20">{property.title?.charAt(0)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            {property.property_type && (
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {property.property_type}
              </span>
            )}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-main-text">{property.title}</h1>
          <p className="text-secondary-text mb-4">{property.address}</p>

          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-divider">
            <div className="text-primary text-xl font-bold flex items-center gap-1">
              ★ {property.average_rating || 'New'}
            </div>
            <div className="text-secondary-text text-sm">({property.review_count || 0} reviews)</div>
            <div className="text-secondary-text text-sm">• {property.max_guests} guests max</div>
            {isAuthenticated && user?.role === 'Guest' && (
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className="ml-auto p-2 rounded-xl hover:bg-divider transition-colors disabled:opacity-50"
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {wishlistLoading ? (
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                ) : isWishlisted ? (
                  <HiHeart className="w-6 h-6 text-red-500" />
                ) : (
                  <HiOutlineHeart className="w-6 h-6 text-secondary-text hover:text-red-400" />
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8 pb-8 border-b border-divider">
            <div className="text-center p-3 bg-background rounded-xl">
              <p className="text-lg font-bold text-main-text">{property.bedrooms || 1}</p>
              <p className="text-xs text-secondary-text">Bedrooms</p>
            </div>
            <div className="text-center p-3 bg-background rounded-xl">
              <p className="text-lg font-bold text-main-text">{property.bathrooms || 1}</p>
              <p className="text-xs text-secondary-text">Bathrooms</p>
            </div>
            <div className="text-center p-3 bg-background rounded-xl">
              <p className="text-lg font-bold text-main-text">{property.beds || 1}</p>
              <p className="text-xs text-secondary-text">Beds</p>
            </div>
            <div className="text-center p-3 bg-background rounded-xl">
              <p className="text-lg font-bold text-main-text">{property.property_size ? `${property.property_size} sq ft` : 'N/A'}</p>
              <p className="text-xs text-secondary-text">Property Size</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-main-text">About this property</h2>
            <p className="text-secondary-text leading-relaxed">{property.description}</p>
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-main-text">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-background rounded-xl">
                    <span className="text-success text-sm">✓</span>
                    <span className="text-main-text text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.host ? (
            <div className="mb-8 pb-8 border-b border-divider">
              <h2 className="text-xl font-bold mb-3 text-main-text">Host Information</h2>
              <div className="bg-background rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {property.host.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-main-text">{property.host.name}</h3>
                    {property.host.bio && <p className="text-sm text-secondary-text mt-1">{property.host.bio}</p>}
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-2">Contact Information</p>
                      <p className="text-sm text-main-text">📧 {property.host.email}</p>
                      {property.host.phone && <p className="text-sm text-main-text">📱 {property.host.phone}</p>}
                      {property.host.city && <p className="text-sm text-main-text">📍 {property.host.city}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 pb-8 border-b border-divider">
              <h2 className="text-xl font-bold mb-3 text-main-text">Host</h2>
              <div className="bg-background rounded-xl p-5 text-center">
                <p className="text-secondary-text text-sm">Book this property to view host contact information</p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-main-text">Reviews</h2>
              {property.reviews && property.reviews.length > 0 && (
                <select
                  value={reviewSort}
                  onChange={e => setReviewSort(e.target.value)}
                  className="input-field text-sm py-1 px-2"
                >
                  <option value="newest">Newest</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              )}
            </div>

            {property.category_ratings && Object.keys(property.category_ratings).length > 0 && (
              <div className="bg-background rounded-xl p-4 mb-4 border border-divider">
                <p className="text-xs font-medium text-secondary-text mb-3">Category Breakdown</p>
                <div className="space-y-2">
                  {[
                    { key: 'cleanliness', label: 'Cleanliness' },
                    { key: 'location', label: 'Location' },
                    { key: 'communication', label: 'Communication' },
                    { key: 'amenities', label: 'Amenities' },
                    { key: 'value', label: 'Value for Money' },
                  ].map(cat => (
                    property.category_ratings[cat.key] ? (
                      <div key={cat.key} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-secondary-text w-32">{cat.label}</span>
                        <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden">
                          <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${(property.category_ratings[cat.key] / 5) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-main-text w-8 text-right">{Number(property.category_ratings[cat.key]).toFixed(1)}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {property.rating_breakdown && Object.keys(property.rating_breakdown).length > 0 && (
              <div className="bg-background rounded-xl p-4 mb-4 border border-divider">
                <p className="text-xs font-medium text-secondary-text mb-3">Rating Distribution</p>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = property.rating_breakdown[star] || 0
                    const pct = (property.reviews?.length || 0) > 0 ? (count / property.reviews.length) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-secondary-text w-6">{star}★</span>
                        <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-secondary-text w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {property.reviews && property.reviews.length > 0 ? (
                [...property.reviews].sort((a, b) => {
                  switch (reviewSort) {
                    case 'newest': return new Date(b.created_at) - new Date(a.created_at)
                    case 'highest': return b.rating - a.rating
                    case 'lowest': return a.rating - b.rating
                    default: return 0
                  }
                }).map((review, idx) => (
                  <div key={idx} className="bg-background rounded-xl p-5 border border-divider hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-main-text text-sm">{review.guest_name}</h4>
                        {review.verified_stay === 1 && (
                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">✓ Verified</span>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={`text-xs ${s <= review.rating ? 'text-yellow-400' : 'text-divider'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="text-sm font-semibold text-main-text mb-1">{review.title}</p>}
                    <p className="text-sm text-secondary-text">{review.comment}</p>
                    {(review.cleanliness_rating || review.location_rating || review.communication_rating || review.amenities_rating || review.value_rating) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { key: 'cleanliness_rating', label: 'Clean' },
                          { key: 'location_rating', label: 'Location' },
                          { key: 'communication_rating', label: 'Comm' },
                          { key: 'amenities_rating', label: 'Amenities' },
                          { key: 'value_rating', label: 'Value' },
                        ].map(cat => (
                          review[cat.key] ? (
                            <span key={cat.key} className="text-[11px] text-secondary-text bg-white/80 px-2 py-0.5 rounded-full border border-divider">
                              {cat.label}: {review[cat.key]}★
                            </span>
                          ) : null
                        ))}
                      </div>
                    )}
                    {review.host_reply && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-3 border-primary">
                        <p className="text-xs font-semibold text-primary mb-1">Host Reply</p>
                        <p className="text-xs text-secondary-text">{review.host_reply}</p>
                      </div>
                    )}
                    <p className="text-xs text-secondary-text/70 mt-2">{review.created_at}</p>
                  </div>
                ))
              ) : (
                <p className="text-secondary-text text-sm">No reviews yet</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-card shadow-card border border-divider p-6 sticky top-24">
            <div className="mb-5">
              <div className="text-3xl font-bold text-primary mb-1">
                {formatRupees(property.price_per_night)}
              </div>
              <p className="text-sm text-secondary-text">per night</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-secondary-text mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkInDate}
                  readOnly
                  className="input-field text-sm bg-background cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-text mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOutDate}
                  readOnly
                  className="input-field text-sm bg-background cursor-pointer"
                />
              </div>
              {dateError && (
                <p className="text-xs text-danger mt-1">{dateError}</p>
              )}
              {checkInDate && !checkOutDate && (
                <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                  <HiOutlineCalendarDays className="w-3 h-3" />
                  Now select your check-out date
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-secondary-text mb-1">Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="input-field text-sm"
                >
                  {Array.from({ length: property.max_guests || 6 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!checkInDate || !checkOutDate}
              className="btn-primary w-full mb-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticated ? 'Reserve Now' : 'Login to Reserve'}
            </button>

            {nights > 0 && (
              <div className="border-t border-divider pt-4 space-y-2 text-sm text-secondary-text">
                <div className="flex justify-between">
                  <span>{formatRupees(property.price_per_night)} × {nights} night{nights > 1 ? 's' : ''}</span>
                  <span>{formatRupees(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>{formatRupees(serviceFee)}</span>
                </div>
                <div className="border-t border-divider pt-2 flex justify-between font-bold text-main-text">
                  <span>Total</span>
                  <span>{formatRupees(total)}</span>
                </div>
              </div>
            )}

            {/* Mini Calendar in Sidebar */}
            <div className="mt-5 pt-5 border-t border-divider">
              <AvailabilityCalendar
                bookedRanges={bookedRanges}
                blockedRanges={blockedRanges}
                selectedCheckIn={checkInDate}
                selectedCheckOut={checkOutDate}
                onDateSelect={handleDateSelect}
                mode="guest"
                loading={availLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetails
