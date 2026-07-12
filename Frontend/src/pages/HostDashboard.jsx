import { useState, useEffect } from 'react';
import Sidebar from '../components/host/Sidebar';
import TopNavbar from '../components/host/TopNavbar';
import KPICards from '../components/host/KPICards';
import RecentBookings from '../components/host/RecentBookings';
import UpcomingCheckins from '../components/host/UpcomingCheckins';
import MyProperties from '../components/host/MyProperties';
import RecentReviews from '../components/host/RecentReviews';
import MonthlyEarningsChart from '../components/host/MonthlyEarningsChart';
import QuickActions from '../components/host/QuickActions';
import { 
  getDashboardKPI, 
  getRecentBookings, 
  getUpcomingCheckins, 
  getMyProperties,
  getRecentReviews,
  getMonthlyEarnings
} from '../api/hostApi';

const HostDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [kpiData, setKpiData] = useState(null);
  const [bookingsData, setBookingsData] = useState(null);
  const [checkinsData, setCheckinsData] = useState(null);
  const [propertiesData, setPropertiesData] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // In production, these would be actual API calls
      // For now, we'll use the default data from components
      setKpiData(null);
      setBookingsData(null);
      setCheckinsData(null);
      setPropertiesData(null);
      setReviewsData(null);
      setEarningsData(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    setActiveMenu('add-property');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-property':
        setActiveMenu('add-property');
        break;
      case 'manage-listings':
        setActiveMenu('properties');
        break;
      case 'view-reports':
        setActiveMenu('reports');
        break;
      case 'download-report':
        // Handle download
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <main className={`transition-all duration-300 lg:ml-sidebar ${isSidebarCollapsed ? 'lg:ml-20' : ''}`}>
        <TopNavbar onAddProperty={handleAddProperty} onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />
        
        <div className="p-6">
          {/* Row 1: KPI Cards */}
          <div className="mb-6">
            <KPICards data={kpiData} />
          </div>

          {/* Row 2: Recent Bookings & Upcoming Check-ins */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="lg:col-span-2">
              <RecentBookings bookings={bookingsData} />
            </div>
            <div>
              <UpcomingCheckins checkins={checkinsData} />
            </div>
          </div>

          {/* Row 3: My Properties & Recent Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <MyProperties properties={propertiesData} />
            </div>
            <div>
              <RecentReviews reviews={reviewsData} />
            </div>
          </div>

          {/* Row 4: Monthly Earnings Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MonthlyEarningsChart data={earningsData} />
            </div>
            <div>
              <QuickActions onAction={handleQuickAction} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HostDashboard;
