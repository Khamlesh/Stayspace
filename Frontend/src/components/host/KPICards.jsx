import { HiBuildingOffice2, HiCalendar, HiCurrencyDollar, HiStar } from 'react-icons/hi2';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const KPICard = ({ title, value, subtitle, icon: Icon, iconColor, growth, sparklineData, sparklineColor }) => {
  return (
    <div className="bg-white rounded-card shadow-card border border-divider p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg h-[120px] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-secondary-text text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-main-text">{value}</p>
          <p className="text-xs text-secondary-text mt-1">{subtitle}</p>
        </div>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="h-8 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={sparklineColor} 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <span className="text-xs font-semibold text-success">{growth}</span>
      </div>
    </div>
  );
};

const KPICards = ({ data }) => {
  const defaultData = data?.totalProperties ? data : {
    totalProperties: { value: '12', growth: '+2 this month' },
    totalBookings: { value: '48', growth: '+8 this month' },
    monthlyEarnings: { value: '₹96,100', growth: '+15% this month' },
    averageRating: { value: '4.8', growth: '+0.2 this month' }
  };

  const sparklineData = [
    { value: 10 }, { value: 25 }, { value: 18 }, { value: 30 }, { value: 22 }, { value: 35 }, { value: 28 }
  ];

  const cards = [
    {
      title: 'Total Properties',
      value: defaultData.totalProperties.value,
      subtitle: 'Active listings',
      icon: HiBuildingOffice2,
      iconColor: '#FF385C',
      growth: defaultData.totalProperties.growth,
      sparklineData: sparklineData,
      sparklineColor: '#FF385C'
    },
    {
      title: 'Total Bookings',
      value: defaultData.totalBookings.value,
      subtitle: 'This month',
      icon: HiCalendar,
      iconColor: '#3B82F6',
      growth: defaultData.totalBookings.growth,
      sparklineData: sparklineData,
      sparklineColor: '#3B82F6'
    },
    {
      title: 'Monthly Earnings',
      value: defaultData.monthlyEarnings.value,
      subtitle: 'Revenue',
      icon: HiCurrencyDollar,
      iconColor: '#22C55E',
      growth: defaultData.monthlyEarnings.growth,
      sparklineData: sparklineData,
      sparklineColor: '#22C55E'
    },
    {
      title: 'Average Rating',
      value: defaultData.averageRating.value,
      subtitle: 'Out of 5 stars',
      icon: HiStar,
      iconColor: '#FBBF24',
      growth: defaultData.averageRating.growth,
      sparklineData: sparklineData,
      sparklineColor: '#FBBF24'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <KPICard key={index} {...card} />
      ))}
    </div>
  );
};

export default KPICards;
