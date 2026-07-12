import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { propertiesAPI } from '../api/client'
import PropertyCard from '../components/PropertyCard'
import { formatRupees } from '../utils/currency'

const Search = () => {
  const [searchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    query: searchParams.get('query') || searchParams.get('q') || '',
    minPrice: 0,
    maxPrice: 10000,
    guests: 0,
    property_type: ''
  })

  useEffect(() => {
    searchProperties()
  }, [filters])

  const searchProperties = async () => {
    setLoading(true)
    try {
      const params = {
        query: filters.query,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        guests: filters.guests
      }
      if (filters.property_type) params.property_type = filters.property_type
      const response = await propertiesAPI.list(
        filters.query,
        filters.minPrice,
        filters.maxPrice,
        filters.guests,
        filters.property_type || ''
      )
      let data = response.data.status === 'success' ? (response.data.data || []) : []
      if (filters.property_type) {
        data = data.filter(p => p.property_type === filters.property_type)
      }
      setProperties(data)
    } catch (error) {
      console.error('Error searching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Search Properties</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-bold mb-6">Filters</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Search Query</label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="City, address..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Price Range</label>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-600">Min: {formatRupees(filters.minPrice)}</label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Max: {formatRupees(filters.maxPrice)}</label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Property Type</label>
              <select
                value={filters.property_type}
                onChange={(e) => handleFilterChange('property_type', e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Guests</label>
              <select
                value={filters.guests}
                onChange={(e) => handleFilterChange('guests', parseInt(e.target.value))}
                className="input-field"
              >
                <option value="0">Any</option>
                <option value="1">1 Guest</option>
                <option value="2">2+ Guests</option>
                <option value="4">4+ Guests</option>
                <option value="6">6+ Guests</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading properties...</p>
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No properties found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Search
