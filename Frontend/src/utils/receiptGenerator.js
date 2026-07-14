import jsPDF from 'jspdf'
import 'jspdf-autotable'

const BRAND = { r: 244, g: 63, b: 94 }
const DARK = { r: 17, g: 24, b: 39 }
const GRAY = { r: 107, g: 114, b: 128 }
const LIGHT_BG = { r: 249, g: 250, b: 251 }

function createLogoDataURL(size = 120) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gap = 4
  const cell = (size - gap) / 2
  const rx = 8

  function roundRect(x, y, w, h, r, color, alpha) {
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1
  }

  roundRect(0, 0, cell, cell, rx, '#FFFFFF', 1)
  roundRect(cell + gap, 0, cell, cell, rx, '#FFFFFF', 0.8)
  roundRect(0, cell + gap, cell, cell, rx, '#FFFFFF', 0.55)
  roundRect(cell + gap, cell + gap, cell, cell, rx, '#FFFFFF', 0.3)

  return canvas.toDataURL('image/png')
}

export function generateBookingReceipt(booking) {
  const doc = new jsPDF()
  const w = doc.internal.pageSize.getWidth()
  let y = 0

  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, w, 40, 'F')

  const logoDataURL = createLogoDataURL(120)
  doc.addImage(logoDataURL, 'PNG', 16, 5, 24, 24)

  const textX = 44
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('StaySpace', textX, 18)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('FIND YOUR PERFECT STAY', textX, 26)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('BOOKING RECEIPT', w - 20, 18, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Receipt #${booking.bookingId || booking.id || 'N/A'}`, w - 20, 26, { align: 'right' })

  y = 52
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('BOOKING DETAILS', 20, y)
  y += 2
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
  doc.setLineWidth(0.5)
  doc.line(20, y, w - 20, y)
  y += 8

  const addRow = (label, value, isBold = false) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    doc.text(label, 20, y)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    doc.text(String(value || 'N/A'), 90, y)
    y += 6
  }

  addRow('Booking ID:', `#${booking.bookingId || booking.id}`)
  addRow('Transaction ID:', booking.transactionId || booking.transaction_id || 'N/A')
  addRow('Booking Date:', booking.bookingDate || new Date().toLocaleDateString('en-IN'))
  addRow('Status:', booking.status || 'Confirmed')
  y += 2

  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PROPERTY INFORMATION', 20, y)
  y += 2
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
  doc.line(20, y, w - 20, y)
  y += 8

  addRow('Property:', booking.propertyTitle || booking.property_title || 'N/A')
  addRow('Address:', booking.propertyAddress || booking.property_address || 'N/A')
  y += 2

  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('HOST INFORMATION', 20, y)
  y += 2
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
  doc.line(20, y, w - 20, y)
  y += 8

  addRow('Host Name:', booking.hostName || booking.host_name || 'N/A')
  addRow('Host Email:', booking.hostEmail || booking.host_email || 'N/A')
  addRow('Host Phone:', booking.hostPhone || booking.host_phone || 'Not Available')
  y += 2

  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('STAY DETAILS', 20, y)
  y += 2
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
  doc.line(20, y, w - 20, y)
  y += 8

  addRow('Customer:', booking.customerName || booking.guest_name || 'Guest')
  addRow('Check-in:', booking.checkInDate || booking.check_in || 'N/A')
  addRow('Check-out:', booking.checkOutDate || booking.check_out || 'N/A')
  addRow('Nights:', String(booking.nights || 'N/A'))
  addRow('Guests:', String(booking.guests || booking.guests_count || 1))
  y += 2

  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT INFORMATION', 20, y)
  y += 2
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
  doc.line(20, y, w - 20, y)
  y += 8

  addRow('Payment Method:', booking.paymentMethod || booking.payment_method || 'N/A')
  
  const amt = booking.amount || booking.total_price || 0
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Amount Paid:', 20, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text(`Rs. ${Number(amt).toLocaleString('en-IN')}`, 90, y)
  y += 12

  doc.setFillColor(LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b)
  doc.roundedRect(20, y - 4, w - 40, 16, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('This is a computer-generated receipt. No signature required.', w / 2, y + 6, { align: 'center' })
  y += 16

  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, doc.internal.pageSize.getHeight() - 20, w, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('StaySpace | Find Your Perfect Stay | www.stayspace.com', w / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })

  doc.save(`StaySpace-Receipt-${booking.bookingId || booking.id || 'booking'}.pdf`)
}
