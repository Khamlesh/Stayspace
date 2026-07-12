import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import hostAPI from '../../api/hostApi'
import { HiOutlineXMark, HiOutlinePlus, HiOutlinePhoto } from 'react-icons/hi2'

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa']
const GUEST_LIMITS = { Apartment: 6, House: 10, Villa: 20 }
const GUEST_SUGGESTIONS = { Apartment: '1-6 guests', House: '1-10 guests', Villa: '1-20 guests' }

export default function HostAddPropertyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const [loading, setLoading] = useState(!!editId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', address: '', price_per_night: '',
    max_guests: '', property_type: 'House', image_url: ''
  })
  const [amenities, setAmenities] = useState([])
  const [amenityInput, setAmenityInput] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageError, setImageError] = useState('')

  useEffect(() => {
    if (editId) {
      hostAPI.getPropertyDetail(editId)
        .then(res => {
          if (res.data.status === 'success') {
            const p = res.data.data
            setForm({
              title: p.title || '',
              description: p.description || '',
              address: p.address || '',
              price_per_night: p.price_per_night || '',
              max_guests: p.max_guests || '',
              property_type: p.property_type || 'House',
              image_url: p.image_url || ''
            })
            setImagePreview(p.image_url || '')
            setAmenities(p.amenities || [])
          }
        })
        .catch(() => setError('Failed to load property'))
        .finally(() => setLoading(false))
    }
  }, [editId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'property_type') {
      const limit = GUEST_LIMITS[value] || 10
      if (parseInt(form.max_guests) > limit) {
        setForm(prev => ({ ...prev, max_guests: String(limit) }))
      }
    }
  }

  const handleImageUrl = (val) => {
    setForm(prev => ({ ...prev, image_url: val }))
    setImageError('')
    if (val.trim()) {
      const img = new Image()
      img.onload = () => { setImagePreview(val); setImageError('') }
      img.onerror = () => { setImagePreview(''); setImageError('Invalid image URL. Please check the link.') }
      img.src = val
    } else {
      setImagePreview('')
    }
  }

  const addAmenity = () => {
    const val = amenityInput.trim()
    if (val && !amenities.includes(val)) {
      setAmenities(prev => [...prev, val])
      setAmenityInput('')
    }
  }

  const removeAmenity = (idx) => {
    setAmenities(prev => prev.filter((_, i) => i !== idx))
  }

  const maxGuests = GUEST_LIMITS[form.property_type] || 10

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim() || !form.description.trim() || !form.address.trim() || !form.price_per_night || !form.max_guests) {
      setError('All required fields must be filled')
      return
    }
    if (parseInt(form.max_guests) > maxGuests) {
      setError(`Maximum guests for ${form.property_type} is ${maxGuests}`)
      return
    }
    if (imageError) {
      setError('Please fix the image URL before saving')
      return
    }
    setSaving(true)
    try {
      const data = {
        ...form,
        price_per_night: parseFloat(form.price_per_night),
        max_guests: parseInt(form.max_guests),
        image_url: form.image_url.trim() || '',
        amenities
      }
      if (editId) {
        await hostAPI.updateProperty({ ...data, property_id: parseInt(editId) })
      } else {
        await hostAPI.createProperty(data)
      }
      navigate('/host/properties')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save property')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-divider rounded animate-pulse" />
        <div className="h-96 bg-divider rounded-card animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-main-text mb-6">
        {editId ? 'Edit Property' : 'Add New Property'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Property Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Heritage Haveli in Jaipur"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Property Type *</label>
          <select
            name="property_type"
            value={form.property_type}
            onChange={handleChange}
            className="input-field"
          >
            {PROPERTY_TYPES.map(t => (
              <option key={t} value={t}>{t} (max {GUEST_LIMITS[t]} guests)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe your property..."
            className="input-field resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Property Image URL</label>
          <input
            type="url"
            value={form.image_url}
            onChange={e => handleImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={`input-field ${imageError ? 'border-danger' : ''}`}
          />
          {imageError && <p className="text-danger text-xs mt-1">{imageError}</p>}
          {imagePreview && (
            <div className="mt-3 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl border border-divider"
                onError={() => { setImagePreview(''); setImageError('Image failed to load') }}
              />
              <button
                type="button"
                onClick={() => { setForm(prev => ({ ...prev, image_url: '' })); setImagePreview(''); setImageError('') }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </div>
          )}
          {!imagePreview && (
            <div className="mt-3 h-32 border-2 border-dashed border-divider rounded-xl flex flex-col items-center justify-center text-secondary-text">
              <HiOutlinePhoto className="w-8 h-8 mb-2 text-secondary-text/50" />
              <p className="text-xs">Paste an image URL above to preview</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Address *</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Full address"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Price per Night (₹) *</label>
            <input
              name="price_per_night"
              type="number"
              min="1"
              value={form.price_per_night}
              onChange={handleChange}
              placeholder="e.g. 2500"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Max Guests *</label>
            <input
              name="max_guests"
              type="number"
              min="1"
              max={maxGuests}
              value={form.max_guests}
              onChange={handleChange}
              placeholder={GUEST_SUGGESTIONS[form.property_type]}
              className="input-field"
            />
            <p className="text-xs text-secondary-text mt-1">{GUEST_SUGGESTIONS[form.property_type]}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-main-text mb-1.5">Amenities</label>
          <div className="flex gap-2 mb-2">
            <input
              value={amenityInput}
              onChange={e => setAmenityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
              placeholder="Add amenity and press Enter..."
              className="input-field flex-1"
            />
            <button type="button" onClick={addAmenity} className="px-4 py-2 bg-divider text-main-text text-sm font-medium rounded-xl hover:bg-border transition-colors">
              <HiOutlinePlus className="w-4 h-4" />
            </button>
          </div>
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a, i) => (
                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {a}
                  <button type="button" onClick={() => removeAmenity(i)} className="hover:text-danger">
                    <HiOutlineXMark className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 text-sm font-medium border border-divider rounded-xl hover:bg-divider transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-3 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : editId ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
