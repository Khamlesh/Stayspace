import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookingsAPI } from '../api/client'
import { formatRupees } from '../utils/currency'

const Payment = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}

  const {
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
    propertyTitle,
    propertyAddress,
    propertyType,
    imageUrl
  } = state

  const [paymentMethod, setPaymentMethod] = useState('Credit Card')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!propertyId || !checkInDate || !checkOutDate) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-main-text">No Booking Data</h2>
        <p className="text-secondary-text mb-6">Please start a booking from the property page.</p>
        <button onClick={() => navigate('/search')} className="btn-primary">Browse Properties</button>
      </div>
    )
  }

  const paymentMethodMap = {
    'credit-card': 'Credit Card',
    'debit-card': 'Debit Card',
    'upi': 'UPI',
    'net-banking': 'Net Banking'
  }

  const methodLabel = paymentMethodMap[paymentMethod] || paymentMethod

  const handlePayment = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setError('')

    try {
      const res = await bookingsAPI.create({
        property_id: parseInt(propertyId),
        check_in: checkInDate,
        check_out: checkOutDate,
        guests: parseInt(guests),
        special_requests: specialRequests || '',
        payment_method: methodLabel
      })

      if (res.data.status === 'success') {
        navigate('/payment-success', {
          state: {
            bookingId: res.data.data.booking_id,
            transactionId: res.data.data.transaction_id,
            amount: res.data.data.total_price,
            nights: res.data.data.nights,
            serviceFee: res.data.data.service_fee,
            paymentMethod: methodLabel,
            propertyTitle: res.data.data.property_title || propertyTitle,
            checkInDate,
            checkOutDate,
            guests
          }
        })
      } else {
        setError(res.data.message || 'Payment failed. Please try again.')
        setProcessing(false)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred. Please try again.'
      setError(msg)
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-main-text">Payment</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-main-text">Choose Payment Method</h2>

          <div className="space-y-4 mb-8">
            {[
              { id: 'credit-card', label: 'Credit Card', icon: '💳' },
              { id: 'debit-card', label: 'Debit Card', icon: '💳' },
              { id: 'upi', label: 'UPI', icon: '📱' },
              { id: 'net-banking', label: 'Net Banking', icon: '🏦' }
            ].map(method => (
              <label key={method.id} className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-all"
                style={{borderColor: paymentMethod === method.id ? '#FF385C' : '#E5E7EB'}}>
                <input
                  type="radio"
                  name="payment-method"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-4"
                />
                <span className="text-2xl mr-3">{method.icon}</span>
                <span className="font-semibold text-gray-900">{method.label}</span>
              </label>
            ))}
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            {(paymentMethod === 'credit-card' || paymentMethod === 'debit-card') && (
              <>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    maxLength="16"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Expiry Date</label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.slice(0, 3))}
                      placeholder="123"
                      maxLength="3"
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'upi' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="input-field"
                  required
                />
              </div>
            )}

            {paymentMethod === 'net-banking' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Select Bank</label>
                <select className="input-field" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}>
                  <option value="">Choose your bank...</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="btn-primary w-full"
            >
              {processing ? 'Processing Payment...' : `Pay ${formatRupees(total)}`}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 h-fit">
          <h3 className="font-bold text-lg mb-4 text-main-text">Order Summary</h3>

          {(propertyTitle || imageUrl) && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary/30">{propertyTitle?.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-gray-900">{propertyTitle}</p>
                <p className="text-xs text-gray-500">{propertyAddress}</p>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Accommodation</span>
              <span>{formatRupees(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>{formatRupees(serviceFee)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span className="text-primary">{formatRupees(total)}</span>
            </div>
          </div>

          <div className="space-y-1 text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Check-in: {checkInDate}</p>
            <p>Check-out: {checkOutDate}</p>
            <p>Guests: {guests}</p>
            <p>Nights: {nights}</p>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-semibold mb-1">Simulated Payment</p>
            <p>Use any card details to complete the demo booking.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
