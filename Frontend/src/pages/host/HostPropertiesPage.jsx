import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import hostAPI from '../../api/hostApi'
import { propertiesAPI } from '../../api/client'
import { HiOutlinePlusCircle, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineCalendarDays } from 'react-icons/hi2'
import AvailabilityCalendar from '../../components/AvailabilityCalendar'

function PropertyImage({ src, title }) {
  const [error, setError] = useState(false)
  if (src && !error) {
    return (
      <div className="h-36 rounded-xl overflow-hidden mb-3">
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setError(true)}
        />
      </div>
    )
  }
  return (
    <div className="h-36 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
      <span className="text-4xl font-bold text-primary/30">{title?.charAt(0) || 'S'}</span>
    </div>
  )
}

export default function HostPropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [availModal, setAvailModal] = useState(null)
  const [bookedRanges, setBookedRanges] = useState([])
  const [blockedRanges, setBlockedRanges] = useState([])
  const [blockedDatesList, setBlockedDatesList] = useState([])
  const [availLoading, setAvailLoading] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await hostAPI.getMyProperties()
      if (res.data.status === 'success') setProperties(res.data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const loadAvailability = async (propertyId) => {
    setAvailLoading(true)
    try {
      const res = await propertiesAPI.getAvailability(propertyId)
      if (res.data.status === 'success') {
        setBookedRanges(res.data.data || [])
        setBlockedRanges(res.data.blocked || [])
        setBlockedDatesList(res.data.blocked || [])
      }
    } catch (e) { console.error(e) }
    finally { setAvailLoading(false) }
  }

  const handleOpenAvailability = async (prop) => {
    setAvailModal(prop)
    await loadAvailability(prop.id)
  }

  const handleBlockDates = async (startDate, endDate, reason) => {
    if (!availModal) return
    try {
      await hostAPI.blockDates(availModal.id, startDate, endDate, reason)
      await loadAvailability(availModal.id)
    } catch (e) {
      console.error('Error blocking dates:', e)
    }
  }

  const handleUnblockDate = async (blockId) => {
    try {
      await hostAPI.unblockDates(blockId)
      if (availModal) await loadAvailability(availModal.id)
    } catch (e) {
      console.error('Error unblocking dates:', e)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await hostAPI.deleteProperty(deleteId)
      setProperties(prev => prev.filter(p => p.id !== deleteId))
    } catch (e) { console.error(e) }
    finally { setDeleteId(null) }
  }

  const filtered = properties.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">My Properties</h1>
          <p className="text-sm text-secondary-text mt-1">{properties.length} properties total</p>
        </div>
        <button
          onClick={() => navigate('/host/add-property')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
        >
          <HiOutlinePlusCircle className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 bg-divider rounded-card animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prop => (
            <div key={prop.id} className="dashboard-card hover:shadow-lg transition-all group">
              <PropertyImage src={prop.image_url} title={prop.title} />
              <div className="flex items-center gap-2 mb-1">
                {prop.property_type && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {prop.property_type}
                  </span>
                )}
                <h3 className="text-base font-semibold text-main-text truncate">{prop.title}</h3>
              </div>
              <p className="text-xs text-secondary-text mb-3 line-clamp-1">{prop.address}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-primary">₹{Number(prop.price_per_night).toLocaleString('en-IN')}/night</span>
                <span className="text-xs text-secondary-text">Max {prop.max_guests} guests</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-secondary-text">Rating: {Number(prop.average_rating || 0).toFixed(1)}</span>
                <span className="text-divider">·</span>
                <span className="text-xs text-secondary-text">{prop.review_count || 0} reviews</span>
                <span className="text-divider">·</span>
                <span className="text-xs text-secondary-text">{prop.bookings || 0} bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/host/add-property?edit=${prop.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleOpenAvailability(prop)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-info bg-info/10 rounded-xl hover:bg-info/20 transition-colors"
                  title="Manage Availability"
                >
                  <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(prop.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-secondary-text mb-3">No properties found</p>
          <button onClick={() => navigate('/host/add-property')} className="text-primary text-sm font-medium hover:underline">
            Add your first property
          </button>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-main-text mb-2">Delete Property</h3>
            <p className="text-sm text-secondary-text mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm font-medium border border-divider rounded-xl hover:bg-divider transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-medium bg-danger text-white rounded-xl hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {availModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-main-text">Manage Availability</h3>
                <p className="text-xs text-secondary-text mt-0.5">{availModal.title}</p>
              </div>
              <button
                onClick={() => { setAvailModal(null); setBookedRanges([]); setBlockedRanges([]); setBlockedDatesList([]) }}
                className="p-1.5 rounded-lg hover:bg-divider transition-colors"
              >
                ✕
              </button>
            </div>
            {availLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 w-32 bg-divider rounded" />
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-divider rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              <AvailabilityCalendar
                bookedRanges={bookedRanges}
                blockedRanges={blockedRanges}
                mode="host"
                loading={false}
                onBlockDates={handleBlockDates}
                onUnblockDate={handleUnblockDate}
                blockedDatesList={blockedDatesList}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
