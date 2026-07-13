import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUserCircle,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineCurrencyRupee,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineClipboardDocumentCheck,
  HiOutlineChartBarSquare,
  HiOutlineExclamationTriangle,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineArrowPath,
} from 'react-icons/hi2'

const TABS = ['All', 'Pending', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled']

const STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Checked-In': 'bg-sky-50 text-sky-700 ring-sky-200',
  Completed: 'bg-gray-100 text-gray-700 ring-gray-200',
  Cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const calcNights = (b) =>
  b.nights || Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)))

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getBookings()
      if (res.data.status === 'success') setBookings(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (bookingId, action) => {
    setActionLoading(`${bookingId}-${action}`)
    try {
      await adminAPI.bookingAction(bookingId, action)
      const statusMap = {
        confirm: 'Confirmed',
        cancel: 'Cancelled',
        checkin: 'Checked-In',
        complete: 'Completed',
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: statusMap[action] } : b))
      )
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: statusMap[action] } : null))
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
      setConfirmModal(null)
    }
  }

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        b.guest_name?.toLowerCase().includes(q) ||
        b.property_title?.toLowerCase().includes(q) ||
        String(b.id).includes(q)
      const matchTab = activeTab === 'All' || b.status === activeTab
      return matchSearch && matchTab
    })
  }, [bookings, search, activeTab])

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Checked-In').length
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'Pending').length,
      active,
      completed: bookings.filter((b) => b.status === 'Completed').length,
      cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
    }
  }, [bookings])

  const tabCounts = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      acc[tab] = tab === 'All' ? bookings.length : bookings.filter((b) => b.status === tab).length
      return acc
    }, {})
  }, [bookings])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Bookings Management</h1>
          <p className="text-sm text-secondary-text mt-1">
            View, manage, and take action on all platform bookings
          </p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} icon={HiOutlineChartBarSquare} tone="gray" />
        <StatCard label="Pending" value={stats.pending} icon={HiOutlineClock} tone="amber" />
        <StatCard label="Active" value={stats.active} icon={HiOutlineClipboardDocumentCheck} tone="sky" />
        <StatCard label="Completed" value={stats.completed} icon={HiOutlineCheckBadge} tone="emerald" />
        <StatCard label="Cancelled" value={stats.cancelled} icon={HiOutlineExclamationTriangle} tone="red" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by guest, property, or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                ${activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-divider text-secondary-text hover:bg-border'
                }`}
            >
              {tab} ({tabCounts[tab] || 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-1">
          <div className="overflow-x-auto dashboard-card">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-divider">
                  {['ID', 'Guest', 'Host', 'Property', 'Dates', 'Amount', 'Payment', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-divider">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-divider rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto dashboard-card">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-divider">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Host</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-secondary-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onAction={(action) => setConfirmModal({ booking: b, action })}
                  actionLoading={actionLoading}
                  onSelect={() => setSelectedBooking(b)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 dashboard-card">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-secondary-text font-medium">No bookings found</p>
          <p className="text-sm text-secondary-text mt-1">
            {search ? 'Try a different search term' : 'Bookings will appear here once guests start booking'}
          </p>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onAction={(action) => setConfirmModal({ booking: selectedBooking, action })}
          actionLoading={actionLoading}
        />
      )}

      {confirmModal && (
        <ActionConfirmModal
          booking={confirmModal.booking}
          action={confirmModal.action}
          onConfirm={() => handleAction(confirmModal.booking.id, confirmModal.action)}
          onCancel={() => setConfirmModal(null)}
          loading={actionLoading !== null}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    gray: 'bg-gray-50 text-gray-600 ring-gray-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-200',
    sky: 'bg-sky-50 text-sky-600 ring-sky-200',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
  }

  return (
    <div className="dashboard-card p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ring-1 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-secondary-text">{label}</p>
        <p className="text-lg font-bold text-main-text">{value}</p>
      </div>
    </div>
  )
}

function BookingRow({ booking: b, onAction, actionLoading, onSelect }) {
  const nights = calcNights(b)

  const getActions = () => {
    const actions = []
    if (b.status === 'Pending') {
      actions.push({ action: 'confirm', label: 'Confirm', icon: HiOutlineCheckCircle, color: 'text-emerald-600 hover:bg-emerald-50' })
    }
    if (b.status === 'Confirmed') {
      actions.push({ action: 'checkin', label: 'Check-in', icon: HiOutlineCheckCircle, color: 'text-sky-600 hover:bg-sky-50' })
    }
    if (b.status === 'Checked-In') {
      actions.push({ action: 'complete', label: 'Complete', icon: HiOutlineCheckCircle, color: 'text-emerald-600 hover:bg-emerald-50' })
    }
    if (['Pending', 'Confirmed', 'Checked-In'].includes(b.status)) {
      actions.push({ action: 'cancel', label: 'Cancel', icon: HiOutlineXCircle, color: 'text-red-500 hover:bg-red-50' })
    }
    return actions
  }

  const actions = getActions()

  return (
    <tr
      className="border-b border-divider hover:bg-background/50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-primary">#{b.id}</span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <HiOutlineUserCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-main-text truncate">{b.guest_name}</p>
            <p className="text-xs text-secondary-text truncate">{b.guest_email}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-main-text truncate">{b.host_name}</p>
          <p className="text-xs text-secondary-text truncate">{b.host_email}</p>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-main-text truncate">{b.property_title}</p>
          {b.property_type && (
            <span className="inline-block text-xs font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">
              {b.property_type}
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div>
          <p className="text-sm text-main-text">{formatDate(b.check_in)} → {formatDate(b.check_out)}</p>
          <p className="text-xs text-secondary-text">{nights} night{nights > 1 ? 's' : ''}</p>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm font-bold text-main-text">{formatRupees(b.total_price)}</span>
      </td>

      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm text-main-text">{b.payment_method || 'N/A'}</p>
          {b.transaction_id && (
            <p className="text-xs text-secondary-text font-mono truncate">{b.transaction_id}</p>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_COLORS[b.status] || ''}`}>
          {b.status}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {actions.map(({ action, label, icon: Icon, color }) => (
            <button
              key={action}
              onClick={() => onAction(action)}
              disabled={actionLoading === `${b.id}-${action}`}
              className={`p-1.5 rounded-lg transition-colors ${color} disabled:opacity-50`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </td>
    </tr>
  )
}

function BookingDetailModal({ booking: b, onClose, onAction, actionLoading }) {
  const nights = calcNights(b)

  const getActions = () => {
    if (b.status === 'Pending') return [{ action: 'confirm', label: 'Confirm Booking', primary: true }]
    if (b.status === 'Confirmed') return [
      { action: 'checkin', label: 'Check-in Guest', primary: true },
      { action: 'cancel', label: 'Cancel Booking', primary: false, danger: true },
    ]
    if (b.status === 'Checked-In') return [
      { action: 'complete', label: 'Complete Stay', primary: true },
      { action: 'cancel', label: 'Cancel Booking', primary: false, danger: true },
    ]
    return []
  }

  const actions = getActions()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-main-text">Booking #{b.id}</h2>
              <p className="text-sm text-secondary-text mt-1">Full booking details</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-secondary-text hover:text-main-text hover:bg-divider transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_COLORS[b.status] || ''}`}>
              {b.status}
            </span>
            {b.property_type && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 bg-sky-50 text-sky-700 ring-sky-200">
                {b.property_type}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <ModalSection title="Guest Information" icon={HiOutlineUserCircle}>
              <ModalInfo label="Name" value={b.guest_name} />
              <ModalInfo label="Email" value={b.guest_email} />
              <ModalInfo label="Guests" value={`${b.guests_count || 1} person${(b.guests_count || 1) > 1 ? 's' : ''}`} />
            </ModalSection>

            <ModalSection title="Host Information" icon={HiOutlineUserCircle}>
              <ModalInfo label="Name" value={b.host_name} />
              <ModalInfo label="Email" value={b.host_email} />
            </ModalSection>

            <ModalSection title="Property" icon={HiOutlineBuildingOffice2}>
              <ModalInfo label="Title" value={b.property_title} />
              <ModalInfo label="Type" value={b.property_type || 'N/A'} />
              {b.property_address && <ModalInfo label="Address" value={b.property_address} />}
            </ModalSection>

            <ModalSection title="Booking Dates" icon={HiOutlineCalendarDays}>
              <ModalInfo label="Check-in" value={formatDate(b.check_in)} />
              <ModalInfo label="Check-out" value={formatDate(b.check_out)} />
              <ModalInfo label="Duration" value={`${nights} night${nights > 1 ? 's' : ''}`} />
              {b.created_at && <ModalInfo label="Booked On" value={formatDate(b.created_at)} />}
            </ModalSection>

            <ModalSection title="Payment" icon={HiOutlineCreditCard}>
              <ModalInfo label="Total Amount" value={formatRupees(b.total_price)} bold />
              <ModalInfo label="Payment Method" value={b.payment_method || 'N/A'} />
              <ModalInfo label="Transaction ID" value={b.transaction_id || 'N/A'} mono />
              <ModalInfo
                label="Payment Status"
                value={b.payment_amount > 0 ? 'Paid' : 'Pending'}
                highlight={b.payment_amount > 0}
              />
            </ModalSection>

            {b.special_requests && (
              <ModalSection title="Special Requests" icon={HiOutlineExclamationTriangle}>
                <p className="text-sm text-secondary-text">{b.special_requests}</p>
              </ModalSection>
            )}
          </div>

          {actions.length > 0 && (
            <div className="flex gap-3 mt-6 pt-4 border-t border-divider">
              {actions.map(({ action, label, primary, danger }) => (
                <button
                  key={action}
                  onClick={() => {
                    onAction(action)
                    onClose()
                  }}
                  disabled={actionLoading !== null}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50
                    ${primary
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : danger
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200'
                        : 'bg-divider text-secondary-text hover:bg-border'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {actions.length === 0 && (
            <div className="mt-6 pt-4 border-t border-divider text-center">
              <p className="text-sm text-secondary-text">
                {b.status === 'Completed' ? 'This booking has been completed.' : 'This booking has been cancelled.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionConfirmModal({ booking, action, onConfirm, onCancel, loading }) {
  const actionLabels = {
    confirm: { title: 'Confirm Booking', desc: 'Are you sure you want to confirm this booking? The guest will be notified.' },
    cancel: { title: 'Cancel Booking', desc: 'Are you sure you want to cancel this booking? This action cannot be undone.' },
    checkin: { title: 'Check-in Guest', desc: 'Mark this booking as checked-in. The guest has arrived at the property.' },
    complete: { title: 'Complete Stay', desc: 'Mark this stay as completed. This will finalize the booking.' },
  }

  const { title, desc } = actionLabels[action] || { title: 'Take Action', desc: 'Are you sure?' }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${action === 'cancel' ? 'bg-red-50' : 'bg-primary/10'}`}>
            {action === 'cancel' ? (
              <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <HiOutlineCheckCircle className="w-5 h-5 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-bold text-main-text">{title}</h3>
        </div>
        <p className="text-sm text-secondary-text mb-6">{desc}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-divider text-secondary-text hover:bg-border transition-colors disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50
              ${action === 'cancel'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary text-white hover:bg-primary/90'
              }`}
          >
            {loading ? 'Processing...' : 'Yes, Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalSection({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-secondary-text" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary-text">{title}</h3>
      </div>
      <div className="bg-background rounded-lg p-3 space-y-1.5">{children}</div>
    </div>
  )
}

function ModalInfo({ label, value, bold, mono, highlight }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-secondary-text">{label}</span>
      <span
        className={`text-right ${bold ? 'font-bold text-main-text' : 'text-main-text'} ${mono ? 'font-mono text-xs' : ''} ${highlight ? 'text-emerald-600 font-semibold' : ''}`}
      >
        {value || 'N/A'}
      </span>
    </div>
  )
}
