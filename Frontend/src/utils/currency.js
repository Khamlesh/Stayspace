export const formatRupees = (amount) => {
  const value = Number(amount || 0)
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const _inrFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const formatRupeesPDF = (amount) => {
  const value = Number(amount || 0)
  return `Rs. ${_inrFormatter.format(value)}`
}

export const formatCountPDF = (value) => {
  return _inrFormatter.format(Number(value || 0))
}
