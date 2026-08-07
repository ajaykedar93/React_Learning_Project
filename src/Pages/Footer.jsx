import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Instagram SVG Icon - Real Instagram Logo
  const InstagramIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );

  // WhatsApp SVG Icon - Real WhatsApp Logo
  const WhatsAppIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      <circle cx="8.5" cy="12.5" r="0.5" fill="currentColor" />
      <circle cx="12" cy="12.5" r="0.5" fill="currentColor" />
      <circle cx="15.5" cy="12.5" r="0.5" fill="currentColor" />
    </svg>
  );

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
          background: rgba(6, 6, 15, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(124, 58, 237, 0.15);
          padding: 0.8rem 2rem;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s ease;
          margin-top: auto;
          position: relative;
          bottom: 0;
          z-index: 100;
          /* Safe area for mobile navigation */
          padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0px));
          padding-bottom: calc(0.8rem + constant(safe-area-inset-bottom, 0px));
        }

        .footer-container:hover {
          border-top-color: rgba(124, 58, 237, 0.3);
        }

        .footer-content {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 1200px;
          width: 100%;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          padding: 0.3rem 0.6rem;
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
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 1.5px solid rgba(239, 68, 68, 0.25);
          transition: all 0.3s ease;
          font-weight: 800;
          font-size: 0.9rem;
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
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.15);
          opacity: 0;
          transition: all 0.3s ease;
        }

        .code-icon-wrapper:active::after {
          opacity: 1;
          transform: scale(1.1);
        }

        .code-icon {
          width: 24px;
          height: 24px;
          color: #EF4444;
          transition: all 0.3s ease;
        }

        .footer-brand:hover .code-icon {
          color: #F87171;
        }

        .footer-text {
          font-size: 1.05rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        .footer-text .highlight {
          background: linear-gradient(135deg, #A78BFA, #7C3AED);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.15rem;
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
          gap: 1rem;
        }

        .social-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 1.2rem;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          position: relative;
          overflow: hidden;
        }

        /* Social Link Hover Effects */
        .social-link:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 25px rgba(124, 58, 237, 0.15);
        }

        .social-link:active {
          transform: scale(0.93);
        }

        /* Social Link Click Ripple */
        .social-link::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .social-link:active::after {
          opacity: 1;
          transform: scale(1.05);
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

        .social-link.instagram:active::after {
          background: linear-gradient(45deg, rgba(225, 48, 108, 0.2), rgba(252, 175, 69, 0.15));
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

        .social-link.whatsapp:active::after {
          background: rgba(37, 211, 102, 0.15);
        }

        .social-link .icon-text {
          font-size: 0.95rem;
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
            font-size: 0.78rem;
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
            font-size: 0.72rem;
          }
          .footer-text .highlight {
            font-size: 0.8rem;
          }
          .social-link {
            padding: 0.25rem 0.55rem;
            font-size: 0.72rem;
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
            font-size: 0.68rem;
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
            font-size: 0.62rem;
          }
          .footer-text .highlight {
            font-size: 0.7rem;
          }
          .social-link {
            padding: 0.2rem 0.45rem;
            font-size: 0.62rem;
          }
          .social-link .icon-text {
            display: none;
          }
          .social-link {
            padding: 0.25rem 0.4rem;
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
            padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0px));
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
              <InstagramIcon />
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
              <WhatsAppIcon />
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