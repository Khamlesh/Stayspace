import { useState, useRef, useEffect } from 'react'
import { HiOutlineArrowDownTray, HiOutlineDocumentText, HiOutlineTableCells, HiOutlineDocument } from 'react-icons/hi2'

function exportCSV(data, filename) {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h] ?? ''
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    }).join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportExcel(data, filename) {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0])
  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Data">
  <Table>
   <Row>${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
   ${data.map(row => `<Row>${headers.map(h => {
     const val = row[h] ?? ''
     const num = Number(val)
     return `<Cell><Data ss:Type="${!isNaN(num) && val !== '' ? 'Number' : 'String'}">${val}</Data></Cell>`
   }).join('')}</Row>`).join('\n   ')}
  </Table>
 </Worksheet>
</Workbook>`
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.xls`
  link.click()
  URL.revokeObjectURL(link.href)
}

async function exportPDF(data, filename, title) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF('l', 'mm', 'a4')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 14, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 22)

  if (data && data.length > 0) {
    const headers = Object.keys(data[0])
    const rows = data.map(row => headers.map(h => String(row[h] ?? '')))
    autoTable(doc, {
      startY: 28,
      head: [headers.map(h => h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [244, 63, 94] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
  }
  doc.save(`${filename}.pdf`)
}

export default function ExportButton({ data, filename = 'export', title = 'Report' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!data || data.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-text bg-white border border-divider rounded-lg hover:bg-divider transition-colors"
      >
        <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
        Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-divider rounded-xl shadow-card-lg py-1 z-50 animate-slide-down">
          <button
            onClick={() => { exportPDF(data, filename, title); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-main-text hover:bg-divider transition-colors"
          >
            <HiOutlineDocumentText className="w-4 h-4 text-danger" />
            Export as PDF
          </button>
          <button
            onClick={() => { exportCSV(data, filename); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-main-text hover:bg-divider transition-colors"
          >
            <HiOutlineTableCells className="w-4 h-4 text-success" />
            Export as CSV
          </button>
          <button
            onClick={() => { exportExcel(data, filename); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-main-text hover:bg-divider transition-colors"
          >
            <HiOutlineDocument className="w-4 h-4 text-info" />
            Export as Excel
          </button>
        </div>
      )}
    </div>
  )
}
