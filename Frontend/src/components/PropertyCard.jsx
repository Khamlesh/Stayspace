import { Link } from 'react-router-dom'
import { formatRupees } from '../utils/currency'
import { useState } from 'react'
import { HiOutlineHeart, HiOutlineMapPin } from 'react-icons/hi2'

const typeImages = {
  Apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  Villa: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
  House: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
  Cottage: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80',
  Hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  Resort: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
  Homestay: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=600&q=80',
  default: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
}

const PropertyCard = ({ property, isWishlisted = false, onToggleWishlist, wishlistLoading = false }) => {
  const { id, title, address, price_per_night, max_guests, average_rating, review_count, image_url, property_type, bedrooms, bathrooms, beds } = property
  const [imgError, setImgError] = useState(false)

  const fallbackImg = typeImages[property_type] || typeImages.default
  const showImage = image_url && !imgError

  return (
    <Link to={`/property/${id}`}>
      <div className="card overflow-hidden h-full cursor-pointer group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-500">
        <div className="relative h-52 overflow-hidden">
          {showImage ? (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImgError(true)}
            />
          ) : (
            <img
              src={fallbackImg}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist?.(id) }}
            disabled={wishlistLoading}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110 shadow-soft disabled:opacity-50 disabled:hover:scale-100"
          >
            {wishlistLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            ) : (
              <HiOutlineHeart className={`w-5 h-5 transition-colors duration-300 ${isWishlisted ? 'text-primary fill-primary' : 'text-secondary-text'}`} />
            )}
          </button>

          {/* Property Type Badge */}
          {property_type && (
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-primary shadow-soft">
                {property_type}
              </span>
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg truncate text-main-text group-hover:text-primary transition-colors duration-300">{title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <HiOutlineMapPin className="w-3.5 h-3.5 text-secondary-text flex-shrink-0" />
            <p className="text-sm text-secondary-text truncate">{address}</p>
          </div>

          <div className="flex justify-between items-center mt-3">
            <div>
              <span className="text-xl font-bold text-primary">{formatRupees(price_per_night)}</span>
              <span className="text-sm text-secondary-text">/night</span>
            </div>
            <div className="flex items-center gap-1 bg-rating/10 px-2 py-1 rounded-lg">
              <span className="text-rating text-sm">★</span>
              <span className="text-sm font-semibold text-main-text">{average_rating || 'New'}</span>
              <span className="text-xs text-secondary-text">({review_count || 0})</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
            <p className="text-xs text-secondary-text">
              {bedrooms || 1} bed · {bathrooms || 1} bath · {beds || 1} beds
            </p>
            <p className="text-xs text-secondary-text">
              Up to {max_guests} {max_guests === 1 ? 'guest' : 'guests'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default PropertyCard
