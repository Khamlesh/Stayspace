import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { propertiesAPI } from '../../api/client'
import userAPI from '../../api/userApi'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineHeart,
  HiHeart,
  HiOutlineUserGroup,
  HiOutlineHomeModern,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineStar,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
} from 'react-icons/hi2'

const PROPERTY_TYPES = ['All', 'Apartment', 'House', 'Villa']

const SkeletonCard = () => (
  <div className="dashboard-card overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between items-center mt-4">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/5" />
      </div>
      <div className="h-px bg-gray-200 mt-3" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  </div>
)

const UserExplorePage = () => {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlisted, setWishlisted] = useState({})
  const [filters, setFilters] = useState({
    query: '',
    minPrice: 0,
    maxPrice: 10000,
    guests: 0,
    property_type: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchProperties = useCallback(async (pageNum = 1, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const response = await propertiesAPI.list(
        filters.query,
        filters.minPrice,
        filters.maxPrice,
        filters.guests,
        filters.property_type === 'All' ? '' : filters.property_type,
        pageNum,
      )
      const resData = response.data
      const data = resData.status === 'success' ? (resData.data || []) : []
      setProperties((prev) => (append ? [...prev, ...data] : data))
      setTotalPages(resData.total_pages || 1)
      setPage(resData.page || pageNum)
    } catch (err) {
      console.error('Error fetching properties:', err)
      setError('Failed to load properties. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProperties(1, false)
  }, [fetchProperties])

  useEffect(() => {
    if (properties.length === 0) return
    const checkAll = async () => {
      const results = {}
      await Promise.all(
        properties.map(async (p) => {
          try {
            const res = await userAPI.checkWishlist(p.id)
            results[p.id] = res.data?.data?.wishlisted === true
          } catch {
            results[p.id] = false
          }
        }),
      )
      setWishlisted(results)
    }
    checkAll()
  }, [properties])

  const toggleWishlist = async (e, propertyId) => {
    e.preventDefault()
    e.stopPropagation()
    const isWishlisted = wishlisted[propertyId]
    try {
      if (isWishlisted) {
        await userAPI.removeFromWishlist(propertyId)
      } else {
        await userAPI.addToWishlist(propertyId)
      }
      setWishlisted((prev) => ({ ...prev, [propertyId]: !isWishlisted }))
    } catch (err) {
      console.error('Wishlist toggle failed:', err)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      minPrice: 0,
      maxPrice: 10000,
      guests: 0,
      property_type: '',
    })
  }

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    (filters.property_type && filters.property_type !== 'All' ? 1 : 0) +
    (filters.minPrice > 0 ? 1 : 0) +
    (filters.maxPrice < 10000 ? 1 : 0) +
    (filters.guests > 0 ? 1 : 0)

  const renderStars = (rating) => {
    const stars = []
    const rounded = Math.round(rating || 0)
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <HiOutlineStar
          key={i}
          className={`w-3.5 h-3.5 ${i <= rounded ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />,
      )
    }
    return stars
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main-text mb-2">Explore Stays</h1>
        <p className="text-secondary-text">Find your perfect accommodation</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder="Search by city, address, or property name..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-divider bg-white text-main-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg border font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-main-text border-divider hover:bg-gray-50'
          }`}
        >
          <HiOutlineFunnel className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="dashboard-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-main-text">Filter Properties</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <HiOutlineXMark className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-2">
                <HiOutlineHomeModern className="w-4 h-4 inline mr-1" />
                Property Type
              </label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange('property_type', type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.property_type === type || (!filters.property_type && type === 'All')
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-main-text hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-2">
                Min Price: {formatRupees(filters.minPrice)}
              </label>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-2">
                Max Price: {formatRupees(filters.maxPrice)}
              </label>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-2">
                <HiOutlineUserGroup className="w-4 h-4 inline mr-1" />
                Guests
              </label>
              <select
                value={filters.guests}
                onChange={(e) => handleFilterChange('guests', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-divider bg-white text-main-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="0">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="4">4+</option>
                <option value="6">6+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="dashboard-card p-6 mb-6 border-l-4 border-red-500">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchProperties} className="mt-2 text-sm text-primary underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="dashboard-card p-12 text-center">
          <HiOutlineBuildingOffice2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-main-text mb-2">No properties found</h3>
          <p className="text-secondary-text mb-4">
            Try adjusting your filters or search for something else.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="dashboard-card overflow-hidden group cursor-pointer"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              {property.image_url ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={property.image_url}
                    alt={property.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 hidden items-center justify-center">
                    <span className="text-5xl font-bold text-primary/20">
                      {property.title?.charAt(0) || 'S'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
                  <span className="text-5xl font-bold text-primary/20">
                    {property.title?.charAt(0) || 'S'}
                  </span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {property.property_type && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {property.property_type}
                    </span>
                  )}
                  <h3 className="font-bold text-lg truncate text-main-text">{property.title}</h3>
                </div>

                <p className="text-sm text-secondary-text truncate flex items-center gap-1">
                  <HiOutlineMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {property.address}
                </p>

                <div className="flex items-center gap-1 mt-2">
                  {renderStars(property.average_rating)}
                  <span className="text-sm text-secondary-text ml-1">
                    {property.average_rating ? Number(property.average_rating).toFixed(1) : 'New'}
                    {property.review_count > 0 && ` (${property.review_count})`}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div>
                    <span className="text-xl font-bold text-primary">
                      {formatRupees(property.price_per_night)}
                    </span>
                    <span className="text-sm text-secondary-text">/night</span>
                  </div>
                  <span className="text-sm text-secondary-text flex items-center gap-1">
                    <HiOutlineUserGroup className="w-4 h-4" />
                    Up to {property.max_guests}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
                  <p className="text-xs text-secondary-text">
                    {property.bedrooms || 1} bed · {property.bathrooms || 1} bath · {property.beds || 1} beds
                  </p>
                  <button
                    onClick={(e) => toggleWishlist(e, property.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                    aria-label={wishlisted[property.id] ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {wishlisted[property.id] ? (
                      <HiHeart className="w-5 h-5 text-red-500" />
                    ) : (
                      <HiOutlineHeart className="w-5 h-5 text-gray-400 hover:text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && properties.length > 0 && page < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchProperties(page + 1, true)}
            disabled={loadingMore}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

export default UserExplorePage
