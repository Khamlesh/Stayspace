const IST = { timeZone: 'Asia/Kolkata' }

function toISTDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function istDayKey(d) {
  return d.toLocaleDateString('en-IN', { ...IST, year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatMessageTime(dateStr) {
  const d = toISTDate(dateStr)
  if (!d) return ''
  return d.toLocaleTimeString('en-IN', { ...IST, hour: '2-digit', minute: '2-digit', hour12: true })
}

export function formatPreviewTime(dateStr) {
  const d = toISTDate(dateStr)
  if (!d) return ''

  const todayKey = istDayKey(new Date())
  const msgKey = istDayKey(d)

  if (msgKey === todayKey) {
    return formatMessageTime(dateStr)
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (istDayKey(yesterday) === msgKey) {
    return 'Yesterday, ' + formatMessageTime(dateStr)
  }

  return (
    d.toLocaleDateString('en-IN', { ...IST, day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    formatMessageTime(dateStr)
  )
}

export function getNotificationRelativeTime(dateStr) {
  const d = toISTDate(dateStr)
  if (!d) return ''

  const nowIST = new Date(
    new Date().toLocaleString('en-IN', { ...IST, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  )
  const diffMs = nowIST - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`

  const todayKey = istDayKey(nowIST)
  const msgKey = istDayKey(d)
  if (msgKey === todayKey) return `${diffHr}h ago`

  const yesterday = new Date(nowIST)
  yesterday.setDate(yesterday.getDate() - 1)
  if (istDayKey(yesterday) === msgKey) return 'Yesterday'

  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`

  return d.toLocaleDateString('en-IN', { ...IST, day: 'numeric', month: 'short', year: 'numeric' })
}
