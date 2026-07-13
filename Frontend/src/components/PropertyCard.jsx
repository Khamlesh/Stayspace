import { Link } from 'react-router-dom'
import { formatRupees } from '../utils/currency'
import { useState } from 'react'

const PropertyCard = ({ property }) => {
  const { id, title, address, price_per_night, max_guests, average_rating, review_count, image_url, property_type, bedrooms, bathrooms, beds } = property
  const [imgError, setImgError] = useState(false)

  return (
    <Link to={`/property/${id}`}>
      <div className="card overflow-hidden h-full cursor-pointer group">
        {image_url && !imgError ? (
          <div className="h-48 overflow-hidden">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 h-48 flex items-center justify-center">
            <span className="text-5xl font-bold text-primary/20">{title?.charAt(0) || 'S'}</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            {property_type && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {property_type}
              </span>
            )}
            <h3 className="font-bold text-lg truncate text-main-text">{title}</h3>
          </div>
          <p className="text-sm text-secondary-text truncate">{address}</p>

          <div className="flex justify-between items-center mt-3">
            <div>
              <span className="text-xl font-bold text-primary">{formatRupees(price_per_night)}</span>
              <span className="text-sm text-secondary-text">/night</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-main-text">
                ★ {average_rating || 'New'}
              </div>
              <div className="text-xs text-secondary-text">
                {review_count || 0} reviews
              </div>
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
