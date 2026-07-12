import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { propertiesAPI } from '../api/client'
import PropertyCard from '../components/PropertyCard'

const Landing = () => {
  const [properties, setProperties] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadFeaturedProperties()
  }, [])

  const loadFeaturedProperties = async () => {
    try {
      const response = await propertiesAPI.list('', 0, 0, 0, '')
      if (response.data.status === 'success') {
        setProperties(response.data.data.slice(0, 6))
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/search?query=${searchQuery}`)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Welcome to StaySpace</h1>
          <p className="text-xl mb-8">Find your perfect stay across India's most loved destinations</p>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Where are you going?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold mb-8">Featured Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Popular Destinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Jaipur', 'Goa', 'Mumbai', 'Delhi', 'Bengaluru', 'Kochi', 'Shimla', 'Udaipur'].map(dest => (
              <div key={dest} className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all">
                <div className="bg-gradient-to-r from-primary to-secondary h-32 rounded-lg mb-4 flex items-center justify-center text-white font-bold">
                  {dest}
                </div>
                <h3 className="font-bold text-lg">{dest}</h3>
                <p className="text-sm text-gray-600">500+ properties</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">What Our Guests Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Ananya Rao', text: 'Amazing experience! The property was exactly as described and the host was very responsive.' },
            { name: 'Kabir Singh', text: 'Best vacation ever. Great location, beautiful views, and comfortable accommodations.' },
            { name: 'Meera Iyer', text: 'Highly recommended! I will definitely book again. StaySpace makes traveling so easy.' }
          ].map((testimonial, idx) => (
            <div key={idx} className="card p-6">
              <div className="text-primary text-2xl mb-2">★★★★★</div>
              <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
              <p className="font-bold text-gray-900">{testimonial.name}</p>
              <p className="text-sm text-gray-600">Verified Guest</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Landing
