"use client";

import { useState, useEffect, useRef } from "react";

function StatCard({ value, label, delay = 0, className = "" }: { value: string; label: string; delay?: number; className?: string }) {
  return (
    <div
      className={`stat-card ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function PortalPreview() {
  const files = [
    { name: "Contract_2024.pdf", size: "2.4 MB", icon: "📄", color: "#e8f4fd" },
    {
      name: "Project_Brief.docx",
      size: "840 KB",
      icon: "📝",
      color: "#f0fdf4",
    },
    { name: "Photo_ID.jpg", size: "1.1 MB", icon: "🖼️", color: "#fdf4ff" },
  ];

  return (
    <div className="portal-preview">
      <div className="portal-header">
        <div className="portal-dots">
          <span style={{ background: "#ff5f57" }} />
          <span style={{ background: "#febc2e" }} />
          <span style={{ background: "#28c840" }} />
        </div>
        <div className="portal-url">portal.dysumcorp.pro/j/xk92m</div>
        <div className="portal-lock">🔒</div>
      </div>

      <div className="portal-body">
        <div className="portal-branding">
          <div className="brand-avatar">AS</div>
          <div>
            <p className="brand-name">Alex Sullivan, CPA</p>
            <p className="brand-sub">Secure Document Portal</p>
          </div>
        </div>

        <div className="drop-zone">
          <div className="drop-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                stroke="#6c63ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="17 8 12 3 7 8"
                stroke="#6c63ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
                stroke="#6c63ff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="drop-text">
            Drop files here or <span>browse</span>
          </p>
          <p className="drop-sub">
            No account needed · Files go straight to Drive
          </p>
        </div>

        <div className="file-list">
          {files.map((f, i) => (
            <div
              key={i}
              className="file-item"
              style={{ animationDelay: `${800 + i * 150}ms` }}
            >
              <div className="file-icon-wrap" style={{ background: f.color }}>
                <span>{f.icon}</span>
              </div>
              <div className="file-info">
                <p className="file-name">{f.name}</p>
                <p className="file-size">{f.size}</p>
              </div>
              <div className="file-check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#22c55e" />
                  <polyline
                    points="9 12 11 14 15 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="storage-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Saved to Google Drive</span>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const niches = [
    "Accountants",
    "Lawyers",
    "Designers",
    "Consultants",
    "Therapists",
  ];
  const [nicheIdx, setNicheIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setNicheIdx((i) => (i + 1) % niches.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f7f6f2;
          --surface: #ffffff;
          --ink: #0e0e0e;
          --ink-soft: #5a5a5a;
          --ink-muted: #999;
          --accent: #6c63ff;
          --accent-light: #ece9ff;
          --accent-dark: #4f46e5;
          --green: #22c55e;
          --border: #e5e3dd;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05);
          --shadow-lg: 0 20px 60px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.06);
          --radius: 16px;
          --radius-sm: 10px;
          --font-display: 'Bricolage Grotesque', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        body {
          font-family: var(--font-body);
          background: var(--bg);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
        }

        .announce-bar {
          background: var(--ink);
          color: #fff;
          text-align: center;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 450;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .announce-bar a {
          color: #a5b4fc;
          text-decoration: none;
          font-weight: 600;
        }

        .announce-bar a:hover { text-decoration: underline; }

        .hero {
          min-height: 100vh;
          padding-top: 64px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.5;
          pointer-events: none;
        }

        .hero::after {
          content: '';
          position: absolute;
          top: 10%;
          right: 5%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-inner {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 80px 40px 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-soft);
          width: fit-content;
          box-shadow: var(--shadow-sm);
          animation: fadeSlideUp 0.6s ease both;
        }

        .badge-dot {
          width: 7px;
          height: 7px;
          background: var(--green);
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
        }

        .hero-headline {
          font-family: var(--font-display);
          font-size: clamp(48px, 5vw, 72px);
          font-weight: 750;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: var(--ink);
          animation: fadeSlideUp 0.6s ease 0.1s both;
        }

        .hero-headline em {
          font-style: normal;
          color: var(--accent);
        }

        .niche-rotator {
          display: inline-block;
          position: relative;
          overflow: hidden;
          height: 1.1em;
          vertical-align: bottom;
        }

        .niche-word {
          display: block;
          animation: wordSlide 0.4s ease both;
          color: var(--accent);
        }

        @keyframes wordSlide {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .hero-desc {
          font-size: 20px;
          line-height: 1.65;
          color: var(--ink-soft);
          max-width: 500px;
          animation: fadeSlideUp 0.6s ease 0.2s both;
        }

        .hero-cta {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          animation: fadeSlideUp 0.6s ease 0.3s both;
        }

        .btn-accent {
          background: var(--accent);
          color: #fff;
          padding: 16px 32px;
          font-size: 17px;
          border-radius: 12px;
          border: none;
          font-family: var(--font-body);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-accent:hover {
          background: var(--accent-dark);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(108, 99, 255, 0.35);
        }

        .btn-outline {
          background: transparent;
          color: var(--ink);
          border: 1.5px solid var(--border);
          padding: 16px 32px;
          font-size: 17px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-body);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          border-color: var(--ink);
          background: var(--surface);
        }

        .hero-trust {
          display: flex;
          align-items: center;
          gap: 14px;
          animation: fadeSlideUp 0.6s ease 0.4s both;
        }

        .trust-avatars {
          display: flex;
        }

        .trust-avatars span {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--bg);
          background: linear-gradient(135deg, #c7d2fe, #818cf8);
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 600;
          color: white;
          margin-left: -8px;
        }

        .trust-avatars span:first-child { margin-left: 0; background: linear-gradient(135deg, #fca5a5, #f87171); }
        .trust-avatars span:nth-child(2) { background: linear-gradient(135deg, #6ee7b7, #10b981); }
        .trust-avatars span:nth-child(3) { background: linear-gradient(135deg, #93c5fd, #3b82f6); }
        .trust-avatars span:nth-child(4) { background: linear-gradient(135deg, #fcd34d, #f59e0b); }

        .trust-text {
          font-size: 15px;
          color: var(--ink-soft);
          line-height: 1.4;
        }

        .trust-text strong {
          color: var(--ink);
          font-weight: 650;
        }

        .integrations {
          display: flex;
          align-items: center;
          gap: 6px;
          animation: fadeSlideUp 0.6s ease 0.5s both;
        }

        .integrations-label {
          font-size: 12px;
          color: var(--ink-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          margin-right: 4px;
        }

        .integration-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 14px;
          font-weight: 550;
          color: var(--ink-soft);
          box-shadow: var(--shadow-sm);
          white-space: nowrap;
        }

        .hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeSlideUp 0.8s ease 0.2s both;
        }

        .portal-preview {
          background: var(--surface);
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 420px;
          overflow: hidden;
          position: relative;
        }

        .portal-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #f9f9f7;
          border-bottom: 1px solid var(--border);
        }

        .portal-dots {
          display: flex;
          gap: 5px;
        }

        .portal-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .portal-url {
          flex: 1;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11.5px;
          color: var(--ink-soft);
          text-align: center;
          font-family: 'SF Mono', monospace;
        }

        .portal-lock {
          font-size: 13px;
        }

        .portal-body {
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .portal-branding {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--ink);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          display: grid;
          place-items: center;
          font-family: var(--font-display);
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 14px;
          font-weight: 650;
          color: var(--ink);
        }

        .brand-sub {
          font-size: 12px;
          color: var(--ink-muted);
        }

        .drop-zone {
          border: 1.5px dashed #d1cefc;
          border-radius: 12px;
          background: #f9f8ff;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
          transition: all 0.2s;
        }

        .drop-zone:hover {
          border-color: var(--accent);
          background: var(--accent-light);
        }

        .drop-icon {
          width: 44px;
          height: 44px;
          background: var(--accent-light);
          border-radius: 10px;
          display: grid;
          place-items: center;
          margin-bottom: 4px;
        }

        .drop-text {
          font-size: 13.5px;
          font-weight: 550;
          color: var(--ink);
        }

        .drop-text span {
          color: var(--accent);
          text-decoration: underline;
          cursor: pointer;
        }

        .drop-sub {
          font-size: 11.5px;
          color: var(--ink-muted);
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          background: #fafafa;
          border: 1px solid var(--border);
          border-radius: 10px;
          animation: fadeSlideUp 0.4s ease both;
        }

        .file-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .file-info { flex: 1; min-width: 0; }

        .file-name {
          font-size: 12.5px;
          font-weight: 550;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 11px;
          color: var(--ink-muted);
        }

        .file-check { flex-shrink: 0; }

        .storage-badge {
          position: absolute;
          bottom: -14px;
          right: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 7px 14px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
          box-shadow: var(--shadow-md);
          animation: floatBadge 3s ease-in-out infinite;
        }

        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .stat-card {
          position: absolute;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 18px;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeSlideUp 0.6s ease both, floatCard 4s ease-in-out infinite 1s;
        }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
          50% { transform: translateY(-6px) rotate(var(--rot, 0deg)); }
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 750;
          color: var(--ink);
          letter-spacing: -0.03em;
        }

        .stat-label {
          font-size: 11.5px;
          color: var(--ink-muted);
          font-weight: 450;
        }

        .stat-card.top-left {
          top: -20px;
          left: -30px;
          --rot: -2deg;
          transform: rotate(-2deg);
        }

        .stat-card.bottom-right {
          bottom: 40px;
          right: -30px;
          --rot: 2deg;
          transform: rotate(2deg);
        }

        .logos-strip {
          max-width: 1200px;
          margin: 0 auto 20px;
          width: 100%;
          padding: 0 40px 40px;
          position: relative;
          z-index: 1;
        }

        .logos-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .logos-divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .logos-divider-text {
          font-size: 12px;
          color: var(--ink-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .logos-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .logo-item {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.45;
          transition: opacity 0.2s;
          filter: grayscale(1);
        }

        .logo-item:hover {
          opacity: 0.8;
          filter: grayscale(0);
        }

        .logo-icon {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          display: grid;
          place-items: center;
          font-size: 14px;
        }

        .logo-name {
          font-size: 14px;
          font-weight: 650;
          color: var(--ink);
          font-family: var(--font-display);
          letter-spacing: -0.02em;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .hero-inner {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 40px 20px 20px;
          }

          .hero-right {
            justify-content: center;
          }

          .stat-card.top-left { left: -10px; top: -10px; }
          .stat-card.bottom-right { right: -10px; }

          .logos-strip { padding: 0 20px 30px; }
          .logos-row { gap: 20px; }
        }
      `}</style>

      <div className="announce-bar">
        <span>🎉 Dropbox integration now live —</span>
        <a href="#">See what's new →</a>
      </div>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="badge">
              <span className="badge-dot" />
              No client accounts needed · Ever
            </div>

            <h1 className="hero-headline">
              Collect files from clients.
              <br />
              Straight to your <em>cloud storage.</em>
            </h1>

            <p className="hero-desc">
              Create secure upload portals branded to your practice. Share a
              link — your clients upload files instantly, no login required.
              Everything lands directly in your Google Drive or Dropbox.
            </p>

            <div className="hero-cta">
              <button className="btn-accent">Create your portal free</button>
              <button className="btn-outline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <polygon points="10,8 16,12 10,16" fill="currentColor" />
                </svg>
                Watch demo
              </button>
            </div>

            <div className="hero-trust">
              <div className="trust-avatars">
                <span>MK</span>
                <span>JS</span>
                <span>AL</span>
                <span>PR</span>
              </div>
              <p className="trust-text">
                <strong>4,200+ professionals</strong> — accountants,
                <br />
                lawyers, designers & more use dysumcorp
              </p>
            </div>

            <div className="integrations">
              <span className="integrations-label">Works with</span>
              <div className="integration-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google Drive
              </div>
              <div className="integration-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.5 15.5L2 10.5l4.5-5 4.5 5L6.5 15.5z"
                    fill="#0061FF"
                  />
                  <path
                    d="M17.5 15.5L13 10.5l4.5-5 4.5 5-4.5 5z"
                    fill="#0061FF"
                  />
                  <path
                    d="M6.5 16.5l5.5 3.5 5.5-3.5-5.5-3.5-5.5 3.5z"
                    fill="#0061FF"
                  />
                  <path
                    d="M2 10.5l5.5 3.5 5.5-3.5L7.5 7 2 10.5z"
                    fill="#007EE5"
                  />
                  <path
                    d="M13 10.5l5.5 3.5 5.5-3.5L18.5 7 13 10.5z"
                    fill="#007EE5"
                  />
                </svg>
                Dropbox
              </div>
              <div className="integration-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"
                    fill="#FF4B4B"
                  />
                  <path
                    d="M8 11h8M8 15h5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path d="M8 7h3a2 2 0 010 4H8V7z" fill="white" />
                </svg>
                OneDrive
              </div>
            </div>
          </div>

          <div className="hero-right">
            <StatCard
              value="12k+"
              label="Portals created"
              delay={600}
              className="top-left"
            />

            <PortalPreview />

            <StatCard
              value="99.9%"
              label="Uptime SLA"
              delay={700}
              className="bottom-right"
            />
          </div>
        </div>

        <div className="logos-strip">
          <div className="logos-divider">
            <div className="logos-divider-line" />
            <span className="logos-divider-text">
              Trusted by professionals in
            </span>
            <div className="logos-divider-line" />
          </div>
          <div className="logos-row">
            {[
              { icon: "⚖️", name: "Legal" },
              { icon: "📊", name: "Accounting" },
              { icon: "🏥", name: "Healthcare" },
              { icon: "🎨", name: "Creative" },
              { icon: "🏗️", name: "Architecture" },
              { icon: "🧠", name: "Consulting" },
              { icon: "💼", name: "Finance" },
            ].map((item) => (
              <div key={item.name} className="logo-item">
                <div className="logo-icon">{item.icon}</div>
                <span className="logo-name">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
