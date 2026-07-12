import { HiMagnifyingGlass, HiPlus, HiBell, HiChevronDown, HiBars3 } from 'react-icons/hi2';

const TopNavbar = ({ onAddProperty, onMobileMenuToggle }) => {
  return (
    <header className="h-[80px] bg-white border-b border-divider flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-btn"
        >
          <HiBars3 className="w-6 h-6 text-secondary-text" />
        </button>
        
        <div className="hidden lg:block">
          <h2 className="text-xl font-bold text-main-text">Welcome Back, Rahul! 👋</h2>
        </div>
      </div>

      {/* Center Section - Search Bar */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
          <input
            type="text"
            placeholder="Search bookings, properties..."
            className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-main-text placeholder:text-secondary-text font-medium"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Add Property Button */}
        <button
          onClick={onAddProperty}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-btn hover:bg-primary-hover transition-all duration-300 font-semibold"
        >
          <HiPlus className="w-5 h-5" />
          <span>Add Property</span>
        </button>

        {/* Notification Bell */}
        <button className="relative p-2.5 rounded-btn hover:bg-gray-100 transition-colors">
          <HiBell className="w-6 h-6 text-secondary-text" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
        </button>

        {/* Avatar with Dropdown */}
        <div className="flex items-center gap-3 pl-4 border-l border-divider cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold">
            R
          </div>
          <HiChevronDown className="w-5 h-5 text-secondary-text" />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
