import React, { useState, useEffect, useRef } from 'react';
import { Search, LogOut, X } from 'lucide-react';

const Navbar = ({ onSearch, onLogout, onNavigate }) => {
  const [searchText, setSearchText] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Sections that actually exist on the Home page.
  const sections = [
    { id: 'financial-review', label: 'Financial Overview', tab: 'overview' },
    { id: 'expenses', label: 'Expenses', tab: 'expenses' },
    { id: 'loans', label: 'Loans & Borrows', tab: 'loans' },
    { id: 'payments', label: 'Payments', tab: 'payments' },
    { id: 'performance', label: 'Performance', tab: 'performance' },
    { id: 'summary', label: 'Summary', tab: 'summary' },
    { id: 'transactions', label: 'Transactions (Give / Take)' },
    { id: 'loan-details', label: 'Loan Details' },
    { id: 'trading-journal', label: 'Trading Journal' },
    { id: 'profile-card', label: 'Profile Card' }
  ];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (onSearch) onSearch(value);
  };

  const searchResults = searchText.trim()
    ? sections.filter((section) =>
        section.label.toLowerCase().includes(searchText.trim().toLowerCase())
      )
    : [];

  const handleSearchResult = (sectionId) => {
    setSearchText('');
    setShowMobileSearch(false);
    if (onNavigate) {
      onNavigate(sectionId);
    }
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .navbar {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          width: 100%;
          box-sizing: border-box;
          background: linear-gradient(90deg, #7C3AED 0%, #4F6BFF 50%, #2EA8FF 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: env(safe-area-inset-top, 0px) 2rem 0;
          height: calc(70px + env(safe-area-inset-top, 0px));
          min-height: calc(70px + env(safe-area-inset-top, 0px));
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
           SEARCH BOX
        ============================================= */
        .search-box {
          position: relative;
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

        .section-search-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          max-height: 320px;
          overflow-y: auto;
          padding: 0.4rem;
          background: rgba(20, 20, 40, 0.98);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          box-shadow: 0 20px 55px rgba(0,0,0,0.45);
          z-index: 500;
        }

        .section-search-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border: 0;
          background: transparent;
          color: rgba(255,255,255,0.88);
          padding: 0.65rem 0.7rem;
          border-radius: 9px;
          cursor: pointer;
          text-align: left;
          font: 600 0.78rem 'Plus Jakarta Sans', sans-serif;
        }

        .section-search-item:hover,
        .section-search-item:focus-visible {
          background: rgba(124,58,237,0.28);
          color: #fff;
          outline: none;
        }

        .search-dot {
          width: 7px;
          height: 7px;
          min-width: 7px;
          border-radius: 50%;
          background: #A78BFA;
        }

        .section-search-empty {
          padding: 0.75rem;
          text-align: center;
          color: rgba(255,255,255,0.6);
          font: 500 0.75rem 'Plus Jakarta Sans', sans-serif;
        }

        /* =============================================
           LOGOUT BUTTON
        ============================================= */
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
          flex-direction: column;
          gap: 0.75rem;
          z-index: 99;
          animation: slideDown 0.3s ease;
          box-shadow: 0 4px 25px rgba(124, 58, 237, 0.3);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mobile-search-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
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

        .mobile-section-search-results {
          width: 100%;
          max-height: 280px;
          overflow-y: auto;
          margin-top: 0.6rem;
          padding: 0.4rem;
          background: rgba(20, 20, 40, 0.98);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
        }

        /* =============================================
           MOBILE SEARCH TOGGLE BUTTON
        ============================================= */
        .mobile-search-btn {
          display: none;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #FFFFFF;
          transition: all 0.3s ease;
        }

        .mobile-search-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }

        /* =============================================
           RESPONSIVE
        ============================================= */
        @media (max-width: 1024px) {
          .navbar { padding: 0 1.5rem; }
          .search-box { max-width: 200px; }
        }

        @media (max-width: 768px) {
          .navbar {
            padding: env(safe-area-inset-top, 0px) 1rem 0;
            height: calc(68px + env(safe-area-inset-top, 0px));
            min-height: calc(68px + env(safe-area-inset-top, 0px));
          }
          .search-box.desktop-search { display: none; }
          .dashboard-title { font-size: 1.1rem; }
          .navbar-right { gap: 0.5rem; }
          .logout-btn span { display: none; }
          .logout-btn { 
            padding: 0; 
            width: 42px; 
            height: 42px; 
            justify-content: center; 
          }
          .mobile-search-btn { 
            display: flex !important; 
            width: 42px;
            height: 42px;
          }
          .mobile-search-dropdown {
            top: calc(68px + env(safe-area-inset-top, 0px));
          }
        }

        @media (max-width: 480px) {
          .navbar {
            padding: env(safe-area-inset-top, 0px) 0.75rem 0;
            height: calc(62px + env(safe-area-inset-top, 0px));
            min-height: calc(62px + env(safe-area-inset-top, 0px));
          }
          .dashboard-title { font-size: 0.95rem; }
          .logout-btn { 
            width: 38px; 
            height: 38px; 
          }
          .mobile-search-btn { 
            width: 38px;
            height: 38px;
          }
          .mobile-search-dropdown {
            top: calc(62px + env(safe-area-inset-top, 0px));
            padding: 0.75rem 1rem;
          }
        }

        .mobile-search-btn { display: none; }

        /*
         * Mobile camera / notch safe area:
         */
        .navbar-safe-spacer {
          display: block;
          width: 100%;
          height: calc(70px + env(safe-area-inset-top, 0px));
          flex: 0 0 auto;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .navbar-safe-spacer {
            height: calc(68px + env(safe-area-inset-top, 0px));
          }
        }

        @media (max-width: 480px) {
          .navbar-safe-spacer {
            height: calc(62px + env(safe-area-inset-top, 0px));
          }
        }
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
              placeholder="Search sections..."
              value={searchText}
              onChange={handleSearchChange}
              aria-label="Search dashboard sections"
            />
            {searchText.trim() && (
              <div className="section-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className="section-search-item"
                      onClick={() => handleSearchResult(section.id)}
                    >
                      <span className="search-dot" />
                      <span>{section.label}</span>
                    </button>
                  ))
                ) : (
                  <div className="section-search-empty">
                    No matching section
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Search (Mobile) + Logout */}
        <div className="navbar-right">
          {/* Mobile Search Toggle */}
          <button
            className="mobile-search-btn"
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
            <div className="mobile-search-row">
              <div className="search-box-mobile">
                <Search size={18} color="#FFFFFF" />
                <input
                  type="text"
                  placeholder="Search sections..."
                  value={searchText}
                  onChange={handleSearchChange}
                  autoFocus
                  aria-label="Search dashboard sections"
                />
              </div>
              <button className="close-search-btn" onClick={() => {
                setShowMobileSearch(false);
                setSearchText('');
              }} aria-label="Close search">
                <X size={18} color="#FFFFFF" />
              </button>
            </div>

            {searchText.trim() && (
              <div className="mobile-section-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className="section-search-item"
                      onClick={() => handleSearchResult(section.id)}
                    >
                      <span className="search-dot" />
                      <span>{section.label}</span>
                    </button>
                  ))
                ) : (
                  <div className="section-search-empty">
                    No matching section
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Safe space below the fixed navbar */}
      <div className="navbar-safe-spacer" aria-hidden="true" />
    </>
  );
};

export default Navbar;