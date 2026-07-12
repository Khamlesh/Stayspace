import { HiPhone, HiChatBubbleLeftRight } from 'react-icons/hi2';

const UpcomingCheckins = ({ checkins }) => {
  const defaultCheckins = checkins || [
    { id: 1, guest: 'Aarav Sharma', property: 'Jaipur Heritage Haveli', date: 'Jul 15, 2024', guests: 2, avatar: 'A' },
    { id: 2, guest: 'Priya Nair', property: 'Goa Seaside Glass Villa', date: 'Jul 22, 2024', guests: 4, avatar: 'P' },
    { id: 3, guest: 'Rohan Mehta', property: 'Jaipur Heritage Haveli', date: 'Aug 1, 2024', guests: 3, avatar: 'R' },
    { id: 4, guest: 'Ananya Rao', property: 'Goa Seaside Glass Villa', date: 'Aug 8, 2024', guests: 2, avatar: 'A' }
  ];

  return (
    <div className="bg-white rounded-card shadow-card border border-divider p-6 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-main-text">Upcoming Check-ins</h3>
        <button className="text-primary text-sm font-semibold hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {defaultCheckins.map((checkin) => (
          <div 
            key={checkin.id}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-btn hover:bg-gray-100 transition-colors"
          >
            {/* Guest Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold flex-shrink-0">
              {checkin.avatar}
            </div>

            {/* Guest Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-main-text truncate">{checkin.guest}</p>
              <p className="text-sm text-secondary-text truncate">{checkin.property}</p>
              <p className="text-xs text-secondary-text mt-1">{checkin.date} • {checkin.guests} guests</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white border border-border rounded-btn hover:bg-gray-50 hover:border-primary transition-all">
                <HiPhone className="w-4 h-4 text-secondary-text hover:text-primary" />
              </button>
              <button className="p-2.5 bg-white border border-border rounded-btn hover:bg-gray-50 hover:border-primary transition-all">
                <HiChatBubbleLeftRight className="w-4 h-4 text-secondary-text hover:text-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingCheckins;
