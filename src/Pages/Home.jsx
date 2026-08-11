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
  const [navigationTarget, setNavigationTarget] = useState(null);
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
  // SECTION NAVIGATION
  // =============================================
  const handleNavigate = (sectionId) => {
    console.log(`📍 Navigating to: ${sectionId}`);
    setNavigationTarget(sectionId);

    const overviewTabs = {
      'financial-review': 'overview',
      'expenses': 'expenses',
      'loans': 'loans',
      'payments': 'payments',
      'performance': 'performance',
      'summary': 'summary'
    };

    // Overview controls its own tab and scroll.
    if (overviewTabs[sectionId]) {
      return;
    }

    const scrollToVisibleSection = (attempt = 0) => {
      const elements = Array.from(
        document.querySelectorAll(`[data-section="${sectionId}"]`)
      );

      const element = elements.find((item) => {
        const style = window.getComputedStyle(item);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               item.getBoundingClientRect().height > 0;
      });

      if (!element) {
        // Backward compatibility with any existing unique id.
        const fallback = document.getElementById(sectionId);
        if (fallback && fallback.getBoundingClientRect().height > 0) {
          scrollToElement(fallback);
          return;
        }

        if (attempt < 10) {
          setTimeout(() => scrollToVisibleSection(attempt + 1), 100 + attempt * 80);
        }
        return;
      }

      scrollToElement(element);
    };

    const scrollToElement = (element) => {
      const navbar = document.querySelector('.navbar');
      const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 70;
      const footer = document.querySelector('.footer-wrapper');
      const footerHeight = footer ? footer.getBoundingClientRect().height : 0;
      const extra = window.innerWidth <= 480 ? 18 : window.innerWidth <= 768 ? 22 : 24;

      const rect = element.getBoundingClientRect();
      const top = Math.max(
        0,
        rect.top + window.scrollY - navbarHeight - extra
      );

      window.scrollTo({ top, behavior: 'smooth' });

      element.classList.add('section-nav-highlight');
      setTimeout(() => element.classList.remove('section-nav-highlight'), 1200);

      // Keep the target above the fixed footer on short screens.
      if (footerHeight > 0 && window.innerHeight < 650) {
        setTimeout(() => {
          const current = element.getBoundingClientRect();
          if (current.bottom > window.innerHeight - footerHeight - 10) {
            window.scrollBy({
              top: current.bottom - (window.innerHeight - footerHeight - 10),
              behavior: 'smooth'
            });
          }
        }, 450);
      }
    };

    setTimeout(() => scrollToVisibleSection(), 80);
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
          --footer-space: 48px;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #06060f;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          padding-top: calc(70px + env(safe-area-inset-top, 0px));
          /* Keep page content above the fixed footer. */
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
           SECTION ANCHOR - GUARANTEED SCROLL
        ============================================= */
        .section-anchor {
          display: block;
          width: 100%;
          position: relative;
          scroll-margin-top: 80px;
          min-height: 10px;
        }

        .section-nav-highlight {
          animation: sectionNavHighlight 1.2s ease;
        }

        @keyframes sectionNavHighlight {
          0% { outline: 2px solid rgba(167,139,250,0); outline-offset: 8px; }
          25% { outline: 2px solid rgba(167,139,250,0.9); outline-offset: 8px; }
          100% { outline: 2px solid rgba(167,139,250,0); outline-offset: 8px; }
        }

        @media (max-width: 768px) {
          .section-anchor {
            scroll-margin-top: calc(65px + env(safe-area-inset-top, 0px));
            min-height: 5px;
          }
        }

        @media (max-width: 480px) {
          .section-anchor {
            scroll-margin-top: calc(55px + env(safe-area-inset-top, 0px));
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
          overflow: visible;
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
          overflow: visible;
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

        .home-end-safe-space {
          width: 100%;
          height: 2px;
          flex-shrink: 0;
        }

        /* =============================================
           FIXED FOOTER
           Always visible at the bottom without covering
           page content or mobile navigation controls.
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

        @media (max-width: 768px) {
          .home-main {
            padding: 0.5rem 0.75rem 1rem;
          }

          .home-container {
            --footer-space: 52px;
            padding-top: calc(55px + env(safe-area-inset-top, 0px));
            padding-bottom: calc(var(--footer-space) + env(safe-area-inset-bottom, 0px));
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
            bottom: calc(var(--footer-space) + 8px + env(safe-area-inset-bottom, 0px));
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
            padding: 0.3rem 0.5rem 1rem;
          }

          .home-container {
            --footer-space: 52px;
            padding-bottom: calc(var(--footer-space) + env(safe-area-inset-bottom, 0px));
          }

          .mobile-layout {
            gap: 0.5rem;
          }

          .mobile-content-wrapper {
            gap: 0.5rem;
          }

          .refresh-indicator {
            bottom: calc(var(--footer-space) + 6px + env(safe-area-inset-bottom, 0px));
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
              <Overview refreshTrigger={refreshTrigger} navigationTarget={navigationTarget} />
            </div>
            <div className="profile-wrapper" data-section="profile-card">
              {/* Profile Card with id="profile-card" */}
              <ProfileCard refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* =============================================
              FULL WIDTH SECTIONS - Desktop Only
              Each has its own ID for scrolling
          ============================================= */}
          <div className="full-width-sections">
            <div data-section="transactions" className="section-anchor">
              <Transactions refreshTrigger={refreshTrigger} />
            </div>
            <div data-section="loan-details" className="section-anchor">
              <Loans refreshTrigger={refreshTrigger} />
            </div>
            <div data-section="trading-journal" className="section-anchor">
              <Trading refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* =============================================
              MOBILE LAYOUT - Profile on TOP
          ============================================= */}
          <div className="mobile-layout">
            <div className="mobile-profile-wrapper" data-section="profile-card">
              <ProfileCard refreshTrigger={refreshTrigger} />
            </div>
            <div className="mobile-content-wrapper">
              <Overview refreshTrigger={refreshTrigger} navigationTarget={navigationTarget} />
              <div data-section="transactions" className="section-anchor">
                <Transactions refreshTrigger={refreshTrigger} />
              </div>
              <div data-section="loan-details" className="section-anchor">
                <Loans refreshTrigger={refreshTrigger} />
              </div>
              <div data-section="trading-journal" className="section-anchor">
                <Trading refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        </main>

        <div className="footer-wrapper">
          <Footer />
        </div>

        <div
          className="home-end-safe-space"
          aria-hidden="true"
        />

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
