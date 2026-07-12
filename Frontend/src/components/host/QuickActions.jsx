import { HiPlusCircle, HiBuildingOffice2, HiChartBar, HiDocumentArrowDown } from 'react-icons/hi2';

const QuickActionCard = ({ icon: Icon, title, description, color, onClick }) => {
  const colorClasses = {
    pink: 'from-pink-50 to-pink-100 text-pink-600',
    blue: 'from-blue-50 to-blue-100 text-blue-600',
    green: 'from-green-50 to-green-100 text-green-600',
    orange: 'from-orange-50 to-orange-100 text-orange-600'
  };

  return (
    <button
      onClick={onClick}
      className="p-6 bg-gradient-to-br rounded-card border border-divider hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-left group"
    >
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-main-text mb-1">{title}</h4>
      <p className="text-sm text-secondary-text">{description}</p>
    </button>
  );
};

const QuickActions = ({ onAction }) => {
  const actions = [
    {
      icon: HiPlusCircle,
      title: 'Add Property',
      description: 'List a new property',
      color: 'pink',
      action: 'add-property'
    },
    {
      icon: HiBuildingOffice2,
      title: 'Manage Listings',
      description: 'Edit your properties',
      color: 'blue',
      action: 'manage-listings'
    },
    {
      icon: HiChartBar,
      title: 'View Reports',
      description: 'Analytics & insights',
      color: 'green',
      action: 'view-reports'
    },
    {
      icon: HiDocumentArrowDown,
      title: 'Download Report',
      description: 'Export earnings data',
      color: 'orange',
      action: 'download-report'
    }
  ];

  return (
    <div className="bg-white rounded-card shadow-card border border-divider p-6 transition-all duration-300 hover:-translate-y-0.5">
      <h3 className="text-lg font-bold text-main-text mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <QuickActionCard
            key={action.action}
            {...action}
            onClick={() => onAction && onAction(action.action)}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
