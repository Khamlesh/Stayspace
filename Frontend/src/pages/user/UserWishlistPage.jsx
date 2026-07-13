import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import userAPI from '../../api/userApi'
import { formatRupees } from '../../utils/currency'
import { HiOutlineHeart, HiOutlineMapPin, HiOutlineStar, HiOutlineMagnifyingGlass } from 'react-icons/hi2'

function PropertyImage({ src, title }) {
  const [error, setError] = useState(false)
  if (src && !error) {
    return (
      <div className="h-40 rounded-xl overflow-hidden mb-3">
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
    <div className="h-40 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
      <span className="text-4xl font-bold text-primary/30">{title?.charAt(0) || 'S'}</span>
    </div>
  )
}

export default function UserWishlistPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await userAPI.getWishlist()
      if (res.data.status === 'success') setProperties(res.data.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (id) => {
    try {
      await userAPI.removeFromWishlist(id)
      setProperties(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = properties.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">My Wishlist</h1>
          <p className="text-sm text-secondary-text mt-1">{properties.length} properties saved</p>
        </div>
        <button
          onClick={() => navigate('/user/explore')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
        >
          <HiOutlineMagnifyingGlass className="w-4 h-4" /> Explore Properties
        </button>
      </div>

      {!loading && properties.length > 0 && (
        <div className="relative max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search wishlist..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-danger text-sm mb-3">{error}</p>
          <button onClick={load} className="text-primary text-sm font-medium hover:underline">
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-divider rounded-card animate-pulse" />
          ))}
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
              <div className="flex items-center gap-1 mb-2">
                <HiOutlineMapPin className="w-3 h-3 text-secondary-text" />
                <p className="text-xs text-secondary-text truncate">{prop.address}</p>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-primary">{formatRupees(prop.price_per_night)}/night</span>
                <div className="flex items-center gap-1">
                  <HiOutlineStar className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-medium text-secondary-text">{Number(prop.average_rating || 0).toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/property/${prop.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleRemove(prop.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors"
                  title="Remove from Wishlist"
                >
                  <HiOutlineHeart className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <HiOutlineHeart className="w-12 h-12 text-divider mx-auto mb-3" />
          <p className="text-secondary-text mb-3">No properties in your wishlist</p>
          <button onClick={() => navigate('/user/explore')} className="text-primary text-sm font-medium hover:underline">
            Explore Properties
          </button>
        </div>
      )}
    </div>
  )
}
