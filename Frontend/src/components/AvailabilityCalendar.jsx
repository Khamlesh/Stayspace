import { useState, useMemo } from 'react'
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineInformationCircle } from 'react-icons/hi2'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

function dateInRange(dateStr, ranges) {
  const d = parseDate(dateStr)
  for (const r of ranges) {
    const start = parseDate(r.check_in || r.start_date)
    const end = parseDate(r.check_out || r.end_date)
    if (d >= start && d < end) return true
  }
  return false
}

function rangesOverlap(ciStr, coStr, ranges) {
  const ci = parseDate(ciStr)
  const co = parseDate(coStr)
  for (const r of ranges) {
    const rs = parseDate(r.check_in || r.start_date)
    const re = parseDate(r.check_out || r.end_date)
    if (ci < re && co > rs) return true
  }
  return false
}

export default function AvailabilityCalendar({
  bookedRanges = [],
  blockedRanges = [],
  selectedCheckIn = null,
  selectedCheckOut = null,
  onDateSelect,
  mode = 'guest',
  loading = false,
  onBlockDates,
  onUnblockDate,
  blockedDatesList = [],
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [hoverDate, setHoverDate] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [blockStart, setBlockStart] = useState(null)
  const [blockEnd, setBlockEnd] = useState(null)
  const [blockReason, setBlockReason] = useState('')
  const [showBlockForm, setShowBlockForm] = useState(false)

  const allUnavailable = useMemo(() => [...bookedRanges, ...blockedRanges], [bookedRanges, blockedRanges])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else { setViewMonth(m => m - 1) }
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else { setViewMonth(m => m + 1) }
  }

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  const getDateStatus = (dateStr) => {
    if (dateStr < todayStr) return 'past'
    if (dateInRange(dateStr, bookedRanges)) return 'booked'
    if (dateInRange(dateStr, blockedRanges)) return 'blocked'
    return 'available'
  }

  const isInRange = (dateStr) => {
    if (!selectedCheckIn || !selectedCheckOut) return false
    const d = parseDate(dateStr)
    return d > parseDate(selectedCheckIn) && d < parseDate(selectedCheckOut)
  }

  const handleDateClick = (dateStr) => {
    const status = getDateStatus(dateStr)
    if (status === 'past' || status === 'booked' || status === 'blocked') return

    if (mode === 'guest' && onDateSelect) {
      if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
        onDateSelect(dateStr, null)
      } else {
        if (dateStr <= selectedCheckIn) {
          onDateSelect(dateStr, null)
        } else {
          if (rangesOverlap(selectedCheckIn, dateStr, allUnavailable)) {
            onDateSelect(selectedCheckIn, 'overlap')
          } else {
            onDateSelect(selectedCheckIn, dateStr)
          }
        }
      }
    }

    if (mode === 'host') {
      if (!blockStart || (blockStart && blockEnd)) {
        setBlockStart(dateStr)
        setBlockEnd(null)
        setShowBlockForm(false)
      } else {
        if (dateStr <= blockStart) {
          setBlockStart(dateStr)
          setBlockEnd(null)
        } else {
          if (rangesOverlap(blockStart, dateStr, allUnavailable)) {
            return
          }
          setBlockEnd(dateStr)
          setShowBlockForm(true)
        }
      }
    }
  }

  const handleBlockSubmit = () => {
    if (onBlockDates && blockStart && blockEnd) {
      onBlockDates(blockStart, blockEnd, blockReason)
      setBlockStart(null)
      setBlockEnd(null)
      setBlockReason('')
      setShowBlockForm(false)
    }
  }

  const handleUnblock = (blockId) => {
    if (onUnblockDate) {
      onUnblockDate(blockId)
    }
  }

  const handleMouseEnter = (dateStr, e) => {
    const status = getDateStatus(dateStr)
    if (status === 'booked') {
      setTooltip({ text: 'Booked', x: e.clientX, y: e.clientY })
    } else if (status === 'blocked') {
      setTooltip({ text: 'Blocked by Host', x: e.clientX, y: e.clientY })
    } else if (status === 'past') {
      setTooltip({ text: 'Past date', x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseLeave = () => {
    setTooltip(null)
    setHoverDate(null)
  }

  const renderMonth = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const cells = []

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="w-full aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day)
      const status = getDateStatus(dateStr)
      const isSelected = dateStr === selectedCheckIn || dateStr === selectedCheckOut
      const inRange = isInRange(dateStr)
      const isHovered = dateStr === hoverDate
      const isBlockStart = dateStr === blockStart
      const isBlockEnd = dateStr === blockEnd
      const isBlockRange = mode === 'host' && blockStart && blockEnd &&
        dateStr > blockStart && dateStr < blockEnd

      let cellClass = 'w-full aspect-square flex items-center justify-center text-sm relative transition-all duration-150 '
      let dayNumber = null

      if (status === 'past') {
        cellClass += 'text-gray-300 cursor-not-allowed'
        dayNumber = day
      } else if (status === 'booked') {
        cellClass += 'bg-danger/10 text-danger rounded-lg cursor-not-allowed line-through decoration-1'
        dayNumber = day
      } else if (status === 'blocked') {
        cellClass += 'bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed'
        dayNumber = day
      } else if (isSelected || isBlockStart || isBlockEnd) {
        cellClass += 'bg-primary text-white rounded-lg font-semibold shadow-btn cursor-pointer scale-105'
        dayNumber = day
      } else if (inRange || isBlockRange) {
        cellClass += 'bg-primary/10 text-primary rounded-lg cursor-pointer'
        dayNumber = day
      } else if (isHovered && mode === 'guest' && selectedCheckIn && !selectedCheckOut) {
        cellClass += 'bg-primary/5 text-main-text rounded-lg cursor-pointer'
        dayNumber = day
      } else {
        cellClass += 'text-main-text hover:bg-success/10 hover:rounded-lg cursor-pointer'
        dayNumber = day
      }

      cells.push(
        <div
          key={day}
          className={cellClass}
          onClick={() => handleDateClick(dateStr)}
          onMouseEnter={(e) => {
            if (status !== 'available') handleMouseEnter(dateStr, e)
            if (mode === 'guest' && status === 'available') setHoverDate(dateStr)
          }}
          onMouseLeave={handleMouseLeave}
        >
          {dayNumber}
          {status === 'available' && (
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-success/40" />
          )}
        </div>
      )
    }

    return cells
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="flex justify-between">
          <div className="h-6 w-32 bg-divider rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-divider rounded-lg" />
            <div className="h-8 w-8 bg-divider rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(d => <div key={d} className="h-4 bg-divider rounded" />)}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-divider rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-main-text">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-divider transition-colors"
          >
            <HiOutlineChevronLeft className="w-4 h-4 text-secondary-text" />
          </button>
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
            className="px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-divider transition-colors"
          >
            <HiOutlineChevronRight className="w-4 h-4 text-secondary-text" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-secondary-text uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderMonth(viewYear, viewMonth)}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1 bg-main-text text-white text-xs rounded-lg shadow-lg pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-divider">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
          <span className="text-[10px] text-secondary-text">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-danger/50" />
          <span className="text-[10px] text-secondary-text">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span className="text-[10px] text-secondary-text">Blocked</span>
        </div>
        {(selectedCheckIn || (mode === 'host' && blockStart)) && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[10px] text-secondary-text">Selected</span>
          </div>
        )}
      </div>

      {/* Host Block Date Form */}
      {mode === 'host' && showBlockForm && blockStart && blockEnd && (
        <div className="mt-3 p-3 bg-background rounded-xl border border-divider space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-main-text font-medium">
            <HiOutlineInformationCircle className="w-3.5 h-3.5 text-primary" />
            Block {blockStart} to {blockEnd}
          </div>
          <input
            type="text"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Reason (optional)"
            className="input-field text-xs py-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setBlockStart(null); setBlockEnd(null); setShowBlockForm(false) }}
              className="flex-1 py-2 text-xs font-medium border border-divider rounded-xl hover:bg-divider transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlockSubmit}
              className="flex-1 py-2 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
            >
              Block Dates
            </button>
          </div>
        </div>
      )}

      {/* Host: Blocked Dates List */}
      {mode === 'host' && blockedDatesList.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">Blocked Periods</p>
          {blockedDatesList.map((bd) => (
            <div key={bd.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-divider">
              <div className="text-xs text-main-text">
                <span className="font-medium">{bd.start_date}</span>
                <span className="text-secondary-text"> to </span>
                <span className="font-medium">{bd.end_date}</span>
                {bd.reason && <span className="text-secondary-text ml-1">({bd.reason})</span>}
              </div>
              <button
                onClick={() => handleUnblock(bd.id)}
                className="text-[10px] font-medium text-danger hover:text-red-700 transition-colors px-2 py-1 rounded-lg hover:bg-danger/10"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
