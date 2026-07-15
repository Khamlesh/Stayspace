import { useState } from 'react'
import { HiOutlineXMark, HiOutlineCalendarDays, HiOutlineUserGroup, HiOutlineChatBubbleLeftEllipsis } from 'react-icons/hi2'

export default function BookingModificationModal({ booking, onClose, onSubmit, loading }) {
  const [checkIn, setCheckIn] = useState(booking?.check_in || '')
  const [checkOut, setCheckOut] = useState(booking?.check_out || '')
  const [guests, setGuests] = useState(booking?.guests_count || 1)
  const [specialRequest, setSpecialRequest] = useState(booking?.special_requests || '')
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const hasChanges = checkIn !== booking?.check_in || checkOut !== booking?.check_out ||
    guests !== booking?.guests_count || specialRequest !== (booking?.special_requests || '')

  const handleSubmit = () => {
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates')
      return
    }
    if (checkOut <= checkIn) {
      setError('Check-out must be after check-in')
      return
    }
    if (!hasChanges) {
      setError('No changes detected')
      return
    }
    setError('')
    onSubmit({
      booking_id: booking.id,
      new_check_in: checkIn,
      new_check_out: checkOut,
      new_guests: guests,
      new_special_request: specialRequest,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-card-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-divider flex-shrink-0">
          <h2 className="text-lg font-bold text-main-text">Modify Booking #{booking?.id}</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-secondary-text hover:text-main-text hover:bg-divider transition-colors">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          <p className="text-xs text-secondary-text bg-info/5 border border-info/20 rounded-xl p-3">
            Your modification request will be sent to the host for approval. The booking will only be updated after the host approves.
          </p>

          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1 flex items-center gap-1.5">
              <HiOutlineCalendarDays className="w-3.5 h-3.5" /> Check-in Date
            </label>
            <div className="flex items-center gap-2">
              <input type="date" value={checkIn} onChange={e => { setCheckIn(e.target.value); setError('') }}
                min={today} className="input-field text-sm flex-1" />
              {checkIn !== booking?.check_in && <span className="text-[10px] text-warning font-medium">Changed</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1 flex items-center gap-1.5">
              <HiOutlineCalendarDays className="w-3.5 h-3.5" /> Check-out Date
            </label>
            <div className="flex items-center gap-2">
              <input type="date" value={checkOut} onChange={e => { setCheckOut(e.target.value); setError('') }}
                min={checkIn || today} className="input-field text-sm flex-1" />
              {checkOut !== booking?.check_out && <span className="text-[10px] text-warning font-medium">Changed</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1 flex items-center gap-1.5">
              <HiOutlineUserGroup className="w-3.5 h-3.5" /> Number of Guests
            </label>
            <select value={guests} onChange={e => setGuests(parseInt(e.target.value))} className="input-field text-sm">
              {Array.from({ length: booking?.max_guests || 10 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
              ))}
            </select>
            {guests !== booking?.guests_count && <span className="text-[10px] text-warning font-medium">Changed</span>}
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1 flex items-center gap-1.5">
              <HiOutlineChatBubbleLeftEllipsis className="w-3.5 h-3.5" /> Special Requests
            </label>
            <textarea value={specialRequest} onChange={e => setSpecialRequest(e.target.value)}
              className="input-field text-sm" rows={3} placeholder="Any special requests..." />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="bg-background rounded-xl p-3 text-xs text-secondary-text space-y-1">
            <p className="font-medium text-main-text">Current vs Requested</p>
            <div className="flex justify-between"><span>Dates:</span><span>{booking?.check_in} → {checkIn} to {checkOut}</span></div>
            <div className="flex justify-between"><span>Guests:</span><span>{booking?.guests_count} → {guests}</span></div>
          </div>
        </div>

        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-divider flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-divider rounded-xl hover:bg-divider transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !hasChanges}
            className="flex-1 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
