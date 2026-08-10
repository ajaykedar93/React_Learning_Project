import React from 'react';
import { Heart } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

    // Code Icon `</>` using SVG
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
          border-top: 1px solid rgba(139, 92, 246, 0.22);
          box-shadow:
            0 -8px 30px rgba(0, 0, 0, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
          padding: 0.95rem 2rem;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s ease;
          margin-top: auto;
          position: relative;
          bottom: 0;
          z-index: 100;
          /* Safe area for mobile navigation */
          padding-bottom: calc(0.95rem + env(safe-area-inset-bottom, 0px));
          padding-bottom: calc(0.95rem + constant(safe-area-inset-bottom, 0px));
        }

        .footer-container:hover {
          border-top-color: rgba(124, 58, 237, 0.3);
        }

        .footer-content {
          display: flex;
          align-items: center;
          gap: 2.2rem;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 1280px;
          width: 100%;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1.18rem;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.94);
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          padding: 0.35rem 0.7rem;
          border-radius: 10px;
          position: relative;
        }

        .footer-brand:hover {
          color: #A78BFA;
          transform: translateY(-2px);
        }

        .footer-brand:active {
          transform: scale(0.95);
        }

        /* Click Ripple Effect */
        .footer-brand::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: rgba(124, 58, 237, 0.1);
          opacity: 0;
          transition: all 0.3s ease;
        }

        .footer-brand:active::after {
          opacity: 1;
          transform: scale(1.05);
        }

        .code-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: rgba(239, 68, 68, 0.12);
          border: 1.5px solid rgba(239, 68, 68, 0.25);
          transition: all 0.3s ease;
          font-weight: 800;
          font-size: 0.92rem;
          color: #EF4444;
          font-family: 'Courier New', monospace;
          position: relative;
          overflow: hidden;
        }

        .footer-brand:hover .code-icon-wrapper {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.2);
          transform: rotate(-3deg) scale(1.05);
        }

        .footer-brand:active .code-icon-wrapper {
          transform: scale(0.92);
        }

        /* Code Icon Click Ripple */
        .code-icon-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 13px;
          background: rgba(239, 68, 68, 0.15);
          opacity: 0;
          transition: all 0.3s ease;
        }

        .code-icon-wrapper:active::after {
          opacity: 1;
          transform: scale(1.1);
        }

        .code-icon {
          width: 25px;
          height: 25px;
          color: #EF4444;
          transition: all 0.3s ease;
        }

        .footer-brand:hover .code-icon {
          color: #F87171;
        }

        .footer-text {
          font-size: 1.12rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        .footer-text .highlight {
          background: linear-gradient(135deg, #C4B5FD, #8B5CF6, #6366F1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 850;
          font-size: 1.26rem;
          letter-spacing: 0.01em;
          text-shadow: 0 0 22px rgba(139, 92, 246, 0.18);
        }

        .footer-heart {
          display: inline-flex;
          align-items: center;
          color: #F43F5E;
          transition: all 0.3s ease;
          animation: heartbeat 1.5s ease-in-out infinite;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 50%;
        }

        .footer-heart:hover {
          transform: scale(1.2);
          background: rgba(244, 63, 94, 0.1);
        }

        .footer-heart:active {
          transform: scale(0.85);
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .footer-divider {
          width: 2px;
          height: 30px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
        }

        .footer-socials {
          display: flex;
          align-items: center;
          gap: 1.1rem;
        }

        .social-link {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.2rem 0.25rem;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.78);
          transition: all 0.3s ease;
          border: none;
          background: transparent;
          box-shadow: none;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          cursor: pointer;
          font-weight: 650;
          font-size: 0.98rem;
          position: relative;
          overflow: visible;
        }

        .social-logo {
          width: 34px;
          height: 34px;
          display: block;
          object-fit: contain;
          flex: 0 0 34px;
          background: transparent;
          border: none;
          border-radius: 50%;
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .social-link:hover .social-logo {
          transform: scale(1.1);
        }

        .social-link.instagram:hover .social-logo {
          filter: drop-shadow(0 0 9px rgba(225, 48, 108, 0.45));
        }

        .social-link.whatsapp:hover .social-logo {
          filter: drop-shadow(0 0 9px rgba(37, 211, 102, 0.45));
        }

        /* Social Link Hover Effects */
        .social-link:hover {
          transform: translateY(-2px);
        }

        .social-link:active {
          transform: scale(0.97);
        }

        .social-link.instagram {
          color: #E1306C;
          border-color: rgba(225, 48, 108, 0.2);
        }

        .social-link.instagram:hover {
          background: linear-gradient(45deg, rgba(225, 48, 108, 0.15), rgba(252, 175, 69, 0.1));
          border-color: rgba(225, 48, 108, 0.4);
          box-shadow: 0 6px 25px rgba(225, 48, 108, 0.25);
          color: #E1306C;
        }

        .social-link.whatsapp {
          color: #25D366;
          border-color: rgba(37, 211, 102, 0.2);
        }

        .social-link.whatsapp:hover {
          background: rgba(37, 211, 102, 0.12);
          border-color: rgba(37, 211, 102, 0.4);
          box-shadow: 0 6px 25px rgba(37, 211, 102, 0.25);
          color: #25D366;
        }

        .social-link .icon-text {
          font-size: 0.98rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.3s ease;
        }

        .social-link:hover .icon-text {
          color: white;
        }

        .social-link.instagram:hover .icon-text {
          color: #E1306C;
        }

        .social-link.whatsapp:hover .icon-text {
          color: #25D366;
        }

        .footer-year {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.2);
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        /* Mobile Navigation Safe Space */
        @media (max-width: 768px) {
          .footer-container {
            padding: 0.4rem 0.75rem;
            padding-bottom: calc(0.4rem + env(safe-area-inset-bottom, 0px));
            padding-bottom: calc(0.4rem + constant(safe-area-inset-bottom, 0px));
          }
          .footer-content {
            gap: 0.75rem;
          }
          .footer-brand {
            font-size: 0.84rem;
          }
          .code-icon-wrapper {
            width: 32px;
            height: 32px;
          }
          .code-icon {
            width: 17px;
            height: 17px;
          }
          .footer-text {
            font-size: 0.76rem;
          }
          .footer-text .highlight {
            font-size: 0.86rem;
          }
          .social-link {
            padding: 0.18rem 0.2rem;
            font-size: 0.72rem;
          }
          .social-logo {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }
          .social-link .icon-text {
            font-size: 0.72rem;
          }
          .footer-divider {
            display: none;
          }
          .footer-year {
            font-size: 0.62rem;
          }
          .footer-heart {
            transform: scale(0.78);
          }
        }

        @media (max-width: 480px) {
          .footer-container {
            padding: 0.25rem 0.5rem;
            padding-bottom: calc(0.25rem + env(safe-area-inset-bottom, 0px));
            padding-bottom: calc(0.25rem + constant(safe-area-inset-bottom, 0px));
          }
          .footer-content {
            gap: 0.45rem;
          }
          .footer-brand {
            font-size: 0.72rem;
          }
          .code-icon-wrapper {
            width: 27px;
            height: 27px;
          }
          .code-icon {
            width: 14px;
            height: 14px;
          }
          .footer-text {
            font-size: 0.66rem;
          }
          .footer-text .highlight {
            font-size: 0.74rem;
          }
          .social-link {
            padding: 0.15rem 0.18rem;
            font-size: 0.62rem;
          }
          .social-logo {
            width: 27px;
            height: 27px;
            flex-basis: 27px;
          }
          .social-link .icon-text {
            display: inline;
            font-size: 0.58rem;
            overflow-wrap: anywhere;
          }
          .social-link {
            padding: 0.15rem 0.18rem;
          }
          .footer-heart {
            transform: scale(0.7);
          }
          .footer-year {
            display: none;
          }
          .footer-divider {
            display: none;
          }
        }

        /* Special handling for devices with bottom navigation */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .footer-container {
            padding-bottom: calc(0.95rem + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>

      <footer className="footer-container">
        <div className="footer-content">
          {/* Left: Brand - Code Icon `</>` */}
          <a href="#" className="footer-brand">
            <div className="code-icon-wrapper">
              <CodeIcon />
            </div>
            <span className="footer-text">
              Developed by <span className="highlight">Ajay Kedar</span>
            </span>
          </a>

          <div className="footer-divider" />

          {/* Center: Heart */}
          <div className="footer-heart">
            <Heart size={20} fill="#F43F5E" stroke="none" />
          </div>

          <div className="footer-divider" />

          {/* Right: Social Links - Instagram & WhatsApp */}
          <div className="footer-socials">
            {/* Instagram */}
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

            {/* WhatsApp */}
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