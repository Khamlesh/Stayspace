import { useState, useEffect } from 'react';
import { 
  HiHome, 
  HiBuildingOffice2, 
  HiPlusCircle, 
  HiCalendar, 
  HiCurrencyDollar, 
  HiChartBar, 
  HiStar, 
  HiBell, 
  HiUser, 
  HiCog, 
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark
} from 'react-icons/hi2';
import Logo from '../Logo';

const Sidebar = ({ activeMenu, setActiveMenu, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HiHome },
    { id: 'properties', label: 'My Properties', icon: HiBuildingOffice2 },
    { id: 'add-property', label: 'Add Property', icon: HiPlusCircle },
    { id: 'bookings', label: 'Bookings', icon: HiCalendar },
    { id: 'earnings', label: 'Earnings', icon: HiCurrencyDollar },
    { id: 'reports', label: 'Reports', icon: HiChartBar },
    { id: 'reviews', label: 'Reviews', icon: HiStar },
    { id: 'notifications', label: 'Notifications', icon: HiBell },
    { id: 'profile', label: 'Profile', icon: HiUser },
    { id: 'settings', label: 'Settings', icon: HiCog },
    { id: 'logout', label: 'Logout', icon: HiArrowRightOnRectangle }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed left-0 top-0 h-screen bg-sidebar-bg shadow-card transition-all duration-300 z-50 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-sidebar'}`}
      >
        {/* Logo Section */}
        <div className="h-[80px] flex items-center justify-between px-4 border-b border-divider">
          {!isCollapsed ? (
            <Logo size="md" linkTo="/host" />
          ) : (
            <Logo size="sm" showText={false} linkTo="/host" />
          )}
          
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-btn"
          >
            <HiXMark className="w-6 h-6 text-secondary-text" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {menuItems.slice(0, -1).map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveMenu(item.id);
                      if (window.innerWidth < 1024) setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FFF1F2] text-primary border-l-4 border-primary'
                        : 'text-secondary-text hover:bg-[#F9FAFB] hover:text-main-text'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {!isCollapsed && (
                      <span className="font-medium whitespace-nowrap">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-divider">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn transition-all duration-200 text-secondary-text hover:bg-[#F9FAFB] hover:text-danger`}
          >
            <HiArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-divider">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold">
                R
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-main-text truncate">Rahul Sharma</p>
                <p className="text-xs text-secondary-text">Host</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white rounded-full shadow-md items-center justify-center border border-divider hover:bg-gray-50 transition-colors"
        >
          <HiBars3 className="w-4 h-4 text-secondary-text" />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
