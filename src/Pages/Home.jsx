// Home.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProfileCard from "./ProfileCard";
import Navbar from "./Navbar";
import Overview from "./Overview";
import Trading from "./Trading";
import Footer from "./Footer";
import Expense from "./Expense";
import LoanBorrow from "./LoanBorrow";
import Payment from "./Payment";
import Performance from "./Performance";
import ExportDetails from "./ExportDetails";
import AccessMob from "./Access_mob";

const TABS = [
  { id: "profile", label: "Profile", icon: "👤", component: ProfileCard },
  { id: "overview", label: "Overview", icon: "📊", component: Overview },
  { id: "expense", label: "Expense", icon: "💳", component: Expense },
  { id: "loan-borrow", label: "Loan & Borrow", icon: "💰", component: LoanBorrow },
  { id: "payment", label: "Payments", icon: "💎", component: Payment },
  { id: "performance", label: "Performance", icon: "📈", component: Performance },
  { id: "export", label: "Export", icon: "📤", component: ExportDetails },
  { id: "trading", label: "Trading", icon: "📊", component: Trading },
  { id: "access", label: "Access", icon: "🔑", component: AccessMob },
  
];

const NAVBAR_HEIGHT_DESKTOP = 88;
const TAB_HEIGHT_DESKTOP = 96;
const NAVBAR_HEIGHT_MOBILE = 64;
const TAB_HEIGHT_MOBILE = 76;
const FOOTER_SPACE_DESKTOP = 64;
const FOOTER_SPACE_MOBILE = 72;

