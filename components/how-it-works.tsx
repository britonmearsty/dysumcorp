"use client";

import { useState } from "react";

function Step1Visual() {
  return (
    <div className="step-visual">
      <div className="visual-card">
        <div className="visual-header">
          <div className="visual-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div className="visual-content">
          <div className="input-group">
            <label>Portal name</label>
            <div className="input-field">
              Tax Documents 2024<span className="cursor">|</span>
            </div>
          </div>
          <div className="input-group">
            <label>Cloud storage</label>
            <div className="storage-options">
              <div className="storage-option active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Drive
              </div>
              <div className="storage-option">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0061FF"/>
                  <path d="M2 17l10 5 10-5" fill="#0061FF" opacity="0.7"/>
                  <path d="M2 12l10 5 10-5" fill="#0061FF" opacity="0.85"/>
                </svg>
                Dropbox
              </div>
            </div>
          </div>
          <button className="generate-btn">Generate Link</button>
        </div>
      </div>
    </div>
  );
}

function Step2Visual() {
  const files = [
    { name: "W2_Form.pdf", progress: 100 },
    { name: "Bank_Statement.pdf", progress: 100 },
    { name: "Receipt_Q4.jpg", progress: 65 },
  ];

  return (
    <div className="step-visual">
      <div className="visual-card">
        <div className="visual-header">
          <div className="visual-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="portal-url">portal.dysumcorp.pro/xk92m</div>
        </div>
        <div className="visual-content">
          <div className="portal-info">
            <div className="avatar">MR</div>
            <div>
              <div className="portal-name">Mark Rivera, CPA</div>
              <div className="portal-subtitle">Secure Upload</div>
            </div>
          </div>
          <div className="upload-zone">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="17 8 12 3 7 8" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Drop files here</span>
          </div>
          <div className="file-list">
            {files.map((f, i) => (
              <div className="file-item" key={i}>
                <div className="file-icon">{f.progress === 100 ? "✓" : "📄"}</div>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${f.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Visual() {
  return (
    <div className="step-visual">
      <div className="visual-card">
        <div className="visual-header">
          <div className="visual-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="portal-url">Google Drive</div>
        </div>
        <div className="visual-content">
          <div className="drive-path">
            <span>My Drive</span>
            <span className="separator">›</span>
            <span className="active-path">Tax Documents 2024</span>
          </div>
          <div className="sync-badge">
            <div className="sync-dot"></div>
            Auto-synced
          </div>
          <div className="drive-files">
            {[
              { name: "W2_Form.pdf", icon: "📄" },
              { name: "Bank_Statement.pdf", icon: "📊" },
              { name: "Receipt_Q4.jpg", icon: "🖼️" },
            ].map((f, i) => (
              <div className="drive-file" key={i}>
                <div className="file-icon-large">{f.icon}</div>
                <div className="file-details">
                  <div className="file-name">{f.name}</div>
                  <div className="file-time">Just now</div>
                </div>
              </div>
            ))}
          </div>
          <div className="notification-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Notification sent
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "1",
      title: "Create your portal",
      desc: "Set up a portal in minutes. Choose your cloud storage, customize settings, and generate a shareable link.",
      visual: <Step1Visual />,
    },
    {
      num: "2",
      title: "Share with clients",
      desc: "Send the link to your clients. They can upload files instantly from any device without creating an account.",
      visual: <Step2Visual />,
    },
    {
      num: "3",
      title: "Files auto-sync",
      desc: "Uploaded files automatically sync to your cloud storage. Get notified instantly when new documents arrive.",
      visual: <Step3Visual />,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .hiw-section {
          background: linear-gradient(180deg, #E8EEF2 0%, #F5F8FA 100%);
          padding: 100px 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .hiw-section::before,
        .hiw-section::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          pointer-events: none;
        }

        .hiw-section::before {
          width: 500px;
          height: 500px;
          top: -150px;
          right: -100px;
        }

        .hiw-section::after {
          width: 600px;
          height: 600px;
          bottom: -200px;
          left: -150px;
        }

        .hiw-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hiw-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .hiw-label {
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .hiw-title {
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .hiw-subtitle {
          font-size: 18px;
          color: #4a4a4a;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto 60px;
        }

        .step-indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 60px;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ccc;
          cursor: pointer;
          transition: all 0.3s;
        }

        .step-dot.active {
          background: #1a1a1a;
          width: 32px;
          border-radius: 4px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .step-card {
          background: white;
          border-radius: 24px;
          padding: 0;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
          cursor: pointer;
          overflow: hidden;
        }

        .step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }

        .step-number {
          position: absolute;
          top: 24px;
          left: 24px;
          width: 40px;
          height: 40px;
          background: #1a1a1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: white;
          z-index: 10;
        }

        .step-visual {
          padding: 24px;
          background: #f8f9fa;
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-content {
          padding: 32px;
        }

        .step-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .step-desc {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
        }

        /* Visual Card Styles */
        .visual-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .visual-header {
          background: #f5f5f5;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #e5e5e5;
        }

        .visual-dots {
          display: flex;
          gap: 6px;
        }

        .visual-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .visual-dots span:nth-child(1) { background: #ff5f57; }
        .visual-dots span:nth-child(2) { background: #febc2e; }
        .visual-dots span:nth-child(3) { background: #28c840; }

        .portal-url {
          flex: 1;
          font-size: 11px;
          color: #999;
          font-family: monospace;
        }

        .visual-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 11px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-field {
          background: #f8f9fa;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          color: #1a1a1a;
        }

        .cursor {
          color: #1a1a1a;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        .storage-options {
          display: flex;
          gap: 8px;
        }

        .storage-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: #f8f9fa;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .storage-option.active {
          background: white;
          border-color: #1a1a1a;
          color: #1a1a1a;
        }

        .generate-btn {
          background: #1a1a1a;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .generate-btn:hover {
          background: #2a2a2a;
        }

        .portal-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: #1a1a1a;
          border-radius: 8px;
          color: white;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portal-name {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .portal-subtitle {
          font-size: 11px;
          color: #999;
        }

        .upload-zone {
          border: 2px dashed #d5d5d5;
          border-radius: 12px;
          background: #fafafa;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8f9fa;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .file-icon {
          width: 32px;
          height: 32px;
          background: #1a1a1a;
          border-radius: 6px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: 12px;
          font-weight: 500;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .progress-bar {
          height: 4px;
          background: #e5e5e5;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #1a1a1a;
          border-radius: 2px;
          transition: width 0.3s;
        }

        .drive-path {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #999;
          margin-bottom: 8px;
        }

        .separator {
          color: #ccc;
        }

        .active-path {
          color: #1a1a1a;
          font-weight: 600;
        }

        .sync-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 11px;
          font-weight: 600;
          border-radius: 20px;
          padding: 4px 12px;
          margin-bottom: 12px;
        }

        .sync-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
        }

        .drive-files {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .drive-file {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8f9fa;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .file-icon-large {
          font-size: 20px;
        }

        .file-details {
          flex: 1;
        }

        .file-time {
          font-size: 10px;
          color: #999;
          margin-top: 2px;
        }

        .notification-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8f9fa;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 11px;
          color: #666;
          margin-top: 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hiw-section {
            padding: 60px 20px;
          }

          .hiw-title {
            font-size: 36px;
          }

          .steps-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .step-number {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

          .visual-card {
            max-width: 100%;
          }
        }
      `}</style>

      <section id="how-it-works" className="hiw-section">
        <div className="hiw-inner">
          <div className="hiw-header">
            <div className="hiw-label">How it works</div>
            <h2 className="hiw-title">Simple, fast, secure</h2>
            <p className="hiw-subtitle">
              Create a portal, share the link, and receive files directly in your cloud storage. No complex setup required.
            </p>
          </div>

          <div className="step-indicators">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`step-dot ${activeStep === i ? "active" : ""}`}
                onClick={() => setActiveStep(i)}
              />
            ))}
          </div>

          <div className="steps-grid">
            {steps.map((step, i) => (
              <div
                key={i}
                className="step-card"
                onClick={() => setActiveStep(i)}
              >
                <div className="step-number">{step.num}</div>
                <div className="step-visual">{step.visual}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
