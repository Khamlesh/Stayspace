import { HiPencil, HiEye } from 'react-icons/hi2';

const MyProperties = ({ properties }) => {
  const defaultProperties = properties || [
    {
      id: 1,
      name: 'Jaipur Heritage Haveli',
      location: 'Badi Chaupar, Jaipur, Rajasthan',
      price: '₹4,200',
      rating: 4.8,
      occupancy: 80,
      image: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&h=225&fit=crop'
    },
    {
      id: 2,
      name: 'Goa Seaside Glass Villa',
      location: 'Candolim Beach Road, Goa',
      price: '₹12,500',
      rating: 4.9,
      occupancy: 65,
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=225&fit=crop'
    },
    {
      id: 3,
      name: 'Kerala Backwater Retreat',
      location: 'Alleppey, Kerala',
      price: '₹8,500',
      rating: 4.7,
      occupancy: 90,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=225&fit=crop'
    }
  ];

  return (
    <div className="bg-white rounded-card shadow-card border border-divider p-6 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-main-text">My Properties</h3>
        <button className="text-primary text-sm font-semibold hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {defaultProperties.map((property) => (
          <div 
            key={property.id}
            className="flex gap-4 p-4 bg-gray-50 rounded-card hover:bg-gray-100 transition-colors"
          >
            {/* Property Image */}
            <div className="relative w-48 h-28 flex-shrink-0">
              <img
                src={property.image}
                alt={property.name}
                className="w-full h-full object-cover rounded-btn"
              />
              {/* Occupancy Badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-success text-white text-xs font-semibold rounded-btn">
                {property.occupancy}% Booked
              </div>
            </div>

            {/* Property Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-main-text text-lg">{property.name}</h4>
                <p className="text-sm text-secondary-text mt-1">{property.location}</p>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-secondary-text">Price</p>
                    <p className="font-semibold text-main-text">{property.price}/night</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Rating</p>
                    <p className="font-semibold text-rating flex items-center gap-1">
                      ★ {property.rating}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-btn hover:border-primary hover:text-primary transition-all text-sm font-medium">
                    <HiPencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn hover:bg-primary-hover transition-all text-sm font-medium">
                    <HiEye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyProperties;
