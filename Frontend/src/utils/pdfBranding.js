import autoTable from 'jspdf-autotable'

const BRAND = { r: 244, g: 63, b: 94 }
const DARK = { r: 17, g: 24, b: 39 }
const GRAY = { r: 107, g: 114, b: 128 }
const LIGHT_BG = { r: 249, g: 250, b: 251 }
const BLUE = { r: 59, g: 130, b: 246 }
const GREEN = { r: 34, g: 197, b: 94 }
const RED = { r: 239, g: 68, b: 68 }

const PW = 210
const PH = 297
const ML = 20
const MR = 20
const CW = PW - ML - MR
const FOOTER_H = 16

export function createLogoDataURL(size = 120) {
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

export function drawCoverPage(doc, title, subtitle, metaLines) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, PW, 42, 'F')

  const logo = createLogoDataURL(120)
  doc.addImage(logo, 'PNG', 16, 8, 24, 24)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('StaySpace', 44, 18)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('FIND YOUR PERFECT STAY', 44, 25)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 16, 38)

  if (subtitle) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, PW - 16, 38, { align: 'right' })
  }

  let y = 50
  if (metaLines && metaLines.length > 0) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    metaLines.forEach((line, i) => {
      doc.text(line, ML, y + i * 5)
    })
    y += metaLines.length * 5 + 5
  }

  return y
}

export function drawPageHeader(doc, title) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, PW, 16, 'F')

  const logo = createLogoDataURL(80)
  doc.addImage(logo, 'PNG', 16, 2, 12, 12)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 32, 10)

  return 22
}

export function drawSectionTitle(doc, y, title) {
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, ML, y)
  y += 2
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
  doc.setLineWidth(0.5)
  doc.line(ML, y, PW - MR, y)
  y += 5
  return y
}

export function drawStatCards(doc, y, cards, columns = 3) {
  const cardW = (CW - (columns - 1) * 8) / columns
  const cardH = 16
  const gap = 8

  cards.forEach((card, i) => {
    const col = i % columns
    const row = Math.floor(i / columns)
    const x = ML + col * (cardW + gap)
    const cy = y + row * (cardH + gap)

    doc.setFillColor(LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b)
    doc.roundedRect(x, cy, cardW, cardH, 2, 2, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    doc.text(card.label, x + cardW / 2, cy + 5, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    if (card.colorR !== undefined) {
      doc.setTextColor(card.colorR, card.colorG, card.colorB)
    } else {
      doc.setTextColor(DARK.r, DARK.g, DARK.b)
    }
    doc.text(String(card.value ?? 'N/A'), x + cardW / 2, cy + 12, { align: 'center' })
  })

  const totalRows = Math.ceil(cards.length / columns)
  return y + totalRows * (cardH + gap)
}

export function drawTable(doc, y, headers, rows, options = {}) {
  if (!rows || rows.length === 0) return y

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    head: [headers],
    body: rows,
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [DARK.r, DARK.g, DARK.b],
      lineWidth: 0.1,
      lineColor: [229, 231, 235],
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: [BRAND.r, BRAND.g, BRAND.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b],
    },
    ...options,
  })

  return doc.lastAutoTable.finalY + 4
}

export function drawDisclaimer(doc, y) {
  if (y + 24 > PH - FOOTER_H - 10) {
    doc.addPage()
    y = drawPageHeader(doc, doc._reportTitle || 'STAYSPACE REPORT')
  }

  doc.setFillColor(LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b)
  doc.roundedRect(ML, y, CW, 14, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('This is a computer-generated report. No signature required.', PW / 2, y + 8, { align: 'center' })
  return y + 18
}

export function checkPageBreak(doc, y, needed, headerTitle) {
  if (y + needed > PH - FOOTER_H - 10) {
    doc.addPage()
    return drawPageHeader(doc, headerTitle)
  }
  return y
}

export function addFooters(doc) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
    doc.rect(0, PH - FOOTER_H, PW, FOOTER_H, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('\u00A9 StaySpace | Confidential Business Report', ML, PH - 5)
    doc.text('Generated by StaySpace', PW / 2, PH - 5, { align: 'center' })
    doc.text(`Page ${i} of ${total}`, PW - MR, PH - 5, { align: 'right' })
  }
}

export { BRAND, DARK, GRAY, LIGHT_BG, BLUE, GREEN, RED, PW, PH, ML, MR, CW, FOOTER_H }
