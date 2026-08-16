// Home.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileCard from './ProfileCard';
import Navbar from './Navbar';
import Overview from './Overview';
import Transactions from './Transactions';
import Loans from './Loans';
import Trading from './Trading';
import Footer from './Footer';
import Expense from './Expense';
import LoanBorrow from './LoanBorrow';
import Payment from './Payment';
import Performance from './Performance';
import Summary from './Summary';
import ExportDetails from './ExportDetails';

const Home = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [navigationTarget, setNavigationTarget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const refreshTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const refreshInProgress = useRef(false);
  const refreshCountRef = useRef(0);
  const tabContainerRef = useRef(null);

  // Tab configuration - ProfileCard is now first
  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤', component: ProfileCard },
    { id: 'overview', label: 'Overview', icon: '📊', component: Overview },
    { id: 'expense', label: 'Expense', icon: '💳', component: Expense },
    { id: 'loan-borrow', label: 'Loan & Borrow', icon: '💰', component: LoanBorrow },
    { id: 'payment', label: 'Payments', icon: '💎', component: Payment },
    { id: 'performance', label: 'Performance', icon: '📈', component: Performance },
    { id: 'summary', label: 'Summary', icon: '📋', component: Summary },
    { id: 'transactions', label: 'Transactions', icon: '📝', component: Transactions },
    { id: 'trading', label: 'Trading', icon: '📊', component: Trading },
    { id: 'loans', label: 'Loans', icon: '🏦', component: Loans },
    { id: 'export', label: 'Export', icon: '📤', component: ExportDetails },
  ];

  // =============================================
  // LOGOUT HANDLER
  // =============================================
  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    
    if (logout) {
      logout();
    }
    
    navigate('/login', { replace: true });
  };

  // =============================================
  // TAB NAVIGATION
  // =============================================
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setNavigationTarget(tabId);
    
    // Scroll to top when changing tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =============================================
  // CHECK SCROLL POSITION FOR ARROWS
  // =============================================
  const checkScrollPosition = () => {
    const container = tabContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const container = tabContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, []);

  // =============================================
  // SILENT BACKGROUND REFRESH
  // =============================================
  const refreshPage = useCallback(() => {
    if (refreshInProgress.current) return;
    
    refreshInProgress.current = true;
    setIsRefreshing(true);
    refreshCountRef.current += 1;
    
    requestAnimationFrame(() => {
      setRefreshTrigger(prev => prev + 1);
      console.log(`🔄 Auto-refresh #${refreshCountRef.current} at:`, new Date().toLocaleTimeString());
      
      setTimeout(() => {
        refreshInProgress.current = false;
        setIsRefreshing(false);
      }, 200);
    });
  }, []);

  // =============================================
  // AUTO-REFRESH EVERY 30 SECONDS
  // =============================================
  useEffect(() => {
    isMountedRef.current = true;
    
    refreshTimerRef.current = setInterval(() => {
      if (isMountedRef.current && !refreshInProgress.current) {
        refreshPage();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      refreshInProgress.current = false;
    };
  }, [refreshPage]);

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ProfileCard;

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          max-width: 100%;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        body {
          background: #06060f;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          overflow-x: hidden;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        #root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
        }

        .home-container {
          --footer-space: 48px;
          --navbar-height: 70px;
          --tabs-height: 0px;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #06060f;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          padding-top: calc(var(--navbar-height) + env(safe-area-inset-top, 0px));
          padding-bottom: calc(var(--footer-space) + env(safe-area-inset-bottom, 0px));
        }

        .home-main {
          flex: 1;
          max-width: 1600px;
          width: 100%;
          margin: 0 auto;
          padding: 1rem 1.5rem 2rem;
          overflow-x: hidden;
        }

        /* =============================================
           PROFESSIONAL TAB NAVIGATION
        ============================================= */
        .tab-navigation-wrapper {
          position: relative;
          margin-bottom: 1.5rem;
          width: 100%;
          padding: 0 35px;
        }

        .tab-navigation {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          flex-wrap: nowrap;
          backdrop-filter: blur(10px);
          scroll-behavior: smooth;
        }

        .tab-navigation::-webkit-scrollbar {
          display: none;
        }

        /* Scroll indicators */
        .scroll-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          background: rgba(6, 6, 15, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          z-index: 10;
          display: none;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 1.2rem;
          font-weight: 300;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .scroll-indicator:hover {
          background: rgba(6, 6, 15, 0.98);
          color: #fff;
          border-color: rgba(124, 58, 237, 0.4);
          transform: translateY(-50%) scale(1.05);
        }

        .scroll-indicator:active {
          transform: translateY(-50%) scale(0.95);
        }

        .scroll-indicator.left {
          left: 0;
        }

        .scroll-indicator.right {
          right: 0;
        }

        .scroll-indicator.visible {
          display: flex;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          min-height: 40px;
          position: relative;
          flex-shrink: 0;
        }

        .tab-button:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        /* FRESH NEW ACTIVE COLOR - Vibrant Cyan/Teal gradient */
        .tab-button.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(16, 185, 129, 0.15));
          border-color: rgba(6, 182, 212, 0.35);
          box-shadow: 0 4px 25px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(6, 182, 212, 0.1);
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 15%;
          right: 15%;
          height: 2.5px;
          background: linear-gradient(90deg, #06b6d4, #10b981, #06b6d4);
          background-size: 200% 100%;
          border-radius: 2px;
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .tab-button.active .tab-icon {
          filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.3));
        }

        .tab-icon {
          font-size: 1.1rem;
          line-height: 1;
          transition: all 0.3s ease;
        }

        .tab-label {
          font-size: 0.7rem;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
        }

        .tab-button.active .tab-label {
          color: #67e8f9;
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: rgba(6, 182, 212, 0.15);
          border-radius: 20px;
          font-size: 0.55rem;
          color: rgba(255, 255, 255, 0.5);
          margin-left: 2px;
          transition: all 0.3s ease;
        }

        .tab-button.active .tab-count {
          background: rgba(6, 182, 212, 0.25);
          color: #67e8f9;
        }

        /* =============================================
           CONTENT AREA
        ============================================= */
        .tab-content {
          width: 100%;
          animation: fadeSlideIn 0.4s ease;
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =============================================
           REFRESH INDICATOR
        ============================================= */
        .refresh-indicator {
          position: fixed;
          bottom: 80px;
          right: 20px;
          background: rgba(6, 6, 15, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(124, 58, 237, 0.1);
          border-radius: 20px;
          padding: 0.2rem 0.6rem;
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: all 0.5s ease;
          user-select: none;
          pointer-events: none;
          opacity: 0.4;
        }

        .refresh-indicator.active {
          border-color: rgba(124, 58, 237, 0.2);
          background: rgba(6, 6, 15, 0.8);
          opacity: 0.6;
        }

        .refresh-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #10B981;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .refresh-dot.pulsing {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .refresh-dot.refreshing {
          background: #F59E0B;
          animation: spin-dot 0.8s linear infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        @keyframes spin-dot {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }

        /* =============================================
           FIXED FOOTER
        ============================================= */
        .footer-wrapper {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          min-height: var(--footer-space);
          z-index: 5000;
          margin: 0;
          padding: 0 0 env(safe-area-inset-bottom, 0px);
          background: #06060f;
          display: flex;
          align-items: center;
        }

        .footer-wrapper > * {
          width: 100%;
          max-width: 100%;
          margin: 0 !important;
        }

        /* =============================================
           RESPONSIVE DESIGN - All Screen Sizes
        ============================================= */
        
        /* Large Screens (1200px+) */
        @media (min-width: 1200px) {
          .home-main {
            padding: 1.5rem 2rem 2rem;
          }
          
          .tab-navigation-wrapper {
            padding: 0 40px;
          }

          .tab-navigation {
            padding: 0.75rem 1.25rem;
            gap: 0.6rem;
          }
          
          .tab-button {
            padding: 0.7rem 1.5rem;
            font-size: 0.8rem;
            min-height: 44px;
          }
          
          .tab-label {
            font-size: 0.75rem;
          }
          
          .tab-icon {
            font-size: 1.2rem;
          }
        }

        /* Desktop (1024px - 1199px) */
        @media (max-width: 1199px) and (min-width: 1025px) {
          .tab-navigation-wrapper {
            padding: 0 38px;
          }

          .tab-navigation {
            padding: 0.6rem 1rem;
            gap: 0.4rem;
          }
          
          .tab-button {
            padding: 0.5rem 1rem;
            font-size: 0.7rem;
            min-height: 38px;
          }
          
          .tab-label {
            font-size: 0.65rem;
          }
        }

        /* Tablet (768px - 1024px) */
        @media (max-width: 1024px) {
          .tab-navigation-wrapper {
            padding: 0 35px;
          }

          .tab-navigation {
            padding: 0.5rem 0.75rem;
            gap: 0.3rem;
            border-radius: 14px;
          }
          
          .tab-button {
            padding: 0.5rem 0.8rem;
            font-size: 0.7rem;
            min-height: 36px;
            border-radius: 8px;
          }
          
          .tab-label {
            font-size: 0.65rem;
          }
          
          .tab-icon {
            font-size: 1rem;
          }
        }

        /* =============================================
           MOBILE VIEW - FULL PAGE CONTENT + HORIZONTAL TABS
        ============================================= */
        @media (max-width: 768px) {
          .home-container {
            --navbar-height: 55px;
            --footer-space: 58px;
            padding-top: calc(var(--navbar-height) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(var(--footer-space) + env(safe-area-inset-bottom, 0px));
            min-height: 100vh;
            width: 100%;
            overflow-x: hidden;
            overflow-y: visible;
          }

          .home-main {
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
            overflow: visible;
          }

          .tab-navigation-wrapper {
            position: relative;
            top: auto;
            z-index: 50;
            width: 100%;
            margin: 0;
            padding: 10px 34px;
            background: #06060f;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          .tab-navigation {
            width: 100%;
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            padding: 7px;
            overflow-x: auto;
            overflow-y: hidden;
            border-radius: 14px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x proximity;
            scrollbar-width: none;
          }

          .tab-navigation::-webkit-scrollbar {
            display: none;
          }

          .tab-button {
            flex: 0 0 auto;
            min-width: 125px;
            min-height: 48px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            scroll-snap-align: start;
          }

          .tab-icon {
            font-size: 19px;
            flex-shrink: 0;
          }

          .tab-label {
            font-size: 12px;
            white-space: nowrap;
          }

          .tab-content {
            position: relative;
            width: 100%;
            min-width: 0;
            display: block;
            padding: 18px 12px 30px;
            overflow: visible;
            animation: fadeSlideIn 0.25s ease;
          }

          .tab-content > * {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }

          .scroll-indicator {
            width: 30px;
            height: 30px;
            font-size: 20px;
            z-index: 100;
          }

          .scroll-indicator.left {
            left: 2px;
          }

          .scroll-indicator.right {
            right: 2px;
          }

          .scroll-indicator.visible {
            display: flex;
          }

          .footer-wrapper {
            min-height: var(--footer-space);
            height: var(--footer-space);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }

          .refresh-indicator {
            bottom: calc(var(--footer-space) + 8px + env(safe-area-inset-bottom, 0px));
            right: 10px;
          }
        }

        /* Small Mobile */
        @media (max-width: 480px) {
          .tab-navigation-wrapper {
            padding: 9px 30px;
          }

          .tab-navigation {
            gap: 7px;
            padding: 6px;
          }

          .tab-button {
            min-width: 120px;
            min-height: 47px;
            padding: 9px 14px;
            font-size: 12px;
          }

          .tab-icon {
            font-size: 18px;
          }

          .tab-label {
            font-size: 11.5px;
          }

          .tab-content {
            padding: 16px 10px 28px;
          }
        }

        /* Very Small Mobile */
        @media (max-width: 380px) {
          .tab-navigation-wrapper {
            padding: 8px 27px;
          }

          .tab-button {
            min-width: 112px;
            min-height: 45px;
            padding: 8px 12px;
          }

          .tab-icon {
            font-size: 17px;
          }

          .tab-label {
            font-size: 11px;
          }

          .tab-content {
            padding: 15px 9px 26px;
          }
        }

        /* =============================================
           DESKTOP - Hide scroll indicators, normal padding
        ============================================= */
        @media (min-width: 769px) {
          .scroll-indicator {
            display: none !important;
          }
          
          .tab-navigation-wrapper {
            padding: 0 0 !important;
          }

          .tab-content {
            padding: 0 !important;
          }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }

        /* Touch-friendly improvements */
        @media (hover: none) {
          .tab-button:hover {
            transform: none;
            background: transparent;
          }
          
          .tab-button:active {
            transform: scale(0.95);
          }

          .scroll-indicator:hover {
            transform: translateY(-50%) scale(1);
          }
        }

        /* Landscape phone support */
        @media (max-height: 500px) and (orientation: landscape) {
          .home-container {
            --navbar-height: 50px;
            --tabs-height: 56px;
            padding-top: calc(var(--navbar-height) + env(safe-area-inset-top, 0px));
          }
          
          .tab-navigation-wrapper {
            padding: 0.3rem 28px;
            top: calc(var(--navbar-height) + env(safe-area-inset-top, 0px));
          }

          .tab-navigation {
            padding: 0.25rem 0.4rem;
          }
          
          .tab-button {
            min-height: 32px;
            padding: 0.3rem 0.6rem;
            font-size: 0.6rem;
            min-width: 85px;
          }

          .tab-icon {
            font-size: 0.85rem;
          }

          .tab-label {
            font-size: 0.55rem;
          }
          
          .tab-content {
            padding: 0.5rem 0.5rem 1rem;
          }

          .scroll-indicator {
            width: 24px;
            height: 24px;
            font-size: 0.75rem;
          }
        }
      `}</style>

      <div className="home-container">
        <Navbar 
          onSearch={setSearchQuery} 
          onLogout={handleLogout}
          onNavigate={handleTabChange}
        />

        <main className="home-main">
          {searchQuery && (
            <div style={{
              padding: '0.4rem 0.8rem',
              marginBottom: '0.6rem',
              background: 'rgba(6,182,212,0.12)',
              borderRadius: '6px',
              border: '1px solid rgba(6,182,212,0.2)',
              color: '#67e8f9',
              fontSize: '0.75rem',
              textAlign: 'center',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              🔍 Results for: <b style={{ color: 'white' }}>{searchQuery}</b>
            </div>
          )}

          {/* Professional Tab Navigation with Scroll - Sticky on mobile */}
          <div className="tab-navigation-wrapper">
            <button 
              className={`scroll-indicator left ${showLeftArrow ? 'visible' : ''}`}
              onClick={() => {
                const container = tabContainerRef.current;
                if (container) {
                  container.scrollBy({ left: -250, behavior: 'smooth' });
                }
              }}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>

            <div className="tab-navigation" id="tabNavigation" ref={tabContainerRef}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  aria-label={`Switch to ${tab.label} tab`}
                >
                  <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {tab.count && <span className="tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>

            <button 
              className={`scroll-indicator right ${showRightArrow ? 'visible' : ''}`}
              onClick={() => {
                const container = tabContainerRef.current;
                if (container) {
                  container.scrollBy({ left: 250, behavior: 'smooth' });
                }
              }}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="tab-content" role="tabpanel">
            <ActiveComponent 
              refreshTrigger={refreshTrigger} 
              navigationTarget={navigationTarget}
              searchQuery={searchQuery}
            />
          </div>
        </main>

        <div className="footer-wrapper">
          <Footer />
        </div>

        {/* Refresh Indicator */}
        <div className={`refresh-indicator ${isRefreshing ? 'active' : ''}`}>
          <span className={`refresh-dot ${isRefreshing ? 'refreshing' : 'pulsing'}`}></span>
          <span className={`refresh-text ${isRefreshing ? 'refreshing' : ''}`}>
            {isRefreshing ? '↻' : '30s'}
          </span>
        </div>
      </div>
    </>
  );
};

export default Home;