const Home = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [navigationTarget, setNavigationTarget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const tabContainerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const refreshInProgressRef = useRef(false);
  const isMountedRef = useRef(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");

    if (typeof logout === "function") {
      logout();
    }

    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setNavigationTarget(tabId);

    // Only the page-content scroller moves.
    requestAnimationFrame(() => {
      const pageScroller = document.querySelector(".home-page-scroll");
      if (pageScroller) {
        pageScroller.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }, []);

  const refreshPage = useCallback(() => {
    if (refreshInProgressRef.current) return;

    refreshInProgressRef.current = true;
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);

    window.setTimeout(() => {
      refreshInProgressRef.current = false;
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }, 450);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    refreshTimerRef.current = window.setInterval(() => {
      if (isMountedRef.current) {
        refreshPage();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;

      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      refreshInProgressRef.current = false;
    };
  }, [refreshPage]);

  const ActiveComponent =
    TABS.find((tab) => tab.id === activeTab)?.component || ProfileCard;

  return (
    <>
      <style>{`
        :root {
          --home-navbar-height: ${NAVBAR_HEIGHT_DESKTOP}px;
          --home-tabs-height: ${TAB_HEIGHT_DESKTOP}px;
          --home-safe-top: env(safe-area-inset-top, 0px);
          --home-safe-bottom: env(safe-area-inset-bottom, 0px);
          --home-footer-space: ${FOOTER_SPACE_DESKTOP}px;

          --home-bg: #f6f8fc;
          --home-card: rgba(255,255,255,.96);
          --home-border: rgba(15,23,42,.10);
          --home-text: #172033;
          --home-muted: #64748b;
          --home-blue: #2563eb;
          --home-cyan: #06b6d4;
          --home-green: #10b981;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          margin: 0;
        }

        html {
          overflow: hidden;
        }

        body {
          overflow: hidden;
          background: var(--home-bg);
          font-family: "Plus Jakarta Sans", "Inter", system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .home-container {
          position: relative;
          width: 100%;
          height: 100dvh;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 8% 0%, rgba(59,130,246,.07), transparent 25rem),
            radial-gradient(circle at 96% 12%, rgba(124,58,237,.06), transparent 25rem),
            #f6f8fc;
        }

        /* =========================================
           FIXED TOP NAVBAR
           The existing Navbar is kept unchanged.
        ========================================= */
        .home-navbar-fixed {
          position: fixed;
          top: var(--home-safe-top);
          left: 0;
          right: 0;
          z-index: 3000;
          width: 100%;
          height: var(--home-navbar-height);
          flex: 0 0 var(--home-navbar-height);
        }

        /* =========================================
           FIXED TAB BAR — DIRECTLY UNDER NAVBAR
        ========================================= */
        .home-tabs-fixed {
          position: fixed;
          top: calc(var(--home-navbar-height) + var(--home-safe-top));
          left: 0;
          right: 0;
          z-index: 2900;
          width: 100%;
          height: var(--home-tabs-height);
          padding: 10px 30px;
          background: rgba(246,248,252,.96);
          border-bottom: 1px solid rgba(15,23,42,.07);
          box-shadow: 0 8px 22px rgba(15,23,42,.07);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .home-tabs-inner {
          position: relative;
          width: min(1800px, 100%);
          height: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border: 1px solid rgba(255,255,255,.95);
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.98),
              rgba(248,250,252,.98)
            );
          box-shadow:
            inset 0 1px 0 rgba(15,23,42,.04),
            0 10px 30px rgba(15,23,42,.09);
        }

        .home-tabs-scroll {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px;
          overflow: hidden;
          scrollbar-width: none;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
        }

        .home-tabs-scroll::-webkit-scrollbar {
          display: none;
        }
        .home-tab {
          position: relative;
          flex: 0 0 auto;
          min-width: 124px;
          height: 52px;
          padding: 0 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid transparent;
          border-radius: 14px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: -.01em;
          transition: all .22s cubic-bezier(.2,.8,.2,1);
          overflow: hidden;
        }

        .home-tab::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg,rgba(37,99,235,.08),rgba(6,182,212,.08));
          opacity: 0;
          transform: scale(.94);
          transition: all .22s ease;
        }

        .home-tab:hover {
          color: #1e40af;
          background: #f8fafc;
          border-color: #dbeafe;
          transform: translateY(-1px);
          box-shadow: 0 5px 14px rgba(15,23,42,.07);
        }

        .home-tab:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        .home-tab:active {
          transform: translateY(0) scale(.98);
        }

        .home-tab:focus-visible {
          outline: 3px solid rgba(37,99,235,.20);
          outline-offset: 2px;
        }

        .home-tab.active {
          color: #ffffff;
          border-color: transparent;
          background: linear-gradient(135deg,#2563eb 0%,#0891b2 55%,#10b981 100%);
          box-shadow:
            0 9px 22px rgba(37,99,235,.25),
            inset 0 1px 0 rgba(255,255,255,.30);
          transform: translateY(-1px);
        }

        .home-tab.active::before {
          opacity: 1;
          transform: scale(1);
          background: linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.02));
        }

        .home-tab.active::after {
          content: "";
          position: absolute;
          left: 18%;
          right: 18%;
          bottom: 4px;
          height: 3px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 0 10px rgba(255,255,255,.65);
          animation: homeTabIndicator .22s ease both;
        }

        @keyframes homeTabIndicator {
          from { opacity: 0; transform: scaleX(.35); }
          to { opacity: 1; transform: scaleX(1); }
        }

        .home-tab-icon,
        .home-tab-label {
          position: relative;
          z-index: 1;
        }

        .home-tab-icon {
          font-size: 18px;
          line-height: 1;
          flex: 0 0 auto;
          transition: transform .22s ease;
        }

        .home-tab:hover .home-tab-icon {
          transform: scale(1.08);
        }

        .home-tab.active .home-tab-icon {
          transform: scale(1.08);
        }

        .home-tab-label {
          line-height: 1;
          font-weight: 850;
        }

        .home-tab-icon {
          font-size: 18px;
          line-height: 1;
          flex: 0 0 auto;
        }

        .home-tab-label {
          line-height: 1;
        }

        /* =========================================
           ONLY THIS AREA SCROLLS VERTICALLY
        ========================================= */
        .home-page-scroll {
          position: fixed;
          top: calc(
            var(--home-navbar-height) +
            var(--home-safe-top) +
            var(--home-tabs-height)
          );
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: none;
          overscroll-behavior-y: contain;
          scroll-behavior: smooth;
          padding: 0;
        }

        .home-page-inner {
          width: min(1800px, 100%);
          min-height: 100%;
          margin: 0 auto;
          padding: 16px 30px calc(var(--home-footer-space) + var(--home-safe-bottom) + 26px);
          overflow: visible;
        }

        .home-search-result {
          width: 100%;
          margin-bottom: 12px;
          padding: 8px 12px;
          border: 1px solid #bae6fd;
          border-radius: 9px;
          color: #0369a1;
          background: #e0f2fe;
          font-size: 11px;
          text-align: center;
        }

        .home-search-result b {
          color: #0f172a;
        }

        .home-tab-content {
          width: 100%;
          min-width: 0;
          animation: homeFadeIn .25s ease both;
        }

        @keyframes homeFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .home-footer-fixed {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2500;
          pointer-events: none;
        }

        .home-refresh-indicator {
          position: fixed;
          right: 16px;
          bottom: calc(16px + var(--home-safe-bottom));
          z-index: 4000;
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 22px;
          padding: 4px 8px;
          border: 1px solid rgba(14,165,233,.12);
          border-radius: 999px;
          background: rgba(255,255,255,.90);
          color: #64748b;
          box-shadow: 0 8px 20px rgba(15,23,42,.10);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          pointer-events: none;
          user-select: none;
          font-size: 8px;
          font-weight: 800;
          opacity: .75;
        }

        .home-refresh-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
        }

        .home-refresh-dot.refreshing {
          background: #f59e0b;
          animation: homePulse .7s ease-in-out infinite;
        }

        @keyframes homePulse {
          0%, 100% { transform: scale(.8); opacity: .45; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        /* =========================================
           DESKTOP:
           No horizontal tab scrolling.
           All tabs stay visible like the screenshot.
        ========================================= */

        /* ===== PROFESSIONAL HOME LAYOUT ENHANCEMENT ===== */

        .home-container {
          isolation: isolate;
        }

        .home-tabs-fixed {
          padding-left: 24px;
          padding-right: 24px;
        }

        .home-tabs-inner {
          border: 1px solid #dbe4ef;
          background: rgba(255,255,255,.94);
          box-shadow:
            0 10px 28px rgba(15,23,42,.08),
            inset 0 1px 0 rgba(255,255,255,.95);
        }

        .home-tabs-scroll {
          gap: 7px;
          padding: 8px;
        }

        .home-page-inner {
          padding-top: 18px;
        }

        .home-tab-content {
          position: relative;
          width: 100%;
          min-width: 0;
        }

        .home-search-result {
          border-width: 1.5px;
          box-shadow: 0 6px 18px rgba(14,165,233,.08);
          font-weight: 700;
        }

        .home-refresh-indicator {
          border-color: #dbeafe;
          font-weight: 850;
        }

        /* Smooth, compact scrollbar for desktop page content. */
        .home-page-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .home-page-scroll::-webkit-scrollbar {
          width: 7px;
        }

        .home-page-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .home-page-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        .home-page-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (min-width: 769px) {
          .home-tabs-scroll {
            justify-content: stretch;
          }

          .home-tab {
            min-width: 0;
            flex: 1 1 0;
          }

          .home-tab-label {
            font-size: 12px;
          }
        }

        @media (max-width: 768px) {
          .home-tabs-fixed {
            padding-left: 12px;
            padding-right: 12px;
          }

          .home-tabs-inner {
            border-radius: 15px;
          }

          .home-tabs-scroll {
            justify-content: flex-start;
            gap: 7px;
            padding: 6px;
          }

          .home-tab {
            min-width: 118px;
            height: 49px;
            padding: 0 14px;
            border-radius: 12px;
            font-size: 11px;
          }

          .home-tab.active {
            box-shadow:
              0 7px 18px rgba(37,99,235,.23),
              inset 0 1px 0 rgba(255,255,255,.28);
          }

          .home-tab.active::after {
            left: 20%;
            right: 20%;
            bottom: 4px;
          }

          .home-page-inner {
            padding-top: 13px;
          }
        }

        @media (max-width: 480px) {
          .home-tabs-fixed {
            padding-left: 8px;
            padding-right: 8px;
          }

          .home-tabs-inner {
            border-radius: 13px;
          }

          .home-tab {
            min-width: 112px;
            height: 47px;
            padding: 0 11px;
          }

          .home-tab-icon {
            font-size: 17px;
          }

          .home-tab-label {
            font-size: 10.5px;
          }

          .home-page-inner {
            padding-left: 7px;
            padding-right: 7px;
          }
        }

        @media (max-width: 380px) {
          .home-tabs-fixed {
            padding-left: 6px;
            padding-right: 6px;
          }

          .home-tab {
            min-width: 105px;
          }

          .home-tab-label {
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-tab,
          .home-tab::before,
          .home-tab::after,
          .home-tab-icon,
          .home-tab-content {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (min-width: 769px) {
          .home-tabs-scroll {
            overflow-x: hidden;
            overflow-y: hidden;
          }

          .home-tab {
            min-width: 0;
            flex: 1 1 0;
          }

        }

        /* =========================================
           MOBILE:
           Only the TAB BAR scrolls horizontally.
           The page content remains vertical.
        ========================================= */
        @media (max-width: 768px) {
          :root {
            --home-navbar-height: ${NAVBAR_HEIGHT_MOBILE}px;
            --home-tabs-height: ${TAB_HEIGHT_MOBILE}px;
            --home-footer-space: ${FOOTER_SPACE_MOBILE}px;
          }

          .home-navbar-fixed {
            height: var(--home-navbar-height);
          }

          .home-tabs-fixed {
            height: var(--home-tabs-height);
            padding: 7px 26px;
          }

          .home-tabs-inner {
            border-radius: 14px;
          }

          .home-tabs-scroll {
            justify-content: flex-start;
            overflow-x: auto;
            overflow-y: hidden;
            gap: 7px;
            padding: 6px 5px;
            scroll-snap-type: x proximity;
            -webkit-overflow-scrolling: touch;
          }

          .home-tab {
            flex: 0 0 auto;
            min-width: 118px;
            height: 49px;
            padding: 0 13px;
            border-radius: 11px;
            scroll-snap-align: start;
            font-size: 11px;
          }

          .home-tab-icon {
            font-size: 17px;
          }

          .home-tab-label {
            font-size: 11px;
          }

          .home-page-scroll {
            top: calc(
              var(--home-navbar-height) +
              var(--home-safe-top) +
              var(--home-tabs-height)
            );
          }

          .home-page-inner {
            padding: 12px 10px calc(var(--home-footer-space) + var(--home-safe-bottom) + 18px);
          }

          .home-search-result {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .home-tabs-fixed {
            padding-left: 23px;
            padding-right: 23px;
          }

          .home-tab {
            min-width: 112px;
            height: 47px;
            padding: 0 11px;
          }

          .home-tab-label {
            font-size: 10.5px;
          }

          .home-page-inner {
            padding: 10px 8px calc(var(--home-footer-space) + var(--home-safe-bottom) + 18px);
          }
        }

        @media (max-width: 380px) {
          .home-tabs-fixed {
            padding-left: 20px;
            padding-right: 20px;
          }

          .home-tab {
            min-width: 105px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-tab-content,
          .home-tab,
          .home-page-scroll {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="home-container">
        {/* Fixed navbar — stays exactly above the tab section */}
        <div className="home-navbar-fixed">
          <Navbar
            onSearch={setSearchQuery}
            onLogout={handleLogout}
            onNavigate={handleTabChange}
          />
        </div>

        {/* Fixed tab section directly below navbar */}
        <nav
          className="home-tabs-fixed"
          aria-label="Dashboard sections"
        >
          <div className="home-tabs-inner">
            <div
              className="home-tabs-scroll"
              ref={tabContainerRef}
              role="tablist"
              aria-label="Dashboard tabs"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`home-tab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  <span
                    className="home-tab-icon"
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </span>
                  <span className="home-tab-label">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* ONLY this section scrolls vertically */}
        <main className="home-page-scroll">
          <div className="home-page-inner">
            {searchQuery ? (
              <div className="home-search-result">
                🔍 Results for:{" "}
                <b>{searchQuery}</b>
              </div>
            ) : null}

            <section
              className="home-tab-content"
              role="tabpanel"
              aria-live="polite"
            >
              <ActiveComponent
                key={activeTab}
                refreshTrigger={refreshTrigger}
                navigationTarget={navigationTarget}
                searchQuery={searchQuery}
              />
            </section>
          </div>
        </main>

        {/* Keep your existing footer component in the same project.
            It does not participate in the page scrolling area. */}
        <div className="home-footer-fixed">
          <Footer />
        </div>

        <div
          className="home-refresh-indicator"
          aria-hidden="true"
        >
          <span
            className={`home-refresh-dot ${
              isRefreshing ? "refreshing" : ""
            }`}
          />
          <span>{isRefreshing ? "Refreshing" : "30s"}</span>
        </div>
      </div>
    </>
  );
};

export default Home;
