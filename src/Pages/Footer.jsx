import React from 'react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Code Icon `</>` using SVG - Red Color
  const CodeIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 18L22 12L16 6" />
      <path d="M8 6L2 12L8 18" />
      <path d="M14 4L10 20" />
    </svg>
  );

  return (
    <>
      <style>{`
        /* ============================================
           FOOTER CONTAINER - FIXED BOTTOM
           ============================================ */
        .footer-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          background:
            linear-gradient(
              180deg,
              rgba(15, 15, 30, 0.98) 0%,
              rgba(7, 7, 16, 0.99) 100%
            );
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-top: 3px solid rgba(96, 165, 250, 0.4);
          box-shadow:
            0 -8px 30px rgba(0, 0, 0, 0.18),
            0 0 30px rgba(96, 165, 250, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
          padding: 0.6rem 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s ease;
          z-index: 1000;
          min-height: 72px;
          /* Safe area for mobile */
          padding-bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px));
          padding-bottom: calc(0.6rem + constant(safe-area-inset-bottom, 0px));
        }

        .footer-container:hover {
          border-top-color: rgba(96, 165, 250, 0.6);
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18), 0 0 40px rgba(96, 165, 250, 0.08);
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          max-width: 1280px;
          width: 100%;
          padding: 0.1rem 0;
        }

        /* ============================================
           TAG LINE WITH SKY BLUE BORDER BOX
           INCREASED SIZE
           ============================================ */
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.6rem;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.94);
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          padding: 0.5rem 1.8rem;
          border-radius: 16px;
          position: relative;
          border: 3px solid rgba(96, 165, 250, 0.35);
          background: rgba(96, 165, 250, 0.04);
          box-shadow: 0 0 20px rgba(96, 165, 250, 0.04);
        }

        .footer-brand:hover {
          border-color: rgba(96, 165, 250, 0.6);
          background: rgba(96, 165, 250, 0.08);
          box-shadow: 0 0 30px rgba(96, 165, 250, 0.08);
          transform: translateY(-1px);
        }

        .footer-brand:active {
          transform: scale(0.97);
        }

        /* Code Icon Wrapper - Red Color - INCREASED */
        .code-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.12);
          border: 2.5px solid rgba(239, 68, 68, 0.25);
          transition: all 0.3s ease;
          font-weight: 800;
          font-size: 0.95rem;
          color: #EF4444;
          font-family: 'Courier New', monospace;
          position: relative;
          overflow: hidden;
        }

        .footer-brand:hover .code-icon-wrapper {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.15);
          transform: rotate(-2deg) scale(1.04);
        }

        .code-icon {
          width: 32px;
          height: 32px;
          color: #EF4444;
          transition: all 0.3s ease;
        }

        .footer-brand:hover .code-icon {
          color: #F87171;
        }

        /* Tag Text - INCREASED */
        .footer-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        .footer-text .highlight {
          background: linear-gradient(135deg, #93C5FD, #60A5FA, #3B82F6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 900;
          font-size: 1.8rem;
          letter-spacing: 0.01em;
          text-shadow: 0 0 22px rgba(96, 165, 250, 0.18);
        }

        /* ============================================
           SOCIAL LINKS - INCREASED ICON SIZE
           ============================================ */
        .footer-socials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.2rem;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          border: none;
          background: transparent;
          box-shadow: none;
          text-decoration: none;
          cursor: pointer;
          position: relative;
        }

        /* Social Icons - INCREASED SIZE */
        .social-logo {
          width: 34px;
          height: 34px;
          display: block;
          object-fit: contain;
          flex: 0 0 34px;
          background: transparent;
          border: none;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        /* Instagram - Original Color */
        .social-link.instagram .social-logo {
          color: #E1306C;
          fill: #E1306C;
        }

        .social-link.instagram:hover .social-logo {
          transform: scale(1.2);
          filter: drop-shadow(0 0 12px rgba(225, 48, 108, 0.5));
        }

        /* WhatsApp - Original Color */
        .social-link.whatsapp .social-logo {
          color: #25D366;
          fill: #25D366;
        }

        .social-link.whatsapp:hover .social-logo {
          transform: scale(1.2);
          filter: drop-shadow(0 0 12px rgba(37, 211, 102, 0.5));
        }

        .social-link:hover {
          transform: translateY(-2px);
        }

        .social-link:active {
          transform: scale(0.9);
        }

        /* Hover background effect */
        .social-link::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .social-link.instagram::after {
          background: radial-gradient(circle, rgba(225, 48, 108, 0.15), transparent 70%);
        }

        .social-link.whatsapp::after {
          background: radial-gradient(circle, rgba(37, 211, 102, 0.15), transparent 70%);
        }

        .social-link:hover::after {
          opacity: 1;
          transform: scale(1.1);
        }

        /* ============================================
           YEAR - INCREASED
           ============================================ */
        .footer-year {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.12);
          font-weight: 500;
          letter-spacing: 0.05em;
          margin-top: 0.05rem;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 992px) {
          .footer-brand {
            padding: 0.4rem 1.5rem;
            font-size: 1.4rem;
          }
          .code-icon-wrapper {
            width: 50px;
            height: 50px;
          }
          .code-icon {
            width: 28px;
            height: 28px;
          }
          .footer-text {
            font-size: 1.3rem;
          }
          .footer-text .highlight {
            font-size: 1.5rem;
          }
          .social-logo {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }
        }

        @media (max-width: 768px) {
          .footer-container {
            padding: 0.5rem 0.6rem;
            min-height: 62px;
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
            padding-bottom: calc(0.5rem + constant(safe-area-inset-bottom, 0px));
          }

          .footer-content {
            gap: 0.4rem;
            padding: 0.05rem 0;
          }

          .footer-brand {
            padding: 0.35rem 1.2rem;
            font-size: 1.2rem;
            border-width: 2px;
            border-radius: 14px;
            gap: 0.7rem;
          }

          .code-icon-wrapper {
            width: 44px;
            height: 44px;
            border-radius: 12px;
          }

          .code-icon {
            width: 24px;
            height: 24px;
          }

          .footer-text {
            font-size: 1.1rem;
          }

          .footer-text .highlight {
            font-size: 1.3rem;
          }

          .footer-socials {
            gap: 1.5rem;
          }

          .social-logo {
            width: 28px;
            height: 28px;
            flex-basis: 28px;
          }

          .footer-year {
            font-size: 0.7rem;
          }
        }

        @media (max-width: 480px) {
          .footer-container {
            padding: 0.4rem 0.4rem;
            min-height: 54px;
            padding-bottom: calc(0.4rem + env(safe-area-inset-bottom, 0px));
            padding-bottom: calc(0.4rem + constant(safe-area-inset-bottom, 0px));
          }

          .footer-content {
            gap: 0.3rem;
          }

          .footer-brand {
            padding: 0.25rem 0.8rem;
            font-size: 0.95rem;
            border-width: 2px;
            border-radius: 12px;
            gap: 0.6rem;
          }

          .code-icon-wrapper {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }

          .code-icon {
            width: 20px;
            height: 20px;
          }

          .footer-text {
            font-size: 0.85rem;
          }

          .footer-text .highlight {
            font-size: 1rem;
          }

          .footer-socials {
            gap: 1.2rem;
          }

          .social-logo {
            width: 24px;
            height: 24px;
            flex-basis: 24px;
          }

          .footer-year {
            font-size: 0.6rem;
          }
        }

        @media (max-width: 360px) {
          .footer-brand {
            padding: 0.2rem 0.6rem;
            font-size: 0.8rem;
            border-radius: 10px;
            gap: 0.5rem;
          }

          .code-icon-wrapper {
            width: 30px;
            height: 30px;
            border-radius: 8px;
          }

          .code-icon {
            width: 17px;
            height: 17px;
          }

          .footer-text {
            font-size: 0.7rem;
          }

          .footer-text .highlight {
            font-size: 0.85rem;
          }

          .social-logo {
            width: 20px;
            height: 20px;
            flex-basis: 20px;
          }

          .footer-socials {
            gap: 0.8rem;
          }

          .footer-year {
            font-size: 0.5rem;
          }
        }

        /* Safe area support */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .footer-container {
            padding-bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px));
          }
        }

        @media (max-width: 768px) {
          @supports (padding-bottom: env(safe-area-inset-bottom)) {
            .footer-container {
              padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
            }
          }
        }

        @media (max-width: 480px) {
          @supports (padding-bottom: env(safe-area-inset-bottom)) {
            .footer-container {
              padding-bottom: calc(0.4rem + env(safe-area-inset-bottom, 0px));
            }
          }
        }

        /* Add padding to page content to prevent overlap with fixed footer */
        body {
          padding-bottom: 100px !important;
        }

        @media (max-width: 768px) {
          body {
            padding-bottom: 85px !important;
          }
        }

        @media (max-width: 480px) {
          body {
            padding-bottom: 70px !important;
          }
        }
      `}</style>

      <footer className="footer-container">
        <div className="footer-content">
          {/* ============================================
              TAG LINE WITH SKY BLUE BORDER BOX
              BIG SIZE - INCREASED
              Red Code Icon `</>`
              Click opens: https://react-myapp-omega.vercel.app/
          ============================================ */}
          <a 
            href="https://react-myapp-omega.vercel.app/" 
            className="footer-brand"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Ajay Kedar's portfolio"
            title="Visit Portfolio"
          >
            <div className="code-icon-wrapper">
              <CodeIcon />
            </div>
            <span className="footer-text">
              Developed by <span className="highlight">Ajay Kedar</span>
            </span>
          </a>

          {/* ============================================
              SOCIAL LINKS - ONLY ICONS
              INCREASED SIZE
              Instagram: #E1306C
              WhatsApp: #25D366
          ============================================ */}
          <div className="footer-socials">
            {/* Instagram - Original Color */}
            <a 
              href="https://instagram.com/ajay_kedar_1" 
              className="social-link instagram" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram"
              title="Instagram: @ajay_kedar_1"
            >
              <FaInstagram className="social-logo" aria-hidden="true" />
            </a>

            {/* WhatsApp - Original Color */}
            <a 
              href="https://wa.me/919370470095" 
              className="social-link whatsapp" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="WhatsApp"
              title="WhatsApp: 9370470095"
            >
              <FaWhatsapp className="social-logo" aria-hidden="true" />
            </a>
          </div>

          {/* Year */}
          <span className="footer-year">{currentYear}</span>
        </div>
      </footer>
    </>
  );
};

export default Footer;