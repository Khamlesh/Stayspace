import { formatRupees } from './currency'

function fmtDate(d) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(d) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function filterLabel(filter) {
  if (!filter || filter.key === 'all') return 'All Time'
  const map = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '6m': 'Last 6 Months', '1y': 'Last 1 Year' }
  if (filter.key === 'custom' && filter.start) return `${fmtDate(filter.start)} - ${filter.end ? fmtDate(filter.end) : 'Present'}`
  return map[filter.key] || 'All Time'
}

function csv(val) {
  const s = String(val ?? 'N/A')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function buildHostReportRows(data) {
  const {
    stats, filteredStats, filteredBookings, recentBookings,
    checkins, reviews, chartData, filteredPropertyPerformance,
    filteredBookingStatusDist, avgOccupancy, filter,
  } = data

  const rows = []
  const now = new Date()

  rows.push(['STAYSPACE HOST PERFORMANCE REPORT'])
  rows.push([])
  rows.push(['Host Name', stats?.host_name || 'Host'])
  rows.push(['Report Date', fmtDate(now)])
  rows.push(['Report Time', fmtTime(now)])
  rows.push(['Reporting Period', filterLabel(filter)])
  rows.push([])

  rows.push(['=== PROPERTIES ==='])
  rows.push(['Total Properties', String(stats?.total_properties ?? 0)])
  rows.push(['Top Performing Property', stats?.top_performing_property || 'N/A'])
  rows.push([])

  rows.push(['=== BOOKINGS ==='])
  rows.push(['Total Bookings', String(filteredStats?.total_bookings ?? stats?.total_bookings ?? 0)])
  rows.push(['Completed', String(filteredStats?.completed_bookings ?? stats?.completed_bookings ?? 0)])
  rows.push(['Pending', String(filteredStats?.pending_bookings ?? stats?.pending_bookings ?? 0)])
  rows.push(['Cancelled', String(filteredStats?.cancelled_bookings ?? stats?.cancelled_bookings ?? 0)])
  rows.push([])

  rows.push(['=== REVENUE ==='])
  rows.push(['Monthly Revenue', formatRupees(stats?.monthly_earnings ?? 0)])
  rows.push(['Annual Revenue', formatRupees(stats?.annual_earnings ?? 0)])
  rows.push([])

  rows.push(['=== SATISFACTION ==='])
  rows.push(['Average Rating', stats?.average_rating?.toFixed(1) || '0.0'])
  rows.push(['Occupancy Rate', `${avgOccupancy ?? 0}%`])
  rows.push(['Rating Change', stats?.rating_change != null ? `${stats.rating_change >= 0 ? '+' : ''}${stats.rating_change.toFixed(1)}` : 'N/A'])
  rows.push([])

  if (chartData?.length > 0) {
    rows.push(['=== REVENUE TREND ==='])
    rows.push(['Month', 'Earnings', 'Bookings', 'Occupancy'])
    chartData.forEach(d => {
      rows.push([d.month_label || '-', formatRupees(d.earnings ?? 0), String(d.bookings ?? 0), `${d.occupancy ?? 0}%`])
    })
    rows.push([])
  }

  if (chartData?.length > 0) {
    rows.push(['=== OCCUPANCY TREND ==='])
    rows.push(['Month', 'Occupancy %'])
    chartData.forEach(d => {
      rows.push([d.month_label || '-', `${d.occupancy ?? 0}%`])
    })
    rows.push([])
  }

  if (filteredBookingStatusDist?.length > 0) {
    rows.push(['=== BOOKING STATUS ==='])
    rows.push(['Status', 'Count', 'Percentage'])
    const total = filteredBookingStatusDist.reduce((s, d) => s + (d.count || 0), 0) || 1
    filteredBookingStatusDist.forEach(d => {
      rows.push([d.status || '-', String(d.count ?? 0), `${((d.count / total) * 100).toFixed(1)}%`])
    })
    rows.push([])
  }

  if (filteredPropertyPerformance?.length > 0) {
    rows.push(['=== PROPERTY PERFORMANCE ==='])
    rows.push(['Property', 'Bookings', 'Revenue', 'Rating'])
    filteredPropertyPerformance.forEach(p => {
      rows.push([p.title || '-', String(p.total_bookings ?? 0), formatRupees(p.revenue ?? 0), p.avg_rating > 0 ? `${p.avg_rating}` : '-'])
    })
    rows.push([])
  }

  if (recentBookings?.length > 0) {
    rows.push(['=== RECENT BOOKINGS ==='])
    rows.push(['Booking ID', 'Guest', 'Property', 'Check-in', 'Check-out', 'Guests', 'Status', 'Amount'])
    recentBookings.forEach(b => {
      rows.push([
        `#${b.id ?? b.booking_id ?? '-'}`, b.guest_name || '-', b.property_title || '-',
        b.check_in || '-', b.check_out || '-', String(b.guests_count ?? b.guests ?? 1),
        b.status || '-', formatRupees(b.total_price ?? 0),
      ])
    })
    rows.push([])
  }

  if (checkins?.length > 0) {
    rows.push(['=== UPCOMING CHECK-INS ==='])
    rows.push(['Guest', 'Property', 'Check-in', 'Guests'])
    checkins.forEach(c => {
      rows.push([c.guest_name || '-', c.property_title || '-', c.check_in || '-', String(c.guests_count ?? c.guests ?? 1)])
    })
    rows.push([])
  }

  if (reviews?.length > 0) {
    rows.push(['=== RECENT REVIEWS ==='])
    rows.push(['Guest', 'Property', 'Rating', 'Review', 'Date'])
    reviews.forEach(r => {
      rows.push([
        r.guest_name || '-', r.property_title || '-', `${r.rating ?? 0}/5`,
        (r.comment || '-').substring(0, 100), r.created_at ? r.created_at.split(' ')[0] : '-',
      ])
    })
    rows.push([])
  }

  return rows
}

function buildAdminReportRows(data) {
  const {
    stats, filteredStats, filteredBookings, recentBookings,
    hosts, pendingHosts, complaints, analyticsData,
    topProperties, topCities, openComplaints, resolvedComplaints,
    cancellationRate, platformGrowth, filter, adminName,
  } = data

  const rows = []
  const now = new Date()

  rows.push(['STAYSPACE PLATFORM ANALYTICS REPORT'])
  rows.push([])
  rows.push(['Generated By', adminName || 'Admin'])
  rows.push(['Report Date', fmtDate(now)])
  rows.push(['Report Time', fmtTime(now)])
  rows.push(['Reporting Period', filterLabel(filter)])
  rows.push([])

  rows.push(['=== PLATFORM OVERVIEW ==='])
  rows.push(['Total Users', String(stats?.total_users ?? 0)])
  rows.push(['Total Guests', String(stats?.total_guests ?? 0)])
  rows.push(['Total Hosts', String(stats?.total_hosts ?? 0)])
  rows.push(['Total Properties', String(stats?.total_properties ?? 0)])
  rows.push(['Active Bookings', String(filteredStats?.active_bookings ?? stats?.active_bookings ?? 0)])
  rows.push(['Completed Bookings', String(filteredStats?.completed_bookings ?? stats?.completed_bookings ?? 0)])
  rows.push(['Cancelled Bookings', String(filteredStats?.cancelled_bookings ?? stats?.cancelled_bookings ?? 0)])
  rows.push(['Pending Hosts', String(stats?.pending_hosts ?? 0)])
  rows.push(['Total Complaints', String(stats?.total_complaints ?? 0)])
  rows.push(['Open Complaints', String(openComplaints ?? 0)])
  rows.push(['Total Reviews', String(stats?.total_reviews ?? 0)])
  rows.push(['Platform Growth', platformGrowth || '0%'])
  rows.push(['Cancellation Rate', `${cancellationRate || 0}%`])
  rows.push([])

  rows.push(['=== REVENUE ==='])
  rows.push(['Platform Revenue', formatRupees(stats?.total_revenue ?? 0)])
  rows.push(['Monthly Revenue', formatRupees(stats?.revenue_this_month ?? 0)])
  rows.push(['Host Revenue', formatRupees(stats?.host_revenue ?? 0)])
  rows.push([])

  const userGrowth = stats?.user_growth || []
  if (userGrowth.length > 0) {
    rows.push(['=== USER GROWTH ==='])
    rows.push(['Month', 'Users'])
    userGrowth.forEach(d => { rows.push([d.month_label || d.month || '-', String(d.users ?? 0)]) })
    rows.push([])
  }

  const hostGrowth = stats?.host_growth || []
  if (hostGrowth.length > 0) {
    rows.push(['=== HOST GROWTH ==='])
    rows.push(['Month', 'Hosts'])
    hostGrowth.forEach(d => { rows.push([d.month_label || d.month || '-', String(d.hosts ?? 0)]) })
    rows.push([])
  }

  const bookingTrends = stats?.booking_trends || []
  if (bookingTrends.length > 0) {
    rows.push(['=== BOOKINGS TREND ==='])
    rows.push(['Month', 'Bookings'])
    bookingTrends.forEach(d => { rows.push([d.month || '-', String(d.count ?? 0)]) })
    rows.push([])
  }

  const bookingStatusDist = stats?.booking_status_distribution || []
  if (bookingStatusDist.length > 0) {
    rows.push(['=== BOOKING STATUS ==='])
    rows.push(['Status', 'Count', 'Percentage'])
    const total = bookingStatusDist.reduce((s, d) => s + (d.count || 0), 0) || 1
    bookingStatusDist.forEach(d => {
      rows.push([d.status || '-', String(d.count ?? 0), `${((d.count / total) * 100).toFixed(1)}%`])
    })
    rows.push([])
  }

  const propertyTypeDist = stats?.property_type_distribution || []
  if (propertyTypeDist.length > 0) {
    rows.push(['=== PROPERTY TYPES ==='])
    rows.push(['Type', 'Count', 'Percentage'])
    const total = propertyTypeDist.reduce((s, d) => s + (d.count || 0), 0) || 1
    propertyTypeDist.forEach(d => {
      rows.push([d.type || '-', String(d.count ?? 0), `${((d.count / total) * 100).toFixed(1)}%`])
    })
    rows.push([])
  }

  const reviewAnalytics = stats?.review_analytics || []
  if (reviewAnalytics.length > 0) {
    rows.push(['=== REVIEWS BY RATING ==='])
    rows.push(['Rating', 'Count', 'Percentage'])
    const total = reviewAnalytics.reduce((s, d) => s + (d.count || 0), 0) || 1
    reviewAnalytics.forEach(d => {
      rows.push([`${d.rating} Star${d.rating !== 1 ? 's' : ''}`, String(d.count ?? 0), `${((d.count / total) * 100).toFixed(1)}%`])
    })
    rows.push([])
  }

  if (topCities?.length > 0) {
    rows.push(['=== TOP CITIES ==='])
    rows.push(['City', 'Bookings', 'Revenue'])
    topCities.forEach(d => { rows.push([d.city || '-', String(d.bookings ?? 0), formatRupees(d.revenue ?? 0)]) })
    rows.push([])
  }

  if (topProperties?.length > 0) {
    rows.push(['=== TOP PROPERTIES ==='])
    rows.push(['Property', 'Host', 'Bookings', 'Rating', 'Revenue'])
    topProperties.forEach(d => {
      rows.push([
        d.title || d.property_title || '-', d.host_name || '-',
        String(d.bookings ?? d.total_bookings ?? 0), d.avg_rating > 0 ? `${d.avg_rating}` : '-',
        formatRupees(d.revenue ?? 0),
      ])
    })
    rows.push([])
  }

  if (recentBookings?.length > 0) {
    rows.push(['=== RECENT BOOKINGS ==='])
    rows.push(['Booking ID', 'Guest', 'Host', 'Property', 'Check-in', 'Check-out', 'Status', 'Amount'])
    recentBookings.forEach(b => {
      rows.push([
        `#${b.id ?? b.booking_id ?? '-'}`, b.guest_name || '-', b.host_name || '-',
        b.property_title || '-', b.check_in || '-', b.check_out || '-',
        b.status || '-', formatRupees(b.total_price ?? 0),
      ])
    })
    rows.push([])
  }

  if (pendingHosts?.length > 0) {
    rows.push(['=== PENDING HOST APPROVALS ==='])
    rows.push(['Host Name', 'Email', 'Registration Date', 'Status'])
    pendingHosts.forEach(h => {
      rows.push([
        h.name || h.host_name || '-', h.email || h.host_email || '-',
        fmtDate(h.created_at || h.registered_at || h.registration_date), h.status || '-',
      ])
    })
    rows.push([])
  }

  return rows
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function exportReportCSV(reportType, reportData, filename) {
  const rows = reportType === 'admin' ? buildAdminReportRows(reportData) : buildHostReportRows(reportData)
  const csvContent = rows.map(row => row.map(csv).join(',')).join('\n')
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

export function exportReportExcel(reportType, reportData, filename) {
  const rows = reportType === 'admin' ? buildAdminReportRows(reportData) : buildHostReportRows(reportData)
  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>
   ${rows.map(row => `<Row>${row.map(cell => {
     const val = String(cell ?? '')
     const num = Number(val.replace(/[₹,%]/g, '').replace(/,/g, ''))
     return `<Cell><Data ss:Type="${!isNaN(num) && val !== '' && !/[^0-9.\-]/.test(val.replace(/[₹,%]/g, '').replace(/,/g, '')) ? 'Number' : 'String'}">${val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`
   }).join('')}</Row>`).join('\n   ')}
  </Table>
 </Worksheet>
</Workbook>`
  downloadFile(xmlContent, `${filename}.xls`, 'application/vnd.ms-excel')
}
