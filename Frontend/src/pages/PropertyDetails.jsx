import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { propertiesAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { formatRupees } from '../utils/currency'
import AvailabilityCalendar from '../components/AvailabilityCalendar'

const PropertyDetails = () => {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
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

  const handleDateSelect = (dateStr, endDateOrError) => {
    if (endDateOrError === 'overlap') {
      setDateError('Selected dates overlap with an existing booking or blocked period')
      return
    }
    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(dateStr)
      setCheckOutDate('')
      setDateError('')
    } else {
      if (dateStr <= checkInDate) {
        setCheckInDate(dateStr)
        setCheckOutDate('')
      } else {
        setCheckInDate(checkInDate)
        setCheckOutDate(dateStr)
        setDateError('')
      }
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

          {/* Availability Calendar Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-main-text">Availability</h2>
            <div className="bg-white rounded-card shadow-card border border-divider p-5">
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

          <div>
            <h2 className="text-xl font-bold mb-3 text-main-text">Reviews</h2>
            <div className="space-y-3">
              {property.reviews && property.reviews.length > 0 ? (
                property.reviews.map((review, idx) => (
                  <div key={idx} className="bg-background rounded-xl p-5 border border-divider">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-main-text text-sm">{review.guest_name}</h4>
                      <span className="text-primary text-sm">★ {review.rating}</span>
                    </div>
                    <p className="text-sm text-secondary-text">{review.comment}</p>
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
                <p className="text-[10px] text-secondary-text mt-1">Select dates on the calendar below</p>
              </div>
              {dateError && (
                <p className="text-xs text-danger mt-1">{dateError}</p>
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
