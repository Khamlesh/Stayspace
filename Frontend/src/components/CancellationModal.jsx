import { useState } from 'react'
import { HiOutlineXMark, HiOutlineExclamationTriangle, HiOutlineChatBubbleLeftEllipsis } from 'react-icons/hi2'

export default function CancellationModal({ booking, role = 'guest', onClose, onSubmit, loading }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const roleLabel = { guest: 'Guest', host: 'Host', admin: 'Admin' }[role] || 'User'

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation')
      return
    }
    setError('')
    onSubmit({ booking_id: booking.id, reason: reason.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-card-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-divider flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <HiOutlineExclamationTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-main-text">Cancel Booking</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-secondary-text hover:text-main-text hover:bg-divider transition-colors">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700 font-medium">Warning</p>
            <p className="text-xs text-red-600 mt-1">
              This action will cancel Booking #{booking?.id} ({booking?.property_title}). This cannot be undone.
            </p>
          </div>

          <div className="bg-background rounded-xl p-3 space-y-1.5 text-xs text-secondary-text">
            <div className="flex justify-between"><span>Property:</span><span className="font-medium text-main-text">{booking?.property_title}</span></div>
            <div className="flex justify-between"><span>Dates:</span><span className="font-medium text-main-text">{booking?.check_in} → {booking?.check_out}</span></div>
            <div className="flex justify-between"><span>Status:</span><span className="font-medium text-main-text">{booking?.status}</span></div>
            <div className="flex justify-between"><span>Amount:</span><span className="font-medium text-main-text">₹{booking?.total_price?.toLocaleString()}</span></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1 flex items-center gap-1.5">
              <HiOutlineChatBubbleLeftEllipsis className="w-3.5 h-3.5" /> Cancellation Reason ({roleLabel})
            </label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setError('') }}
              className="input-field text-sm"
              rows={3}
              placeholder={`Why is ${roleLabel.toLowerCase()} cancelling this booking?`}
            />
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
          </div>
        </div>

        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-divider flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-divider rounded-xl hover:bg-divider transition-colors">
            Keep Booking
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  )
}
