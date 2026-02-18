"use client";

import { useState, useEffect } from "react";

// Active Portals card component
function ActivePortalsCard() {
  return (
    <div className="earnings-card">
      <div className="earnings-header">
        <span className="earnings-label">Active portals</span>
      </div>
      <div className="earnings-amount">12</div>
      <div className="earnings-next">
        <span>Documents received:</span>
        <span className="earnings-points">247 files</span>
      </div>
      <div className="earnings-graph">
        <svg viewBox="0 0 200 80" preserveAspectRatio="none">
          <path
            d="M0,60 Q50,55 70,45 T140,35 T200,25"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}

// Cloud Storage card component
function CloudStorageCard() {
  return (
    <div className="connect-card">
      <div className="connect-header">
        <span>Cloud storage</span>
        <div className="connect-toggle">
          <div className="toggle-track">
            <div className="toggle-thumb"></div>
          </div>
        </div>
      </div>
      <div className="connect-icons">
        <div className="connect-icon">
          <div className="icon-circle" style={{ background: '#fff', border: '1px solid #e5e5e5' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
        </div>
        <div className="connect-icon">
          <div className="icon-circle" style={{ background: '#0061FF' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff"/>
              <path d="M2 17l10 5 10-5" fill="#fff" opacity="0.7"/>
              <path d="M2 12l10 5 10-5" fill="#fff" opacity="0.85"/>
            </svg>
          </div>
        </div>
        <div className="connect-icon">
          <div className="icon-circle" style={{ background: '#0078D4' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#fff"/>
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" fill="#fff" opacity="0.7"/>
            </svg>
          </div>
        </div>
        <div className="connect-icon">
          <div className="icon-circle" style={{ background: '#0061D5' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="6" width="12" height="12" rx="1" fill="#fff"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="app-store-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
          <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
        </svg>
        <div>
          <div className="app-store-text-small">Auto-sync</div>
          <div className="app-store-text-large">Enabled</div>
        </div>
      </div>
    </div>
  );
}

// FAQ/Chat card component
function FAQCard() {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const questions = [
    "How do I share my portal with clients?",
    "What file types can clients upload?",
    "Is the upload process secure?"
  ];

  return (
    <div className="faq-card">
      <div className="faq-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="1.5"/>
          <path d="M12 16v.01M12 13a2 2 0 0 0 2-2c0-1.1-.9-2-2-2s-2 .9-2 2" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="faq-questions">
        {questions.map((q, i) => (
          <div
            key={i}
            className={`faq-question ${activeQuestion === i ? 'active' : ''}`}
            onMouseEnter={() => setActiveQuestion(i)}
          >
            {q}
          </div>
        ))}
      </div>
      <div className="faq-cta">
        <span>Collect documents effortlessly</span>
        <span>and stay organized</span>
        <button className="faq-arrow">→</button>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .hero-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #C5D3DD 0%, #E8EEF2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        /* Decorative curved shapes */
        .hero-container::before,
        .hero-container::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          pointer-events: none;
        }

        .hero-container::before {
          width: 600px;
          height: 600px;
          top: -200px;
          left: -100px;
        }

        .hero-container::after {
          width: 800px;
          height: 800px;
          bottom: -300px;
          right: -200px;
        }

        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .hero-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 80px;
        }

        .hero-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          display: block;
        }

        .hero-nav {
          display: flex;
          gap: 32px;
          align-items: center;
        }

        .nav-link {
          color: #4a4a4a;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #1a1a1a;
        }

        .sign-up-btn {
          background: transparent;
          border: none;
          color: #1a1a1a;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
        }

        /* Main content */
        .hero-main {
          text-align: center;
          margin-bottom: 60px;
        }

        .hero-title {
          font-size: clamp(48px, 8vw, 96px);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 18px;
          color: #4a4a4a;
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        /* Indicator dots */
        .hero-dots {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 60px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.2);
          transition: all 0.3s;
        }

        .dot.active {
          background: #1a1a1a;
          width: 24px;
          border-radius: 4px;
        }

        /* Cards grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Earnings Card */
        .earnings-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .earnings-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .earnings-header {
          margin-bottom: 16px;
        }

        .earnings-label {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .earnings-amount {
          font-size: 56px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
          line-height: 1;
        }

        .earnings-next {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #666;
          margin-bottom: 24px;
        }

        .earnings-points {
          font-weight: 600;
          color: #1a1a1a;
        }

        .earnings-graph {
          height: 80px;
          margin-top: 24px;
        }

        .earnings-graph svg {
          width: 100%;
          height: 100%;
        }

        /* Connect Sources Card */
        .connect-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .connect-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .connect-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .connect-header span {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .toggle-track {
          width: 48px;
          height: 28px;
          background: #1a1a1a;
          border-radius: 14px;
          position: relative;
          cursor: pointer;
        }

        .toggle-thumb {
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          right: 3px;
          transition: transform 0.2s;
        }

        .connect-icons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .connect-icon {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .app-store-btn {
          background: #1a1a1a;
          color: white;
          border-radius: 12px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .app-store-btn:hover {
          background: #2a2a2a;
        }

        .app-store-text-small {
          font-size: 10px;
          opacity: 0.8;
        }

        .app-store-text-large {
          font-size: 16px;
          font-weight: 600;
        }

        /* FAQ Card */
        .faq-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s, box-shadow 0.3s;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .faq-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .faq-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .faq-questions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-question {
          font-size: 14px;
          color: #666;
          padding: 12px 16px;
          border-radius: 12px;
          background: #f5f5f5;
          cursor: pointer;
          transition: all 0.2s;
        }

        .faq-question:hover,
        .faq-question.active {
          background: #e8e8e8;
          color: #1a1a1a;
        }

        .faq-cta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          color: #666;
          position: relative;
        }

        .faq-arrow {
          position: absolute;
          right: 0;
          bottom: 0;
          background: #1a1a1a;
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: transform 0.2s;
        }

        .faq-arrow:hover {
          transform: scale(1.1);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-header {
            flex-direction: column;
            gap: 24px;
            align-items: flex-start;
          }

          .hero-nav {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .hero-title {
            font-size: 48px;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="hero-container">
        <div className="hero-content">
          {/* Header */}
          <div className="hero-header">
            <div className="hero-logo">
              <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
                <rect fill="#1a1a1a" fillOpacity="0.1" height="32" rx="8" width="32" />
                <path
                  d="M16 6L16 16M16 16L22 10M16 16L10 10"
                  stroke="#1a1a1a"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
                <path
                  d="M8 20V22C8 23.1046 8.89543 24 10 24H22C23.1046 24 24 23.1046 24 22V20"
                  stroke="#1a1a1a"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
              <span>dysumcorp</span>
            </div>
            <nav className="hero-nav">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How it works</a>
              <a href="/pricing" className="nav-link">Pricing</a>
              <button className="sign-up-btn" onClick={() => window.location.href = '/auth'}>Sign up</button>
            </nav>
          </div>

          {/* Main content */}
          <div className="hero-main">
            <h1 className="hero-title">Collect. Organize. Deliver.</h1>
            <p className="hero-subtitle">
              Create secure portals for clients to upload documents directly to your cloud storage. No accounts needed, no friction.
            </p>
          </div>

          {/* Indicator dots */}
          <div className="hero-dots">
            <div className="dot active"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>

          {/* Cards */}
          <div className="cards-grid">
            <ActivePortalsCard />
            <CloudStorageCard />
            <FAQCard />
          </div>
        </div>
      </div>
    </>
  );
}

