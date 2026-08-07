import React, { useState, useEffect, useRef } from 'react';
import { Search, LogOut, X, Menu, ChevronDown } from 'lucide-react';

const Navbar = ({ onSearch, onLogout, onNavigate }) => {
  const [searchText, setSearchText] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Sections for navigation
  const sections = [
    { id: 'financial-review', label: 'Financial Overview' },
    { id: 'payment-expenses', label: 'Payment & Expenses' },
    { id: 'borrow-loans', label: 'Borrow & Loans' },
    { id: 'monthly-expenses', label: 'Monthly Expenses' },
    { id: 'top-performers', label: 'Top Performers' },
    { id: 'products-bought', label: 'Products Bought' },
    { id: 'portfolio-distribution', label: 'Portfolio Distribution (All Time)' },
    { id: 'monthly-performance', label: 'Monthly Performance' },
    { id: 'monthly-summary', label: 'Monthly Performance Summary' },
    { id: 'transactions', label: 'Transactions (Give / Take)' },
    { id: 'loan-details', label: 'Loan Details' },
    { id: 'trading-journal', label: 'Trading Journal' },
    { id: 'profile-card', label: 'Profile Card' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (onSearch) onSearch(value);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const handleNavigate = (sectionId) => {
    setShowDropdown(false);
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        // ✅ Dynamic navbar height for mobile
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 70;
        const isMobile = window.innerWidth <= 768;
        const extraPadding = isMobile ? 15 : 0;
        
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - navbarHeight - extraPadding;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    // Close mobile search if open
    if (showMobileSearch) setShowMobileSearch(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .navbar {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          position: fixed;
          top: 0;
          z-index: 100;
          width: 100%;
          background: linear-gradient(90deg, #7C3AED 0%, #4F6BFF 50%, #2EA8FF 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0 2rem;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s ease;
          box-shadow: 0 4px 25px rgba(124, 58, 237, 0.3);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .dashboard-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.5px;
          user-select: none;
          transition: font-size 0.3s ease;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .navbar-center {
          display: flex;
          align-items: center;
          flex: 1;
          justify-content: center;
          max-width: 600px;
          margin: 0 1rem;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* =============================================
           DROPDOWN NAVIGATION
        ============================================= */
        .nav-dropdown {
          position: relative;
          display: inline-block;
        }

        .nav-dropdown-btn {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 0 1rem;
          height: 42px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
        }

        .nav-dropdown-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .nav-dropdown-btn:active {
          transform: scale(0.95);
        }

        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 280px;
          max-height: 400px;
          overflow-y: auto;
          background: rgba(20, 20, 40, 0.95);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 0.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: dropdownSlide 0.25s ease;
          z-index: 200;
        }

        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .nav-dropdown-menu::-webkit-scrollbar {
          width: 4px;
        }
        .nav-dropdown-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .nav-dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.4);
          border-radius: 10px;
        }

        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 0.8rem;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .nav-dropdown-item:hover {
          background: rgba(124, 58, 237, 0.25);
          color: #FFFFFF;
        }

        .nav-dropdown-item .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.2);
        }

        .nav-dropdown-item:hover .dot {
          background: #A78BFA;
        }

        .nav-dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 0.3rem 0.5rem;
        }

        /* =============================================
           SEARCH BOX
        ============================================= */
        .search-box {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 0 0.75rem;
          height: 42px;
          width: 100%;
          max-width: 320px;
          transition: all 0.3s ease;
        }

        .search-box:focus-within {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.45);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: #FFFFFF;
          font-size: 0.9rem;
          font-weight: 500;
          width: 100%;
          margin-left: 0.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        /* =============================================
           ICON & LOGOUT BUTTONS
        ============================================= */
        .icon-btn {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #FFFFFF;
          transition: all 0.3s ease;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }

        .icon-btn:active {
          transform: scale(0.95);
        }

        .logout-btn {
          background: linear-gradient(135deg, #FF5A6E, #F43F5E);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          height: 42px;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(244, 63, 94, 0.35);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, #FF7080, #F43F5E);
          border-color: rgba(255, 255, 255, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(244, 63, 94, 0.5);
        }

        .logout-btn:active {
          transform: scale(0.95);
        }

        /* =============================================
           MOBILE SEARCH DROPDOWN
        ============================================= */
        .mobile-search-dropdown {
          position: absolute;
          top: 70px;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, #7C3AED 0%, #4F6BFF 50%, #2EA8FF 100%);
          backdrop-filter: blur(25px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          z-index: 99;
          animation: slideDown 0.3s ease;
          box-shadow: 0 4px 25px rgba(124, 58, 237, 0.3);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mobile-search-dropdown .search-box-mobile {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 0 0.75rem;
          height: 42px;
          flex: 1;
        }

        .mobile-search-dropdown .search-box-mobile input {
          background: transparent;
          border: none;
          outline: none;
          color: #FFFFFF;
          font-size: 0.9rem;
          font-weight: 500;
          width: 100%;
          margin-left: 0.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .mobile-search-dropdown .search-box-mobile input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .close-search-btn {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #FFFFFF;
          transition: all 0.3s ease;
        }

        .close-search-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.45);
        }

        /* =============================================
           RESPONSIVE
        ============================================= */
        @media (max-width: 1024px) {
          .navbar { padding: 0 1.5rem; }
          .search-box { max-width: 200px; }
        }

        @media (max-width: 768px) {
          .navbar { padding: 0 1rem; height: 60px; }
          .search-box.desktop-search { display: none; }
          .dashboard-title { font-size: 1.1rem; }
          .navbar-right { gap: 0.5rem; }
          .nav-dropdown-btn span { display: none; }
          .nav-dropdown-btn { padding: 0 0.75rem; height: 38px; }
          .logout-btn span { display: none; }
          .logout-btn { padding: 0; width: 38px; height: 38px; justify-content: center; }
          .icon-btn { width: 38px; height: 38px; }
          .nav-dropdown-menu { 
            min-width: 240px; 
            right: 0; 
            left: auto;
            max-height: 300px;
          }
          .mobile-search-btn { display: flex !important; }
          .mobile-search-dropdown { top: 60px; }
        }

        @media (max-width: 480px) {
          .navbar { padding: 0 0.75rem; height: 55px; }
          .dashboard-title { font-size: 0.95rem; }
          .icon-btn { width: 34px; height: 34px; }
          .logout-btn { width: 34px; height: 34px; }
          .nav-dropdown-btn { height: 34px; padding: 0 0.5rem; font-size: 0.7rem; }
          .nav-dropdown-menu { 
            min-width: 200px; 
            max-height: 250px;
            right: 0;
            left: auto;
          }
          .nav-dropdown-item { font-size: 0.7rem; padding: 0.4rem 0.6rem; }
          .mobile-search-dropdown { 
            top: 55px; 
            padding: 0.75rem 1rem; 
          }
        }

        .mobile-search-btn { display: none; }
      `}</style>

      <nav className="navbar">
        {/* LEFT: Dashboard Title */}
        <div className="navbar-left">
          <h1 className="dashboard-title">Dashboard</h1>
        </div>

        {/* CENTER: Search (Desktop) */}
        <div className="navbar-center">
          <div className="search-box desktop-search">
            <Search size={18} color="#FFFFFF" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchText}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* RIGHT: Navigation Dropdown + Logout */}
        <div className="navbar-right">
          {/* Navigation Dropdown */}
          <div className="nav-dropdown" ref={dropdownRef}>
            <button 
              className="nav-dropdown-btn" 
              onClick={toggleDropdown}
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} color="#FFFFFF" />
              <span>Navigate</span>
              <ChevronDown size={14} color="#FFFFFF" />
            </button>

            {showDropdown && (
              <div className="nav-dropdown-menu">
                {sections.map((section, index) => (
                  <div key={section.id}>
                    <div 
                      className="nav-dropdown-item" 
                      onClick={() => handleNavigate(section.id)}
                    >
                      <span className="dot" />
                      {section.label}
                    </div>
                    {index === 0 && <div className="nav-dropdown-divider" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Search Toggle */}
          <button
            className="icon-btn mobile-search-btn"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Toggle mobile search"
          >
            {showMobileSearch ? <X size={18} color="#FFFFFF" /> : <Search size={18} color="#FFFFFF" />}
          </button>

          {/* Logout */}
          <button className="logout-btn" onClick={handleLogout} aria-label="Logout">
            <LogOut size={18} color="#FFFFFF" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Search Dropdown */}
        {showMobileSearch && (
          <div className="mobile-search-dropdown">
            <div className="search-box-mobile">
              <Search size={18} color="#FFFFFF" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchText}
                onChange={handleSearchChange}
                autoFocus
              />
            </div>
            <button className="close-search-btn" onClick={() => setShowMobileSearch(false)} aria-label="Close search">
              <X size={18} color="#FFFFFF" />
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;