import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyEarningsChart = ({ data }) => {
  const defaultData = data || [
    { month: 'Jan', revenue: 65000, bookings: 12, occupancy: 65 },
    { month: 'Feb', revenue: 72000, bookings: 15, occupancy: 72 },
    { month: 'Mar', revenue: 58000, bookings: 10, occupancy: 58 },
    { month: 'Apr', revenue: 85000, bookings: 18, occupancy: 80 },
    { month: 'May', revenue: 92000, bookings: 20, occupancy: 85 },
    { month: 'Jun', revenue: 96100, bookings: 22, occupancy: 88 }
  ];

  return (
    <div className="bg-white rounded-card shadow-card border border-divider p-6 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-main-text">Monthly Earnings Overview</h3>
        <select className="px-3 py-2 border border-border rounded-input text-sm text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option>Last 6 months</option>
          <option>Last 12 months</option>
          <option>This year</option>
        </select>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={defaultData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value, name) => {
                if (name === 'revenue') return [`₹${value.toLocaleString()}`, 'Revenue'];
                if (name === 'bookings') return [value, 'Bookings'];
                if (name === 'occupancy') return [`${value}%`, 'Occupancy Rate'];
                return [value, name];
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#FF385C" 
              strokeWidth={3}
              dot={{ fill: '#FF385C', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="bookings" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Bookings"
            />
            <Line 
              type="monotone" 
              dataKey="occupancy" 
              stroke="#22C55E" 
              strokeWidth={3}
              dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Occupancy Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyEarningsChart;
