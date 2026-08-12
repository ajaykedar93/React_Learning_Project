import React from 'react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Code Icon `</>` using SVG - Red Color
  const CodeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 18L22 12L16 6" />
      <path d="M8 6L2 12L8 18" />
      <path d="M14 4L10 20" />
    </svg>
  );

  return (
    <>
      <style>{`
        /* ============================================
           FOOTER CONTAINER
           ============================================ */
        .footer-container {
          width: 100%;
          background:
            linear-gradient(
              180deg,
              rgba(15, 15, 30, 0.98) 0%,
              rgba(7, 7, 16, 0.99) 100%
            );
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-top: 2px solid rgba(96, 165, 250, 0.4);
          box-shadow:
            0 -8px 30px rgba(0, 0, 0, 0.18),
            0 0 30px rgba(96, 165, 250, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
          padding: 0.6rem 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s ease;
          margin-top: auto;
          position: relative;
          bottom: 0;
          z-index: 100;
          min-height: 60px;
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
          gap: 0.6rem;
          max-width: 1280px;
          width: 100%;
          padding: 0.2rem 0;
        }

        /* ============================================
           TAG LINE WITH SKY BLUE BORDER BOX
           INCREASED SIZE
           ============================================ */
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          font-size: 1.3rem;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.94);
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          padding: 0.4rem 1.2rem;
          border-radius: 14px;
          position: relative;
          border: 2.5px solid rgba(96, 165, 250, 0.35);
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

        /* Code Icon Wrapper - Red Color - Increased Size */
        .code-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 2px solid rgba(239, 68, 68, 0.25);
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
          width: 26px;
          height: 26px;
          color: #EF4444;
          transition: all 0.3s ease;
        }

        .footer-brand:hover .code-icon {
          color: #F87171;
        }

        /* Tag Text - Increased Size */
        .footer-text {
          font-size: 1.2rem;
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
          font-size: 1.35rem;
          letter-spacing: 0.01em;
          text-shadow: 0 0 22px rgba(96, 165, 250, 0.18);
        }

        /* ============================================
           SOCIAL LINKS - INCREASED SIZE
           ============================================ */
        .footer-socials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }

        .social-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          padding: 0.15rem 0.2rem;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          border: none;
          background: transparent;
          box-shadow: none;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          position: relative;
        }

        /* Social Icons - Increased Size */
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
          transform: scale(1.15);
          filter: drop-shadow(0 0 12px rgba(225, 48, 108, 0.5));
        }

        .social-link.instagram .icon-text {
          color: #E1306C;
          font-size: 0.8rem;
        }

        .social-link.instagram:hover .icon-text {
          color: #E1306C;
          text-shadow: 0 0 20px rgba(225, 48, 108, 0.2);
        }

        /* WhatsApp - Original Color */
        .social-link.whatsapp .social-logo {
          color: #25D366;
          fill: #25D366;
        }

        .social-link.whatsapp:hover .social-logo {
          transform: scale(1.15);
          filter: drop-shadow(0 0 12px rgba(37, 211, 102, 0.5));
        }

        .social-link.whatsapp .icon-text {
          color: #25D366;
          font-size: 0.8rem;
        }

        .social-link.whatsapp:hover .icon-text {
          color: #25D366;
          text-shadow: 0 0 20px rgba(37, 211, 102, 0.2);
        }

        .social-link:hover {
          transform: translateY(-1px);
        }

        .social-link:active {
          transform: scale(0.95);
        }

        .social-link .icon-text {
          font-size: 0.75rem;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          max-width: 100px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.3s ease;
        }

        /* ============================================
           YEAR - INCREASED SIZE
           ============================================ */
        .footer-year {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.15);
          font-weight: 500;
          letter-spacing: 0.05em;
          margin-top: 0.1rem;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 992px) {
          .footer-brand {
            padding: 0.35rem 1rem;
            font-size: 1.15rem;
          }
          .code-icon-wrapper {
            width: 42px;
            height: 42px;
          }
          .code-icon {
            width: 22px;
            height: 22px;
          }
          .footer-text {
            font-size: 1.05rem;
          }
          .footer-text .highlight {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 768px) {
          .footer-container {
            padding: 0.5rem 0.6rem;
            min-height: auto;
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
            padding-bottom: calc(0.5rem + constant(safe-area-inset-bottom, 0px));
          }

          .footer-content {
            gap: 0.5rem;
            padding: 0.1rem 0;
          }

          .footer-brand {
            padding: 0.3rem 0.8rem;
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
            width: 19px;
            height: 19px;
          }

          .footer-text {
            font-size: 0.88rem;
          }

          .footer-text .highlight {
            font-size: 1rem;
          }

          .footer-socials {
            gap: 1.5rem;
          }

          .social-logo {
            width: 28px;
            height: 28px;
            flex-basis: 28px;
          }

          .social-link .icon-text {
            font-size: 0.65rem;
            max-width: 80px;
          }

          .social-link {
            font-size: 0.65rem;
          }

          .footer-year {
            font-size: 0.7rem;
          }
        }

        @media (max-width: 480px) {
          .footer-container {
            padding: 0.4rem 0.4rem;
            padding-bottom: calc(0.4rem + env(safe-area-inset-bottom, 0px));
            padding-bottom: calc(0.4rem + constant(safe-area-inset-bottom, 0px));
          }

          .footer-content {
            gap: 0.4rem;
          }

          .footer-brand {
            padding: 0.2rem 0.6rem;
            font-size: 0.8rem;
            border-width: 1.5px;
            border-radius: 10px;
            gap: 0.5rem;
          }

          .code-icon-wrapper {
            width: 30px;
            height: 30px;
            border-radius: 8px;
          }

          .code-icon {
            width: 16px;
            height: 16px;
          }

          .footer-text {
            font-size: 0.75rem;
          }

          .footer-text .highlight {
            font-size: 0.85rem;
          }

          .footer-socials {
            gap: 1.2rem;
          }

          .social-logo {
            width: 24px;
            height: 24px;
            flex-basis: 24px;
          }

          .social-link .icon-text {
            font-size: 0.55rem;
            max-width: 65px;
          }

          .social-link {
            font-size: 0.55rem;
          }

          .footer-year {
            font-size: 0.6rem;
          }
        }

        @media (max-width: 360px) {
          .footer-brand {
            padding: 0.15rem 0.4rem;
            font-size: 0.7rem;
            border-radius: 8px;
            gap: 0.4rem;
          }

          .code-icon-wrapper {
            width: 24px;
            height: 24px;
            border-radius: 6px;
          }

          .code-icon {
            width: 13px;
            height: 13px;
          }

          .footer-text {
            font-size: 0.65rem;
          }

          .footer-text .highlight {
            font-size: 0.72rem;
          }

          .social-logo {
            width: 20px;
            height: 20px;
            flex-basis: 20px;
          }

          .social-link .icon-text {
            font-size: 0.48rem;
            max-width: 55px;
          }

          .footer-socials {
            gap: 0.8rem;
          }

          .footer-year {
            font-size: 0.55rem;
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
      `}</style>

      <footer className="footer-container">
        <div className="footer-content">
          {/* ============================================
              TAG LINE WITH SKY BLUE BORDER BOX
              Red Code Icon `</>` - Increased Size
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
              SOCIAL LINKS - ORIGINAL COLORS
              Increased Size
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
              <span className="icon-text">@ajay_kedar_1</span>
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
              <span className="icon-text">9370470095</span>
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