import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineHomeModern,
  HiOutlineMapPin,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineXMark,
} from 'react-icons/hi2'

const TYPE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Apartment', label: 'Apartment' },
  { id: 'House', label: 'House' },
  { id: 'Villa', label: 'Villa' },
]

const TYPE_BADGES = {
  Apartment: 'bg-blue-100 text-blue-700',
  House: 'bg-green-100 text-green-700',
  Villa: 'bg-purple-100 text-purple-700',
}

function StarRating({ rating }) {
  const stars = Number(rating || 0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <HiOutlineStar
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(stars) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-main-text">{stars ? stars.toFixed(1) : 'N/A'}</span>
    </div>
  )
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminAPI.getProperties()
      if (res.data.status === 'success') setProperties(res.data.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await adminAPI.deleteProperty(deleteId)
      setProperties(prev => prev.filter(p => p.id !== deleteId))
      setDeleteId(null)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete property')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    let list = properties
    if (activeTab !== 'all') {
      list = list.filter(p => p.property_type === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q)
      )
    }
    return list
  }, [properties, activeTab, search])

  const tabCounts = useMemo(() => ({
    all: properties.length,
    Apartment: properties.filter(p => p.property_type === 'Apartment').length,
    House: properties.filter(p => p.property_type === 'House').length,
    Villa: properties.filter(p => p.property_type === 'Villa').length,
  }), [properties])

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, p) => sum + Number(p.total_revenue || p.revenue || 0), 0),
    [filtered]
  )

  const avgRating = useMemo(() => {
    const rated = filtered.filter(p => p.average_rating > 0)
    if (!rated.length) return 0
    return rated.reduce((sum, p) => sum + p.average_rating, 0) / rated.length
  }, [filtered])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Properties Management</h1>
        <p className="text-sm text-secondary-text mt-1">View, search, and manage all listed properties</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadProperties} className="underline font-semibold ml-2">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dashboard-card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HiOutlineBuildingOffice2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-secondary-text">Total Properties</p>
            <p className="text-xl font-bold text-main-text">{loading ? '—' : filtered.length}</p>
          </div>
        </div>
        <div className="dashboard-card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <HiOutlineBanknotes className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-secondary-text">Total Revenue</p>
            <p className="text-xl font-bold text-main-text">{loading ? '—' : formatRupees(totalRevenue)}</p>
          </div>
        </div>
        <div className="dashboard-card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <HiOutlineStar className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-secondary-text">Average Rating</p>
            <p className="text-xl font-bold text-main-text">{loading ? '—' : avgRating ? avgRating.toFixed(1) : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
              ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-divider text-secondary-text hover:bg-border'}`}
          >
            {tab.label} ({tabCounts[tab.id] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="dashboard-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-divider rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-divider rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-divider rounded animate-pulse w-1/3" />
                </div>
                <div className="h-3 bg-divider rounded animate-pulse w-20" />
                <div className="h-3 bg-divider rounded animate-pulse w-16" />
                <div className="h-3 bg-divider rounded animate-pulse w-12" />
                <div className="h-8 bg-divider rounded animate-pulse w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 dashboard-card">
          <HiOutlineHomeModern className="w-12 h-12 text-secondary-text/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-main-text mb-2">No properties found</h3>
          <p className="text-sm text-secondary-text">
            {search ? 'Try a different search term.' : 'No properties have been listed yet.'}
          </p>
        </div>
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-divider">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-text">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-text">Host</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-text">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-text">Price/Night</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-text">Bookings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-text">Rating</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-secondary-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(prop => (
                  <tr key={prop.id} className="border-b border-divider/50 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-main-text truncate max-w-[220px]">{prop.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <HiOutlineMapPin className="w-3 h-3 text-secondary-text flex-shrink-0" />
                        <p className="text-xs text-secondary-text truncate max-w-[220px]">{prop.address}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-main-text">{prop.host_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[prop.property_type] || 'bg-gray-100 text-gray-700'}`}>
                        {prop.property_type || 'House'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-main-text">{formatRupees(prop.price_per_night)}</td>
                    <td className="px-4 py-3 text-sm text-main-text">{prop.bookings ?? 0}</td>
                    <td className="px-4 py-3"><StarRating rating={prop.average_rating} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedProperty(prop)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          title="View details"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(prop.id)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                          title="Delete property"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-main-text mb-2">Delete Property</h3>
            <p className="text-sm text-secondary-text mb-6">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium border border-divider rounded-xl hover:bg-divider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium bg-danger text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedProperty(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-main-text">{selectedProperty.title}</h2>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-secondary-text hover:text-main-text p-1 rounded-lg hover:bg-divider transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-background rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text">Address</span>
                    <span className="text-main-text">{selectedProperty.address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text">Host</span>
                    <span className="text-main-text">{selectedProperty.host_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text">Type</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[selectedProperty.property_type] || 'bg-gray-100 text-gray-700'}`}>
                      {selectedProperty.property_type || 'House'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text">Price/Night</span>
                    <span className="text-main-text font-semibold">{formatRupees(selectedProperty.price_per_night)}</span>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text">Total Bookings</span>
                    <span className="text-main-text font-semibold">{selectedProperty.bookings ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text">Rating</span>
                    <StarRating rating={selectedProperty.average_rating} />
                  </div>
                  {selectedProperty.review_count != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-text">Reviews</span>
                      <span className="text-main-text">{selectedProperty.review_count}</span>
                    </div>
                  )}
                  {selectedProperty.max_guests != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-text">Max Guests</span>
                      <span className="text-main-text">{selectedProperty.max_guests}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-divider">
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="w-full py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
