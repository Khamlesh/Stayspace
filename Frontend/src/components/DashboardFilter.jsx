import { useState } from 'react'
import { HiOutlineCalendarDays, HiOutlineChevronDown } from 'react-icons/hi2'

const PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '6m', label: 'Last 6 Months' },
  { key: '1y', label: 'Last Year' },
  { key: 'custom', label: 'Custom Range' },
]

function getPresetRange(key) {
  const now = new Date()
  const end = now.toISOString().split('T')[0]
  let start
  switch (key) {
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 7)
      start = d.toISOString().split('T')[0]; break
    }
    case '30d': {
      const d = new Date(now); d.setDate(d.getDate() - 30)
      start = d.toISOString().split('T')[0]; break
    }
    case '6m': {
      const d = new Date(now); d.setMonth(d.getMonth() - 6)
      start = d.toISOString().split('T')[0]; break
    }
    case '1y': {
      const d = new Date(now); d.setFullYear(d.getFullYear() - 1)
      start = d.toISOString().split('T')[0]; break
    }
    default:
      start = null
  }
  return { start, end }
}

export default function DashboardFilter({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(value?.key === 'custom')
  const [customStart, setCustomStart] = useState(value?.start || '')
  const [customEnd, setCustomEnd] = useState(value?.end || '')

  const handlePreset = (key) => {
    if (key === 'custom') {
      setShowCustom(true)
      onChange({ key: 'custom', start: customStart, end: customEnd })
      return
    }
    setShowCustom(false)
    const range = getPresetRange(key)
    onChange({ key, ...range })
  }

  const handleCustomApply = () => {
    onChange({ key: 'custom', start: customStart, end: customEnd })
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-1.5 text-secondary-text">
        <HiOutlineCalendarDays className="w-4 h-4" />
        <span className="text-xs font-medium">Period:</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              value?.key === p.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-secondary-text border-divider hover:border-primary/30 hover:text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 ml-0 sm:ml-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-divider rounded-lg bg-white text-main-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <span className="text-xs text-secondary-text">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-divider rounded-lg bg-white text-main-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
