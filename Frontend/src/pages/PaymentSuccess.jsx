import { useLocation, useNavigate } from 'react-router-dom'
import { formatRupees } from '../utils/currency'

const PaymentSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    bookingId,
    transactionId,
    amount,
    nights,
    serviceFee,
    paymentMethod,
    propertyTitle,
    checkInDate,
    checkOutDate,
    guests
  } = location.state || {}

  if (!bookingId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-secondary-text text-lg mb-6">No booking data found.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-24">
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-success">✓</span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">Your booking has been confirmed</p>

        <div className="bg-gray-50 rounded-lg p-8 mb-8 text-left">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-mono font-bold">#{bookingId}</span>
            </div>
            {transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm font-semibold">{transactionId}</span>
              </div>
            )}
            {propertyTitle && (
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-semibold">{propertyTitle}</span>
              </div>
            )}
            {checkInDate && checkOutDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Dates:</span>
                <span className="font-semibold">{checkInDate} → {checkOutDate}</span>
              </div>
            )}
            {guests && (
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span className="font-semibold">{guests}</span>
              </div>
            )}
            {nights && (
              <div className="flex justify-between">
                <span className="text-gray-600">Nights:</span>
                <span className="font-semibold">{nights}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-bold text-primary text-2xl">{formatRupees(amount)}</span>
            </div>
            {paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">{paymentMethod}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-semibold">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="font-bold text-lg text-blue-900 mb-2">What's Next?</h2>
          <ul className="text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>Your booking confirmation is complete</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>Check your dashboard for booking details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>The host will be notified about your booking</span>
            </li>
            {checkInDate && (
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">✓</span>
                <span>Your check-in date is {new Date(checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </li>
            )}
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex-1"
          >
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
