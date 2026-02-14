"use client";

import { useEffect, useRef, useState } from "react";

function Step1Visual() {
  return (
    <div className="step-visual sv1">
      <div className="sv-panel">
        <div className="sv-toolbar">
          <div className="sv-tb-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="sv-tb-title">New Portal</div>
        </div>
        <div className="sv-body">
          <div className="sv-field-group">
            <div className="sv-field-label">Portal name</div>
            <div className="sv-field-input">
              <span className="sv-typed">Tax Documents 2024</span>
              <span className="sv-cursor">|</span>
            </div>
          </div>
          <div className="sv-field-group">
            <div className="sv-field-label">Destination</div>
            <div className="sv-storage-row">
              <div className="sv-storage-opt sv-active">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
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
              <div className="sv-storage-opt">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <path d="M5 13L1 8l4-5 4 5L5 13z" fill="#0061FF" />
                  <path d="M15 13l-4-5 4-5 4 5-4 5z" fill="#0061FF" />
                  <path d="M5 14l5 3 5-3-5-3-5 3z" fill="#0061FF" />
                </svg>
                Dropbox
              </div>
            </div>
          </div>
          <div className="sv-field-group">
            <div className="sv-field-label">Allowed file types</div>
            <div className="sv-tags-row">
              <span className="sv-tag">PDF</span>
              <span className="sv-tag">DOCX</span>
              <span className="sv-tag">JPG</span>
              <span className="sv-tag sv-tag-add">+ Add</span>
            </div>
          </div>
          <div className="sv-btn-row">
            <div className="sv-mini-btn">Generate Portal Link</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Visual() {
  const files = [
    { name: "W2_Form.pdf", size: "340 KB", done: true },
    { name: "Bank_Statement.pdf", size: "1.2 MB", done: true },
    { name: "Receipt_Q4.jpg", size: "780 KB", done: true },
  ];

  return (
    <div className="step-visual sv2">
      <div className="sv-panel">
        <div className="sv-toolbar">
          <div className="sv-tb-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="sv-tb-url">portal.dysumcorp.pro/j/xk92m</div>
        </div>
        <div className="sv-body">
          <div className="sv-portal-brand">
            <div className="sv-avatar">MR</div>
            <div>
              <div className="sv-brand-name">Mark Rivera, CPA</div>
              <div className="sv-brand-sub">Secure Upload Portal</div>
            </div>
          </div>
          <div className="sv-drop-mini">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                stroke="#6c63ff"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <polyline
                points="17 8 12 3 7 8"
                stroke="#6c63ff"
                strokeWidth="2"
                strokeLinecap="round"
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
            <span>Drop files · No account needed</span>
          </div>
          <div className="sv-uploads">
            {files.map((f, i) => (
              <div className="sv-upload-row" key={i}>
                <div className="sv-upload-icon">{f.done ? "✅" : "📄"}</div>
                <div className="sv-upload-info">
                  <div className="sv-upload-name">{f.name}</div>
                  <div className="sv-progress-bar">
                    <div
                      className="sv-progress-fill"
                      style={{
                        width: "100%",
                      }}
                    />
                  </div>
                  {f.done && (
                    <div className="sv-upload-size sv-done">
                      Uploaded · {f.size}
                    </div>
                  )}
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
    <div className="step-visual sv3">
      <div className="sv-panel">
        <div className="sv-toolbar">
          <div className="sv-tb-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="sv-tb-title">Google Drive — Tax Documents 2024</div>
        </div>
        <div className="sv-body">
          <div className="sv-drive-header">
            <div className="sv-drive-path">
              <span>My Drive</span>
              <span className="sv-sep">›</span>
              <span className="sv-path-active">Tax Documents 2024</span>
            </div>
            <div className="sv-drive-badge">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="5" fill="#22c55e" />
                <polyline
                  points="3,5 4.2,6.2 7,3.5"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Auto-synced
            </div>
          </div>
          <div className="sv-file-grid">
            {[
              {
                name: "W2_Form.pdf",
                time: "Just now",
                icon: "📄",
                color: "#e8f4fd",
              },
              {
                name: "Bank_Statement.pdf",
                time: "Just now",
                icon: "📊",
                color: "#f0fdf4",
              },
              {
                name: "Receipt_Q4.jpg",
                time: "Just now",
                icon: "🖼️",
                color: "#fdf4ff",
              },
            ].map((f, i) => (
              <div
                className="sv-drive-file"
                key={i}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <div className="sv-drive-icon" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <div className="sv-drive-name">{f.name}</div>
                <div className="sv-drive-time">{f.time}</div>
              </div>
            ))}
          </div>
          <div className="sv-notify-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke="#6c63ff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Email notification sent to you
          </div>
        </div>
      </div>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="connector-wrap" aria-hidden="true">
      <svg viewBox="0 0 120 40" fill="none" preserveAspectRatio="none">
        <path
          d="M0 20 C30 20, 30 8, 60 8 C90 8, 90 32, 120 32"
          stroke={active ? "#6c63ff" : "#ddd8ff"}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        {active && <circle cx="120" cy="32" r="3" fill="#6c63ff" />}
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 3), 3500);
    return () => clearInterval(t);
  }, []);

  const steps = [
    {
      num: "01",
      title: "Build your portal",
      subtitle: "Set up in 2 minutes",
      desc: "Name your portal, connect your Google Drive or Dropbox, set file rules — then copy your unique link. No code, no dev work.",
      visual: <Step1Visual />,
    },
    {
      num: "02",
      title: "Share the link",
      subtitle: "Clients upload instantly",
      desc: "Your client receives a link. They open it in any browser, drag & drop their files. Zero accounts, zero friction, zero waiting.",
      visual: <Step2Visual />,
    },
    {
      num: "03",
      title: "Files arrive instantly",
      subtitle: "Straight to your cloud",
      desc: "Files land directly in your Drive or Dropbox folder. You get notified, your client gets a confirmation. That's the whole flow.",
      visual: <Step3Visual />,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap');

        .hiw-section {
          background: #f7f6f2;
          padding: 100px 40px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .hiw-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #d4d0c8 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.35;
          pointer-events: none;
        }

        .hiw-section::after {
          content: '';
          position: absolute;
          bottom: -80px;
          left: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(108,99,255,0.07) 0%, transparent 65%);
          pointer-events: none;
        }

        .hiw-inner {
          max-width: 1160px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hiw-header {
          text-align: center;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .hiw-header.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hiw-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e5e3dd;
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #6c63ff;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 18px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .hiw-eyebrow-dot {
          width: 6px;
          height: 6px;
          background: #6c63ff;
          border-radius: 50%;
        }

        .hiw-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(34px, 4vw, 50px);
          font-weight: 760;
          letter-spacing: -0.03em;
          color: #0e0e0e;
          line-height: 1.1;
          margin-bottom: 14px;
        }

        .hiw-title span {
          color: #6c63ff;
        }

        .hiw-subtitle {
          font-size: 17px;
          color: #5a5a5a;
          line-height: 1.6;
          max-width: 520px;
          margin: 0 auto;
        }

        .hiw-steps-nav {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 48px;
        }

        .hiw-nav-dot {
          height: 4px;
          border-radius: 100px;
          background: #e5e3dd;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 28px;
        }

        .hiw-nav-dot.active {
          background: #6c63ff;
          width: 48px;
        }

        .hiw-steps {
          display: grid;
          grid-template-columns: 1fr 40px 1fr 40px 1fr;
          align-items: start;
          gap: 0;
        }

        .hiw-step {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .hiw-step.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hiw-step.visible:nth-child(1) { transition-delay: 0.1s; }
        .hiw-step.visible:nth-child(3) { transition-delay: 0.25s; }
        .hiw-step.visible:nth-child(5) { transition-delay: 0.4s; }

        .step-card {
          background: white;
          border: 1px solid #e5e3dd;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
          cursor: pointer;
          position: relative;
        }

        .step-card:hover,
        .step-card.active {
          box-shadow: 0 12px 40px rgba(108,99,255,0.12), 0 4px 12px rgba(0,0,0,0.06);
          border-color: #c4bfff;
          transform: translateY(-3px);
        }

        .step-ghost-num {
          position: absolute;
          top: -10px;
          right: 10px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 96px;
          font-weight: 800;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1.5px #ece9ff;
          pointer-events: none;
          user-select: none;
          z-index: 0;
          transition: -webkit-text-stroke-color 0.3s ease;
        }

        .step-card.active .step-ghost-num,
        .step-card:hover .step-ghost-num {
          -webkit-text-stroke-color: #c4bfff;
        }

        .step-visual-wrap {
          position: relative;
          z-index: 1;
          padding: 20px 20px 0;
          background: linear-gradient(to bottom, #fafaf8, white);
        }

        .step-content {
          padding: 20px 22px 24px;
          position: relative;
          z-index: 1;
        }

        .step-num-label {
          font-size: 11px;
          font-weight: 700;
          color: #6c63ff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .step-num-label::before {
          content: '';
          display: block;
          width: 18px;
          height: 2px;
          background: #6c63ff;
          border-radius: 1px;
        }

        .step-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 19px;
          font-weight: 720;
          color: #0e0e0e;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }

        .step-badge {
          display: inline-block;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 11px;
          font-weight: 600;
          border-radius: 100px;
          padding: 2px 10px;
          margin-bottom: 10px;
        }

        .step-desc {
          font-size: 13.5px;
          color: #5a5a5a;
          line-height: 1.6;
        }

        .connector-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          margin-top: 40px;
        }

        .connector-wrap svg {
          width: 100%;
          height: 40px;
        }

        .hiw-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: 60px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s;
        }

        .hiw-cta.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hiw-cta-sub {
          font-size: 13px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .hiw-cta-sub span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .hiw-cta-sub span::before {
          content: '✓';
          color: #22c55e;
          font-weight: 700;
        }

        .hiw-btn-main {
          font-family: 'DM Sans', sans-serif;
          background: #0e0e0e;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }

        .hiw-btn-main:hover {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .step-visual {
          background: #f9f8f5;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #ece9e0;
          min-height: 210px;
        }

        .sv-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sv-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f0ede6;
          border-bottom: 1px solid #e5e0d6;
        }

        .sv-tb-dots {
          display: flex;
          gap: 4px;
        }

        .sv-tb-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .sv-tb-dots span:nth-child(1) { background: #ff5f57; }
        .sv-tb-dots span:nth-child(2) { background: #febc2e; }
        .sv-tb-dots span:nth-child(3) { background: #28c840; }

        .sv-tb-title, .sv-tb-url {
          flex: 1;
          text-align: center;
          font-size: 10px;
          color: #888;
          font-family: 'SF Mono', 'Fira Mono', monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sv-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .sv-field-group { display: flex; flex-direction: column; gap: 4px; }

        .sv-field-label {
          font-size: 9.5px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .sv-field-input {
          background: white;
          border: 1px solid #e5e3dd;
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 11px;
          color: #0e0e0e;
          display: flex;
          align-items: center;
          gap: 1px;
        }

        .sv-typed { color: #0e0e0e; }

        .sv-cursor {
          color: #6c63ff;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        .sv-storage-row {
          display: flex;
          gap: 6px;
        }

        .sv-storage-opt {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border: 1px solid #e5e3dd;
          border-radius: 6px;
          font-size: 10.5px;
          color: #5a5a5a;
          background: white;
          cursor: pointer;
        }

        .sv-storage-opt.sv-active {
          border-color: #6c63ff;
          background: #f0eeff;
          color: #6c63ff;
          font-weight: 600;
        }

        .sv-tags-row {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .sv-tag {
          background: #ece9ff;
          color: #6c63ff;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
        }

        .sv-tag-add {
          background: white;
          border: 1px dashed #c4bfff;
          color: #888;
        }

        .sv-btn-row { margin-top: 2px; }

        .sv-mini-btn {
          background: #0e0e0e;
          color: white;
          border-radius: 7px;
          font-size: 10.5px;
          font-weight: 600;
          text-align: center;
          padding: 7px;
          cursor: pointer;
        }

        .sv-portal-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sv-avatar {
          width: 28px;
          height: 28px;
          background: #0e0e0e;
          border-radius: 7px;
          color: white;
          font-size: 9px;
          font-weight: 700;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .sv-brand-name {
          font-size: 11px;
          font-weight: 650;
          color: #0e0e0e;
        }

        .sv-brand-sub {
          font-size: 9.5px;
          color: #aaa;
        }

        .sv-drop-mini {
          border: 1.5px dashed #c4bfff;
          border-radius: 8px;
          background: #f9f8ff;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: #6c63ff;
          font-weight: 550;
        }

        .sv-uploads {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sv-upload-row {
          display: flex;
          align-items: center;
          gap: 7px;
          background: white;
          border: 1px solid #f0ede6;
          border-radius: 7px;
          padding: 5px 8px;
        }

        .sv-upload-icon { font-size: 12px; }

        .sv-upload-info { 
          flex: 1; 
          min-width: 0; 
          min-height: 32px;
        }

        .sv-upload-name {
          font-size: 10.5px;
          font-weight: 550;
          color: #0e0e0e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sv-progress-bar {
          height: 3px;
          background: #ece9ff;
          border-radius: 2px;
          margin-top: 3px;
          overflow: hidden;
          min-height: 3px;
        }

        .sv-progress-fill {
          height: 100%;
          background: #6c63ff;
          border-radius: 2px;
          transition: width 0.1s linear;
        }

        .sv-upload-size {
          font-size: 9.5px;
          color: #aaa;
          margin-top: 2px;
          min-height: 14px;
        }

        .sv-done { color: #22c55e !important; font-weight: 600; }

        .sv-drive-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sv-drive-path {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #888;
        }

        .sv-sep { color: #ccc; }

        .sv-path-active {
          color: #0e0e0e;
          font-weight: 600;
        }

        .sv-drive-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          font-weight: 600;
          color: #15803d;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          padding: 2px 7px;
        }

        .sv-file-grid {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sv-drive-file {
          display: flex;
          align-items: center;
          gap: 7px;
          background: white;
          border: 1px solid #f0ede6;
          border-radius: 7px;
          padding: 5px 8px;
          animation: fileAppear 0.4s ease both;
        }

        @keyframes fileAppear {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .sv-drive-icon {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          display: grid;
          place-items: center;
          font-size: 11px;
          flex-shrink: 0;
        }

        .sv-drive-name {
          flex: 1;
          font-size: 10.5px;
          font-weight: 550;
          color: #0e0e0e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sv-drive-time {
          font-size: 9.5px;
          color: #6c63ff;
          font-weight: 600;
          white-space: nowrap;
        }

        .sv-notify-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: #5a5a5a;
          background: white;
          border: 1px solid #e5e3dd;
          border-radius: 100px;
          padding: 4px 10px;
          align-self: flex-start;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        @media (max-width: 900px) {
          .hiw-section { padding: 70px 20px; }

          .hiw-steps {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .connector-wrap { display: none; }
        }
      `}</style>

      <section className="hiw-section" ref={sectionRef}>
        <div className="hiw-inner">
          <div className={`hiw-header ${visible ? "visible" : ""}`}>
            <div className="hiw-eyebrow">
              <span className="hiw-eyebrow-dot" />
              How it works
            </div>
            <h2 className="hiw-title">
              Three steps from
              <br />
              <span>portal to cloud storage</span>
            </h2>
            <p className="hiw-subtitle">
              No complex setup. No IT department. From first link to first
              upload in under two minutes.
            </p>
          </div>

          <div className="hiw-steps-nav">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`hiw-nav-dot ${activeStep === i ? "active" : ""}`}
                onClick={() => setActiveStep(i)}
              />
            ))}
          </div>

          <div className="hiw-steps">
            {steps.map((step, i) => (
              <>
                <div
                  key={step.num}
                  className={`hiw-step ${visible ? "visible" : ""}`}
                  onClick={() => setActiveStep(i)}
                >
                  <div
                    className={`step-card ${activeStep === i ? "active" : ""}`}
                  >
                    <div className="step-ghost-num">{step.num}</div>
                    <div className="step-visual-wrap">{step.visual}</div>
                    <div className="step-content">
                      <div className="step-num-label">Step {step.num}</div>
                      <div className="step-title">{step.title}</div>
                      <div className="step-badge">{step.subtitle}</div>
                      <p className="step-desc">{step.desc}</p>
                    </div>
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <Connector key={`conn-${i}`} active={activeStep > i} />
                )}
              </>
            ))}
          </div>

          <div className={`hiw-cta ${visible ? "visible" : ""}`}>
            <button className="hiw-btn-main">
              Create your first portal
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="hiw-cta-sub">
              <span>Free to start</span>
              <span>No credit card</span>
              <span>Live in 2 minutes</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
