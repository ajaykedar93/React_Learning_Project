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

const Home = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const refreshInProgress = useRef(false);
  const refreshCountRef = useRef(0);

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
  // NAVIGATION HANDLER - GUARANTEED SCROLL ON MOBILE & BROWSER
  // =============================================
  const handleNavigate = (sectionId) => {
    console.log(`📍 Navigating to: ${sectionId}`);
    
    // Close dropdown
    const dropdownBtn = document.querySelector('.nav-dropdown-btn');
    if (dropdownBtn) {
      document.body.click();
    }
    
    // Function to scroll to element with multiple attempts
    const scrollToElement = (id, attempt = 0) => {
      const element = document.getElementById(id);
      
      if (element) {
        // Get navbar height dynamically
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 70;
        
        // Check if mobile
        const isMobile = window.innerWidth <= 768;
        const extraPadding = isMobile ? 25 : 15;
        
        // Get element position
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const elementTop = rect.top + scrollY;
        const offsetPosition = Math.max(0, elementTop - navbarHeight - extraPadding);
        
        // Scroll with smooth behavior
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        console.log(`✅ Scrolled to: ${id}, offset: ${offsetPosition}, attempt: ${attempt}`);
        
        // For mobile, do a second scroll after a small delay for accuracy
        if (isMobile && attempt === 0) {
          setTimeout(() => {
            const newRect = element.getBoundingClientRect();
            const newScrollY = window.scrollY || window.pageYOffset || 0;
            const newElementTop = newRect.top + newScrollY;
            const newOffset = Math.max(0, newElementTop - navbarHeight - extraPadding);
            
            window.scrollTo({
              top: newOffset,
              behavior: 'smooth'
            });
            console.log(`✅ Mobile adjustment scroll to: ${id}, offset: ${newOffset}`);
          }, 300);
        }
        
        return true;
      } else {
        console.warn(`⚠️ Element not found: ${id}, attempt ${attempt}`);
        
        // Retry up to 5 times with increasing delays
        if (attempt < 5) {
          const delay = 300 + (attempt * 200);
          setTimeout(() => {
            scrollToElement(id, attempt + 1);
          }, delay);
        }
        return false;
      }
    };
    
    // Start scrolling after a small delay (allow dropdown to close)
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 400 : 250;
    
    setTimeout(() => {
      scrollToElement(sectionId);
    }, delay);
  };

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
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #06060f;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          padding-top: 70px;
          padding-bottom: 72px;
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
           SECTION ANCHOR - GUARANTEED SCROLL
        ============================================= */
        .section-anchor {
          display: block;
          width: 100%;
          position: relative;
          scroll-margin-top: 80px;
          min-height: 10px;
        }

        @media (max-width: 768px) {
          .section-anchor {
            scroll-margin-top: 65px;
            min-height: 5px;
          }
        }

        @media (max-width: 480px) {
          .section-anchor {
            scroll-margin-top: 55px;
            min-height: 5px;
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

        .refresh-text {
          transition: all 0.3s ease;
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .refresh-text.refreshing {
          color: #FCD34D;
        }

        /* =============================================
           DESKTOP LAYOUT
        ============================================= */
        .desktop-layout {
          display: grid !important;
          grid-template-columns: 1fr 380px;
          gap: 1.5rem;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          align-items: start;
          width: 100%;
        }

        .content-wrapper {
          min-width: 0;
          display: flex;
          flex-direction: column;
          width: 100%;
          overflow: hidden;
        }

        .content-wrapper > * {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .profile-wrapper {
          width: 100%;
          max-width: 380px;
          position: sticky;
          top: 1rem;
        }

        .profile-wrapper > * {
          width: 100%;
          max-width: 100%;
        }

        .full-width-sections {
          width: 100%;
          display: flex !important;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .full-width-section {
          width: 100%;
          overflow: hidden;
        }

        .full-width-section > * {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .mobile-layout {
          display: none !important;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
          width: 100%;
        }

        .mobile-layout > * {
          width: 100%;
          max-width: 100%;
        }

        .mobile-profile-wrapper {
          width: 100%;
          max-width: 100%;
        }

        .mobile-profile-wrapper > * {
          width: 100%;
          max-width: 100%;
        }

        .mobile-content-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-content-wrapper > * {
          width: 100%;
          max-width: 100%;
        }

        .footer-wrapper {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          z-index: 100;
        }

        @media (max-width: 768px) {
          .home-main {
            padding: 0.5rem 0.75rem 1rem;
          }

          .home-container {
            padding-top: 55px;
            padding-bottom: 72px;
          }

          .desktop-layout {
            display: none !important;
          }

          .full-width-sections {
            display: none !important;
          }

          .mobile-layout {
            display: flex !important;
          }

          .mobile-content-wrapper {
            gap: 0.75rem;
          }

          .refresh-indicator {
            bottom: 70px;
            right: 10px;
            padding: 0.15rem 0.5rem;
            font-size: 0.45rem;
          }

          .refresh-dot {
            width: 3px;
            height: 3px;
          }
        }

        @media (max-width: 480px) {
          .home-main {
            padding: 0.3rem 0.5rem 0.8rem;
          }

          .mobile-layout {
            gap: 0.5rem;
          }

          .mobile-content-wrapper {
            gap: 0.5rem;
          }

          .refresh-indicator {
            bottom: 55px;
            right: 8px;
            padding: 0.1rem 0.4rem;
            font-size: 0.4rem;
          }

          .refresh-dot {
            width: 3px;
            height: 3px;
          }
        }

        @media (max-width: 1024px) and (min-width: 769px) {
          .home-main {
            padding: 0.75rem 1rem 1.5rem;
          }
          .desktop-layout {
            grid-template-columns: 1fr 340px;
            gap: 1rem;
          }
          .profile-wrapper {
            max-width: 340px;
          }
        }

        @media (min-width: 1400px) {
          .home-main {
            max-width: 1600px;
            padding: 1.5rem 2rem 2rem;
          }
          .desktop-layout {
            grid-template-columns: 1fr 420px;
            gap: 2rem;
          }
          .profile-wrapper {
            max-width: 420px;
          }
        }

        @media (min-width: 1800px) {
          .home-main {
            max-width: 1800px;
            padding: 2rem 3rem 2.5rem;
          }
          .desktop-layout {
            grid-template-columns: 1fr 450px;
            gap: 2.5rem;
          }
          .profile-wrapper {
            max-width: 450px;
          }
        }

        .glass-card {
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
        }

        .number-box {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          width: 100%;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          width: 100%;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          width: 100%;
        }

        .stat-value {
          font-size: 1.4rem;
          font-weight: 800;
        }

        .stat-label {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.2rem;
        }

        @media (max-width: 1024px) {
          .grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .grid-3 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .grid-4 {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.4rem !important;
          }
          .grid-3 {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.4rem !important;
          }
          .grid-2 {
            grid-template-columns: 1fr !important;
            gap: 0.4rem !important;
          }
          .stat-value {
            font-size: 1.1rem !important;
          }
          .stat-label {
            font-size: 0.55rem !important;
          }
          .number-box {
            padding: 0.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .grid-4 {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.3rem !important;
          }
          .grid-3 {
            grid-template-columns: 1fr !important;
            gap: 0.3rem !important;
          }
          .stat-value {
            font-size: 0.9rem !important;
          }
          .stat-label {
            font-size: 0.5rem !important;
          }
          .number-box {
            padding: 0.3rem !important;
            border-radius: 10px !important;
          }
          .glass-card {
            padding: 0.4rem !important;
            border-radius: 10px !important;
          }
        }

        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.5);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
          padding: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-content {
          position: relative;
          z-index: 10000;
        }
      `}</style>

      <div className="home-container">
        <Navbar 
          onSearch={setSearchQuery} 
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />

        <main className="home-main">
          {searchQuery && (
            <div style={{
              padding: '0.4rem 0.8rem',
              marginBottom: '0.6rem',
              background: 'rgba(124,58,237,0.15)',
              borderRadius: '6px',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#A5B4FC',
              fontSize: '0.75rem',
              textAlign: 'center',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              🔍 Results for: <b style={{ color: 'white' }}>{searchQuery}</b>
            </div>
          )}

          {/* =============================================
              DESKTOP LAYOUT - Overview + Profile Side by Side
              With proper section anchors for scrolling
          ============================================= */}
          <div className="desktop-layout">
            <div className="content-wrapper">
              {/* Overview contains many sections with IDs */}
              <Overview refreshTrigger={refreshTrigger} />
            </div>
            <div className="profile-wrapper">
              {/* Profile Card with id="profile-card" */}
              <ProfileCard refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* =============================================
              FULL WIDTH SECTIONS - Desktop Only
              Each has its own ID for scrolling
          ============================================= */}
          <div className="full-width-sections">
            <div id="transactions" className="section-anchor">
              <Transactions refreshTrigger={refreshTrigger} />
            </div>
            <div id="loan-details" className="section-anchor">
              <Loans refreshTrigger={refreshTrigger} />
            </div>
            <div id="trading-journal" className="section-anchor">
              <Trading refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* =============================================
              MOBILE LAYOUT - Profile on TOP
          ============================================= */}
          <div className="mobile-layout">
            <div className="mobile-profile-wrapper">
              <ProfileCard refreshTrigger={refreshTrigger} />
            </div>
            <div className="mobile-content-wrapper">
              <Overview refreshTrigger={refreshTrigger} />
              <div id="transactions" className="section-anchor">
                <Transactions refreshTrigger={refreshTrigger} />
              </div>
              <div id="loan-details" className="section-anchor">
                <Loans refreshTrigger={refreshTrigger} />
              </div>
              <div id="trading-journal" className="section-anchor">
                <Trading refreshTrigger={refreshTrigger} />
              </div>
            </div>
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