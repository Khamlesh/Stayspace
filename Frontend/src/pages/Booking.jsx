import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { propertiesAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { formatRupees } from '../utils/currency'

const Booking = () => {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [specialRequests, setSpecialRequests] = useState('')

  const {
    checkInDate: ci,
    checkOutDate: co,
    guests: g,
    propertyTitle: pTitle,
    propertyAddress: pAddr,
    propertyType: pType,
    imageUrl: pImg,
    pricePerNight: ppn,
    maxGuests: mg
  } = location.state || {}

  const [checkInDate] = useState(ci || '')
  const [checkOutDate] = useState(co || '')
  const [guests] = useState(g || 1)

  useEffect(() => {
    if (!checkInDate || !checkOutDate) {
      navigate(`/property/${propertyId}`)
      return
    }
    loadProperty()
  }, [propertyId])

  const loadProperty = async () => {
    try {
      const res = await propertiesAPI.getDetails(propertyId)
      if (res.data.status === 'success') setProperty(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const pricePerNight = ppn || property?.price_per_night || 0
  const nights = checkInDate && checkOutDate
    ? Math.max(1, Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)))
    : 1
  const subtotal = pricePerNight * nights
  const serviceFee = Math.round(subtotal * 0.1)
  const total = subtotal + serviceFee

  const handleProceedToPayment = () => {
    navigate('/payment', {
      state: {
        propertyId,
        checkInDate,
        checkOutDate,
        guests,
        specialRequests,
        pricePerNight,
        nights,
        subtotal,
        serviceFee,
        total,
        propertyTitle: pTitle || property?.title,
        propertyAddress: pAddr || property?.address,
        propertyType: pType || property?.property_type,
        imageUrl: pImg || property?.image_url
      }
    })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-divider rounded animate-pulse mb-8" />
        <div className="h-64 bg-divider rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-main-text">Complete Your Booking</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-main-text">Booking Details</h2>

          <div className="mb-6 p-4 bg-background rounded-xl">
            <div className="flex items-start gap-4">
              {(pImg || property?.image_url) ? (
                <img src={pImg || property?.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary/30">{(pTitle || property?.title)?.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-main-text">{pTitle || property?.title}</h3>
                <p className="text-sm text-secondary-text">{pAddr || property?.address}</p>
                {pType && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">{pType}</span>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Check-in</label>
                <div className="input-field bg-gray-50">
                  {new Date(checkInDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Check-out</label>
                <div className="input-field bg-gray-50">
                  {new Date(checkOutDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Number of Guests</label>
              <div className="input-field bg-gray-50">{guests} Guest{guests > 1 ? 's' : ''}</div>
            </div>

            {user && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Guest Information</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <p><span className="font-semibold">Name:</span> {user.name}</p>
                  <p><span className="font-semibold">Email:</span> {user.email}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Special Requests</label>
              <textarea
                placeholder="Any special requests for the host?"
                className="input-field h-24"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleProceedToPayment}
            className="btn-primary w-full mt-8"
          >
            Proceed to Payment
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 h-fit">
          <h3 className="font-bold text-lg mb-4 text-main-text">Price Details</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{formatRupees(pricePerNight)} × {nights} night{nights > 1 ? 's' : ''}</span>
              <span>{formatRupees(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fee (10%)</span>
              <span>{formatRupees(serviceFee)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-primary">{formatRupees(total)}</span>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-1">Booking Summary</p>
            <p>{nights} night{nights > 1 ? 's' : ''} · {guests} guest{guests > 1 ? 's' : ''}</p>
            <p className="mt-1">{checkInDate} → {checkOutDate}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Booking
