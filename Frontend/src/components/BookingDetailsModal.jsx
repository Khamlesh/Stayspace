import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRupees } from '../utils/currency'
import { generateBookingReceipt } from '../utils/receiptGenerator'
import { useAuth } from '../hooks/useAuth'
import { bookingsAPI } from '../api/client'
import BookingModificationModal from './BookingModificationModal'
import CancellationModal from './CancellationModal'
import ModificationHistory from './ModificationHistory'
import {
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineCreditCard,
  HiOutlineDocumentDuplicate,
  HiOutlineMapPin,
  HiOutlineHomeModern,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineClipboardDocumentList,
  HiOutlinePencilSquare,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineMap,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
} from 'react-icons/hi2'

const STATUS_CONFIG = {
  Pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    label: 'Pending Confirmation',
  },
  Confirmed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    label: 'Confirmed',
  },
  'Checked-In': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
    label: 'Checked In',
  },
  Completed: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    label: 'Completed',
  },
  Cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-400',
    label: 'Cancelled',
  },
  Refunded: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-400',
    label: 'Refunded',
  },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-secondary-text" />}
        <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-text">{title}</h3>
      </div>
      <div className="bg-background rounded-xl p-4 space-y-3">
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, bold, mono, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-sm text-secondary-text">
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span>{label}</span>
      </div>
      <span className={`text-sm text-right max-w-[60%] ${bold ? 'font-bold text-main-text' : 'text-main-text'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value || 'N/A'}
      </span>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, variant = 'primary', disabled = false, disabledLabel }) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-btn',
    outline: 'border border-border bg-white text-main-text hover:border-primary hover:text-primary',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
    success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
  }

  if (disabled) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{disabledLabel || label}</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${variants[variant]}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  )
}

function ComingSoonCard({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-dashed border-gray-300">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
        Soon
      </span>
    </div>
  )
}

export default function BookingDetailsModal({
  booking: b,
  role = 'guest',
  onClose,
  onCancel,
  cancellingId,
  onAction,
  actionLoading,
  onLeaveReview,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [imgErr, setImgErr] = useState(false)
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [modifications, setModifications] = useState([])
  const [modsLoading, setModsLoading] = useState(true)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [modifyLoading, setModifyLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    if (!b) return
    setTimelineLoading(true)
    bookingsAPI.getTimeline(b.id)
      .then(res => {
        if (res.data.status === 'success') setTimeline(res.data.data || [])
      })
      .catch(() => {})
      .finally(() => setTimelineLoading(false))

    setModsLoading(true)
    bookingsAPI.getModifications(b.id)
      .then(res => {
        if (res.data.status === 'success') setModifications(res.data.data || [])
      })
      .catch(() => {})
      .finally(() => setModsLoading(false))
  }, [b?.id])

  const pendingMod = modifications.find(m => m.status === 'Pending')

  const handleModifySubmit = async (data) => {
    setModifyLoading(true)
    try {
      await bookingsAPI.modifyRequest(data)
      setShowModifyModal(false)
      const res = await bookingsAPI.getModifications(b.id)
      if (res.data.status === 'success') setModifications(res.data.data || [])
      const tl = await bookingsAPI.getTimeline(b.id)
      if (tl.data.status === 'success') setTimeline(tl.data.data || [])
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit modification request')
    } finally {
      setModifyLoading(false)
    }
  }

  const handleCancelSubmit = async (data) => {
    setCancelLoading(true)
    try {
      await bookingsAPI.smartCancel(data)
      setShowCancelModal(false)
      onClose()
      if (onCancel) onCancel(b.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleModAction = async (modId, action, comments = '') => {
    try {
      await bookingsAPI.modifyAction({ modification_id: modId, action, comments })
      const res = await bookingsAPI.getModifications(b.id)
      if (res.data.status === 'success') setModifications(res.data.data || [])
      const tl = await bookingsAPI.getTimeline(b.id)
      if (tl.data.status === 'success') setTimeline(tl.data.data || [])
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process modification')
    }
  }

  if (!b) return null

  const nights = b.nights || Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)))
  const canCancel = b.status === 'Pending' || b.status === 'Confirmed'
  const canReview = b.status === 'Completed' && !b.has_review && role === 'guest'
  const paymentPaid = b.payment_amount > 0

  const handleViewReceipt = () => {
    generateBookingReceipt({
      bookingId: b.id,
      transactionId: b.transaction_id,
      amount: b.total_price,
      nights,
      serviceFee: Math.round(b.total_price * 0.1),
      paymentMethod: b.payment_method,
      propertyTitle: b.property_title,
      propertyAddress: b.property_address,
      checkInDate: b.check_in,
      checkOutDate: b.check_out,
      guests: b.guests_count,
      status: b.status,
      guest_name: b.guest_name || user?.name,
      host_name: b.host_name || (role === 'host' ? user?.name : ''),
      host_email: b.host_email || (role === 'host' ? user?.email : ''),
      host_phone: b.host_phone || (role === 'host' ? user?.phone : 'Not Available'),
      bookingDate: b.created_at,
    })
  }

  const handleRaiseComplaint = () => {
    onClose()
    if (role === 'guest') navigate('/user/complaints')
    else if (role === 'host') navigate('/host/complaints')
  }

  const handleWriteReview = () => {
    onClose()
    if (onLeaveReview) onLeaveReview(b.property_id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-card-lg max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-divider flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-bold text-main-text truncate">Booking #{b.id}</h2>
            <StatusBadge status={b.status} />
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl text-secondary-text hover:text-main-text hover:bg-divider transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">

          {/* Property Card */}
          <div className="flex gap-4 p-4 bg-background rounded-xl">
            {b.image_url && !imgErr ? (
              <img
                src={b.image_url}
                alt={b.property_title}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary/30">{b.property_title?.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-main-text truncate">{b.property_title}</h3>
              <div className="flex items-center gap-1 text-xs text-secondary-text mt-1">
                <HiOutlineMapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{b.property_address}</span>
              </div>
              {b.property_type && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-2">
                  <HiOutlineHomeModern className="w-3 h-3" />
                  {b.property_type}
                </span>
              )}
            </div>
          </div>

          {/* Booking Dates & Guests */}
          <Section title="Booking Details" icon={HiOutlineCalendarDays}>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-xl border border-divider">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-text mb-1">Check-in</p>
                <p className="text-sm font-bold text-main-text">
                  {new Date(b.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-[10px] text-secondary-text">
                  {new Date(b.check_in).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl border border-divider">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-text mb-1">Check-out</p>
                <p className="text-sm font-bold text-main-text">
                  {new Date(b.check_out).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-[10px] text-secondary-text">
                  {new Date(b.check_out).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InfoRow label="Duration" value={`${nights} night${nights > 1 ? 's' : ''}`} icon={HiOutlineClock} />
              <InfoRow label="Guests" value={`${b.guests_count || 1} person${(b.guests_count || 1) > 1 ? 's' : ''}`} icon={HiOutlineUserGroup} />
              {b.created_at && (
                <InfoRow label="Booked On" value={b.created_at.split(' ')[0]} icon={HiOutlineClipboardDocumentList} />
              )}
            </div>
          </Section>

          {/* Payment Information */}
          <Section title="Payment Information" icon={HiOutlineCreditCard}>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-divider">
              <div>
                <p className="text-xs text-secondary-text">Total Amount</p>
                <p className="text-xl font-bold text-main-text">{formatRupees(b.total_price)}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${paymentPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {paymentPaid ? (
                  <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
                )}
                {paymentPaid ? 'Paid' : 'Pending'}
              </div>
            </div>
            <InfoRow label="Payment Method" value={b.payment_method || 'N/A'} />
            <InfoRow label="Transaction ID" value={b.transaction_id || 'N/A'} mono />
          </Section>

          {/* Host / Guest Information */}
          <Section
            title={role === 'guest' ? 'Host Information' : 'Guest Information'}
            icon={role === 'guest' ? HiOutlineIdentification : HiOutlineUserGroup}
          >
            {role === 'guest' ? (
              <>
                <InfoRow label="Name" value={b.host_name} icon={HiOutlineUserGroup} />
                <InfoRow label="Email" value={b.host_email} icon={HiOutlineEnvelope} />
                <InfoRow label="Phone" value={b.host_phone || 'Not Available'} icon={HiOutlinePhone} />
              </>
            ) : (
              <>
                <InfoRow label="Name" value={b.guest_name} icon={HiOutlineUserGroup} />
                <InfoRow label="Email" value={b.guest_email} icon={HiOutlineEnvelope} />
                <InfoRow label="Guests" value={`${b.guests_count || 1} person${(b.guests_count || 1) > 1 ? 's' : ''}`} icon={HiOutlineUserGroup} />
              </>
            )}
          </Section>

          {/* Special Requests */}
          {b.special_requests && (
            <Section title="Special Requests" icon={HiOutlineChatBubbleLeftEllipsis}>
              <p className="text-sm text-secondary-text leading-relaxed">{b.special_requests}</p>
            </Section>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-text">Actions</h3>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                icon={HiOutlineDocumentDuplicate}
                label="View Receipt"
                onClick={handleViewReceipt}
                variant="outline"
              />
              {role === 'guest' && (
                <ActionButton
                  icon={HiOutlineChatBubbleLeftEllipsis}
                  label="Raise Complaint"
                  onClick={handleRaiseComplaint}
                  variant="outline"
                />
              )}
              {role === 'host' && onAction && (
                <>
                  {b.status === 'Pending' && (
                    <>
                      <ActionButton
                        icon={HiOutlineCheckCircle}
                        label="Confirm"
                        onClick={() => { onAction(b.id, 'confirm'); onClose() }}
                        variant="success"
                        disabled={actionLoading === `${b.id}-confirm`}
                      />
                      <ActionButton
                        icon={HiOutlineXCircle}
                        label="Reject"
                        onClick={() => setShowCancelModal(true)}
                        variant="danger"
                        disabled={actionLoading === `${b.id}-cancel`}
                      />
                    </>
                  )}
                  {b.status === 'Confirmed' && (
                    <>
                      <ActionButton
                        icon={HiOutlineCheckCircle}
                        label="Check-in"
                        onClick={() => { onAction(b.id, 'checkin'); onClose() }}
                        variant="primary"
                        disabled={actionLoading === `${b.id}-checkin`}
                      />
                      <ActionButton
                        icon={HiOutlineXCircle}
                        label="Cancel"
                        onClick={() => setShowCancelModal(true)}
                        variant="danger"
                        disabled={actionLoading === `${b.id}-cancel`}
                      />
                    </>
                  )}
                  {b.status === 'Checked-In' && (
                    <>
                      <ActionButton
                        icon={HiOutlineCheckCircle}
                        label="Complete"
                        onClick={() => { onAction(b.id, 'complete'); onClose() }}
                        variant="success"
                        disabled={actionLoading === `${b.id}-complete`}
                      />
                      <ActionButton
                        icon={HiOutlineXCircle}
                        label="Cancel"
                        onClick={() => setShowCancelModal(true)}
                        variant="danger"
                        disabled={actionLoading === `${b.id}-cancel`}
                      />
                    </>
                  )}
                  {pendingMod && (
                    <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-medium text-amber-700">Pending Modification Request</p>
                      <p className="text-[11px] text-amber-600">
                        {pendingMod.new_check_in} → {pendingMod.new_check_out}, {pendingMod.new_guest_count} guests
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => handleModAction(pendingMod.id, 'approve')}
                          className="flex-1 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                          Approve
                        </button>
                        <button onClick={() => handleModAction(pendingMod.id, 'reject')}
                          className="flex-1 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {role === 'guest' && canReview && (
                <ActionButton
                  icon={HiOutlineChatBubbleOvalLeftEllipsis}
                  label="Write Review"
                  onClick={handleWriteReview}
                  variant="primary"
                />
              )}
              {role === 'guest' && canCancel && (
                <ActionButton
                  icon={HiOutlineXCircle}
                  label="Cancel Booking"
                  onClick={() => setShowCancelModal(true)}
                  variant="danger"
                />
              )}
            </div>

            {/* Booking Timeline */}
            <div className="space-y-2 mt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-text flex items-center gap-2">
                <HiOutlineCalendar className="w-4 h-4" />
                Booking Timeline
              </h3>
              {timelineLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-divider mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 w-48 bg-divider rounded" />
                        <div className="h-2.5 w-24 bg-divider rounded mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : timeline.length === 0 ? (
                <p className="text-xs text-secondary-text py-2">No timeline events recorded yet.</p>
              ) : (
                <div className="relative py-1">
                  <div className="absolute left-[3px] top-1 bottom-1 w-px bg-divider" />
                  <div className="space-y-4">
                    {timeline.map((ev, i) => {
                      const isLast = i === timeline.length - 1
                      const colorMap = {
                        created: 'bg-primary',
                        confirmed: 'bg-emerald-400',
                        cancelled: 'bg-red-400',
                        checkin: 'bg-blue-400',
                        complete: 'bg-gray-400',
                        modification_requested: 'bg-amber-400',
                        modification_approved: 'bg-emerald-400',
                        modification_rejected: 'bg-red-400',
                      }
                      const dotColor = colorMap[ev.event_type] || 'bg-primary'
                      return (
                        <div key={ev.id} className="flex items-start gap-3 relative">
                          <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 flex-shrink-0 z-10 ${isLast ? 'ring-2 ring-white' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-main-text leading-snug">{ev.event_label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium text-secondary-text">{ev.actor_role}</span>
                              {ev.actor_name && <span className="text-[10px] text-secondary-text">·</span>}
                              {ev.actor_name && <span className="text-[10px] text-secondary-text">{ev.actor_name}</span>}
                              <span className="text-[10px] text-secondary-text">·</span>
                              <span className="text-[10px] text-secondary-text">
                                {new Date(ev.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {role === 'guest' && b.status === 'Confirmed' && (
              <ActionButton
                icon={HiOutlinePencilSquare}
                label="Modify Booking"
                onClick={() => setShowModifyModal(true)}
                variant="outline"
              />
            )}

            <ComingSoonCard
              icon={HiOutlineChatBubbleOvalLeftEllipsis}
              title="Contact Host"
              description="Send a message directly to your host"
            />
            <ComingSoonCard
              icon={HiOutlineMap}
              title="Directions"
              description="Get directions to the property"
            />

            {/* Modification History */}
            <div className="space-y-2 mt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-text flex items-center gap-2">
                <HiOutlinePencilSquare className="w-4 h-4" />
                Modification History
              </h3>
              <ModificationHistory modifications={modifications} loading={modsLoading} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-4 border-t border-divider flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-secondary-text hover:text-main-text hover:bg-divider transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {showModifyModal && (
        <BookingModificationModal
          booking={b}
          onClose={() => setShowModifyModal(false)}
          onSubmit={handleModifySubmit}
          loading={modifyLoading}
        />
      )}

      {showCancelModal && (
        <CancellationModal
          booking={b}
          role={role}
          onClose={() => setShowCancelModal(false)}
          onSubmit={handleCancelSubmit}
          loading={cancelLoading}
        />
      )}
    </div>
  )
}
