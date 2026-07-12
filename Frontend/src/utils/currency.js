export const formatRupees = (amount) => {
  const value = Number(amount || 0)
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
