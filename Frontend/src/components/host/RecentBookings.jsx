import { HiEllipsisVertical } from 'react-icons/hi2';

const RecentBookings = ({ bookings }) => {
  const defaultBookings = bookings || [
    { id: 1, guest: 'Aarav Sharma', property: 'Jaipur Heritage Haveli', checkIn: 'Jul 15, 2024', checkOut: 'Jul 20, 2024', status: 'Confirmed' },
    { id: 2, guest: 'Priya Nair', property: 'Goa Seaside Glass Villa', checkIn: 'Jul 22, 2024', checkOut: 'Jul 25, 2024', status: 'Pending' },
    { id: 3, guest: 'Rohan Mehta', property: 'Jaipur Heritage Haveli', checkIn: 'Aug 1, 2024', checkOut: 'Aug 5, 2024', status: 'Confirmed' },
    { id: 4, guest: 'Ananya Rao', property: 'Goa Seaside Glass Villa', checkIn: 'Aug 8, 2024', checkOut: 'Aug 12, 2024', status: 'Cancelled' },
    { id: 5, guest: 'Kabir Singh', property: 'Jaipur Heritage Haveli', checkIn: 'Aug 15, 2024', checkOut: 'Aug 18, 2024', status: 'Confirmed' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-divider p-6 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-main-text">Recent Bookings</h3>
        <button className="text-primary text-sm font-semibold hover:underline">View All</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-divider">
              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-text">Guest</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-text">Property</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-text">Check-in</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-text">Check-out</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-text">Status</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-secondary-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {defaultBookings.map((booking, index) => (
              <tr 
                key={booking.id} 
                className={`border-b border-divider hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm">
                      {booking.guest.charAt(0)}
                    </div>
                    <span className="font-medium text-main-text">{booking.guest}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-secondary-text text-sm">{booking.property}</td>
                <td className="py-4 px-4 text-secondary-text text-sm">{booking.checkIn}</td>
                <td className="py-4 px-4 text-secondary-text text-sm">{booking.checkOut}</td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <button className="p-2 hover:bg-gray-100 rounded-btn transition-colors">
                    <HiEllipsisVertical className="w-5 h-5 text-secondary-text" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentBookings;
