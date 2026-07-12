import { HiStar } from 'react-icons/hi2';

const RecentReviews = ({ reviews }) => {
  const defaultReviews = reviews || [
    {
      id: 1,
      guest: 'Ananya Rao',
      avatar: 'A',
      property: 'Jaipur Heritage Haveli',
      rating: 5,
      review: 'Amazing property! Very clean and well-maintained. The host was extremely responsive and helpful throughout our stay.',
      date: 'Jul 10, 2024'
    },
    {
      id: 2,
      guest: 'Kabir Singh',
      avatar: 'K',
      property: 'Goa Seaside Glass Villa',
      rating: 5,
      review: 'Perfect location with great amenities. The glass villa was exactly as described and the beach views were stunning.',
      date: 'Jul 8, 2024'
    },
    {
      id: 3,
      guest: 'Meera Iyer',
      avatar: 'M',
      property: 'Kerala Backwater Retreat',
      rating: 4,
      review: 'Good experience overall. Very responsive host. The backwater views were beautiful. Would definitely recommend.',
      date: 'Jul 5, 2024'
    },
    {
      id: 4,
      guest: 'Vikram Patel',
      avatar: 'V',
      property: 'Jaipur Heritage Haveli',
      rating: 5,
      review: 'Exceptional stay! The heritage haveli has been beautifully restored while maintaining its authentic charm.',
      date: 'Jul 2, 2024'
    }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <HiStar
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-rating' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-divider p-6 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-main-text">Recent Reviews</h3>
        <button className="text-primary text-sm font-semibold hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {defaultReviews.map((review) => (
          <div 
            key={review.id}
            className="flex gap-4 p-4 bg-gray-50 rounded-card hover:bg-gray-100 transition-colors"
          >
            {/* Guest Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold flex-shrink-0">
              {review.avatar}
            </div>

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-main-text">{review.guest}</p>
                  <p className="text-xs text-secondary-text">{review.property}</p>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <p className="text-sm text-secondary-text line-clamp-2 mb-3">{review.review}</p>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-secondary-text">{review.date}</p>
                <button className="text-xs font-semibold text-primary hover:underline">
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentReviews;
