"use client";

import { useState, useEffect, useRef } from "react";

const GlobeIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const BellIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const ChecklistIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const UsersIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const LockIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SmartphoneIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const ArrowUpRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);
const CheckIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function AnimatedNumber({ target, suffix = "", duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

function UploadAnimation() {
  const [active, setActive] = useState(0);
  const notifications = [
    { icon: "📧", label: "Email", color: "#3b82f6" },
    { icon: "💬", label: "Slack", color: "#4ade80" },
    { icon: "🔷", label: "Teams", color: "#818cf8" },
  ];

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % 3), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "16px",
      }}
    >
      {notifications.map((n, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: active === i ? `${n.color}14` : "#f8f9fa",
            border: `1.5px solid ${active === i ? n.color + "40" : "#e9ecef"}`,
            borderRadius: "10px",
            padding: "10px 14px",
            transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
            transform: active === i ? "translateX(4px)" : "translateX(0)",
          }}
        >
          <span style={{ fontSize: "16px" }}>{n.icon}</span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              flex: 1,
            }}
          >
            {n.label} notification
          </span>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: active === i ? n.color : "#d1d5db",
              transition: "background 0.3s",
              boxShadow: active === i ? `0 0 0 3px ${n.color}30` : "none",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ChecklistAnimation() {
  const [checked, setChecked] = useState([true, true, false, false]);
  const items = [
    "Government ID",
    "Bank Statement",
    "Proof of Address",
    "Tax Returns",
  ];

  useEffect(() => {
    let idx = 2;
    const t = setInterval(() => {
      setChecked((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      idx++;
      if (idx >= items.length) clearInterval(t);
    }, 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        marginTop: "16px",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            opacity: checked[i] ? 1 : 0.45,
            transition: "opacity 0.4s",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "6px",
              flexShrink: 0,
              background: checked[i] ? "#111827" : "transparent",
              border: `1.5px solid ${checked[i] ? "#111827" : "#d1d5db"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              transform: checked[i] ? "scale(1)" : "scale(0.9)",
            }}
          >
            {checked[i] && (
              <span style={{ color: "#fff", display: "flex" }}>
                <CheckIcon size={11} />
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: "13px",
              color: "#374151",
              fontWeight: 450,
            }}
          >
            {item}
          </span>
          {checked[i] && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "11px",
                fontWeight: 600,
                color: "#16a34a",
                background: "#dcfce7",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              ✓ Received
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function DomainMockup() {
  return (
    <div style={{ marginTop: "20px" }}>
      <div
        style={{
          background: "#f8f9fa",
          border: "1.5px solid #e9ecef",
          borderRadius: "12px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#22c55e",
            flexShrink: 0,
            boxShadow: "0 0 0 3px #22c55e30",
          }}
        />
        <span
          style={{
            fontSize: "13px",
            color: "#6b7280",
            fontFamily: "monospace",
          }}
        >
          portal.
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "monospace",
            background: "#111827",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: "6px",
          }}
        >
          yourcompany
        </span>
        <span
          style={{
            fontSize: "13px",
            color: "#6b7280",
            fontFamily: "monospace",
          }}
        >
          .com
        </span>
      </div>
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            height: "6px",
            borderRadius: "3px",
            background: "linear-gradient(90deg, #22c55e, #16a34a)",
          }}
        />
        <span
          style={{ fontSize: "11px", color: "#6b7280", whiteSpace: "nowrap" }}
        >
          SSL Secured
        </span>
      </div>
      <div style={{ marginTop: "12px", display: "flex", gap: "6px" }}>
        {["Brand Trust", "Custom Logo", "White-label"].map((t, i) => (
          <span
            key={i}
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#374151",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              padding: "4px 10px",
              borderRadius: "20px",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function SecurityTimer() {
  const [secs, setSecs] = useState(72 * 3600);

  useEffect(() => {
    const t = setInterval(
      () => setSecs((p) => (p > 0 ? p - 1 : 72 * 3600)),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(secs / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  const pct = ((secs / (72 * 3600)) * 100).toFixed(1);

  return (
    <div style={{ marginTop: "16px" }}>
      <div
        style={{
          background: "#fafafa",
          border: "1.5px solid #e9ecef",
          borderRadius: "14px",
          padding: "16px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#9ca3af",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Link expires in
        </div>
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "28px",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "0.04em",
          }}
        >
          {h}:{m}:{s}
        </div>
        <div
          style={{
            marginTop: "12px",
            background: "#f3f4f6",
            borderRadius: "6px",
            height: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "6px",
              width: `${pct}%`,
              background: "linear-gradient(90deg, #f59e0b, #ef4444)",
              transition: "width 1s linear",
            }}
          />
        </div>
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#9ca3af" }}>
          Auto-expires • No manual cleanup required
        </div>
      </div>
    </div>
  );
}

function MobileDevices() {
  return (
    <div
      style={{
        marginTop: "16px",
        display: "flex",
        gap: "8px",
        alignItems: "flex-end",
      }}
    >
      {[
        { label: "Mobile", pct: 65, color: "#111827" },
        { label: "Tablet", pct: 20, color: "#6b7280" },
        { label: "Desktop", pct: 15, color: "#d1d5db" },
      ].map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "100%",
              borderRadius: "6px 6px 0 0",
              height: `${d.pct * 1.2}px`,
              background: d.color,
              transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: d.color === "#111827" ? "#fff" : "#374151",
              }}
            >
              {d.pct}%
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ClientRow() {
  const clients = [
    {
      name: "Acme Corp",
      initials: "AC",
      status: "Active",
      uploads: 12,
      color: "#818cf8",
    },
    {
      name: "BuildCo",
      initials: "BC",
      status: "Pending",
      uploads: 5,
      color: "#fb923c",
    },
    {
      name: "Zeta LLC",
      initials: "ZL",
      status: "Active",
      uploads: 8,
      color: "#34d399",
    },
  ];
  return (
    <div
      style={{
        marginTop: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {clients.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f9fafb",
            border: "1.5px solid #f3f4f6",
            borderRadius: "10px",
            padding: "10px 12px",
            transition: "border-color 0.2s",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: c.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {c.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}
            >
              {c.name}
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>
              {c.uploads} documents uploaded
            </div>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "20px",
              background: c.status === "Active" ? "#dcfce7" : "#fef3c7",
              color: c.status === "Active" ? "#16a34a" : "#d97706",
            }}
          >
            {c.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ feature, style = {} }: { feature: any; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: feature.dark ? "#0f172a" : "#fff",
        border: `1.5px solid ${feature.dark ? "#1e293b" : hovered ? "#111827" : "#e9ecef"}`,
        borderRadius: "20px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.10)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        cursor: "default",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: feature.accentGlow || "rgba(17,24,39,0.06)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: feature.dark ? "#1e293b" : "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: feature.dark ? "#e2e8f0" : "#374151",
            flexShrink: 0,
          }}
        >
          {feature.icon}
        </div>
        {feature.stat && (
          <div
            style={{
              background: feature.dark ? "#1e293b" : "#f3f4f6",
              border: `1px solid ${feature.dark ? "#334155" : "#e5e7eb"}`,
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: 700,
              color: feature.dark ? "#94a3b8" : "#374151",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                color: feature.dark ? "#818cf8" : "#111827",
                fontSize: "15px",
              }}
            >
              {feature.statValue}
            </span>
            {feature.stat}
          </div>
        )}
      </div>

      <h3
        style={{
          fontSize: "17px",
          fontWeight: 700,
          color: feature.dark ? "#f1f5f9" : "#111827",
          margin: "0 0 8px 0",
          lineHeight: 1.3,
          fontFamily: "'DM Sans', 'Satoshi', system-ui, sans-serif",
        }}
      >
        {feature.title}
      </h3>

      <p
        style={{
          fontSize: "13.5px",
          lineHeight: 1.6,
          color: feature.dark ? "#94a3b8" : "#6b7280",
          margin: 0,
          flex: 1,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {feature.description}
      </p>

      {feature.visual && <feature.visual />}

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          fontWeight: 600,
          color: feature.dark ? "#818cf8" : "#374151",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateX(0)" : "translateX(-6px)",
          transition: "all 0.3s",
        }}
      >
        Learn more <ArrowUpRightIcon />
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const features = [
    {
      icon: <GlobeIcon />,
      title: "Professional Domain Setup",
      description:
        "Use your own domain (portal.yourcompany.com) to maintain brand consistency. 85% of clients report higher trust with custom domains.",
      stat: "trust rate",
      statValue: "85%",
      accentGlow: "rgba(59,130,246,0.12)",
      visual: DomainMockup,
    },
    {
      icon: <BellIcon />,
      title: "Never Miss an Upload",
      description:
        "Get instant alerts via email, Slack, or Microsoft Teams when clients submit documents.",
      stat: "faster response",
      statValue: "60%",
      accentGlow: "rgba(99,102,241,0.12)",
      visual: UploadAnimation,
    },
    {
      icon: <ChecklistIcon />,
      title: "Smart Document Checklists",
      description:
        "Create once, use forever. Firms reduce follow-up emails by 75% using our checklist system. Clients love knowing exactly what to provide.",
      stat: "fewer emails",
      statValue: "75%",
      accentGlow: "rgba(34,197,94,0.10)",
      visual: ChecklistAnimation,
    },
    {
      icon: <UsersIcon />,
      title: "Client Management",
      description:
        "Organize all your clients in one place. Track uploads, activity, and client information effortlessly.",
      stat: "clients avg.",
      statValue: "200+",
      accentGlow: "rgba(251,146,60,0.10)",
      visual: ClientRow,
    },
    {
      icon: <LockIcon />,
      title: "Automated Security",
      description:
        "Links auto-expire when you specify. Perfect for tax season, M&A deals, or any time-sensitive document collection.",
      dark: true,
      accentGlow: "rgba(129,140,248,0.20)",
      visual: SecurityTimer,
    },
    {
      icon: <SmartphoneIcon />,
      title: "Works Everywhere",
      description:
        "Clients upload from any device, anywhere. 65% of uploads now come from mobile — perfect for busy professionals.",
      stat: "mobile uploads",
      statValue: "65%",
      accentGlow: "rgba(20,184,166,0.10)",
      visual: MobileDevices,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

        * { box-sizing: border-box; }

        .features-section {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          background: #f5f5f7;
          min-height: 100vh;
          padding: 80px 24px;
        }

        .features-inner {
          max-width: 1160px;
          margin: 0 auto;
        }

        .features-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .features-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .features-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
          margin: 0 0 16px 0;
          letter-spacing: -0.03em;
        }

        .features-title em {
          font-style: normal;
          background: linear-gradient(135deg, #111827 0%, #4b5563 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .features-subtitle {
          font-size: 17px;
          color: #6b7280;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .stats-bar {
          display: flex;
          justify-content: center;
          gap: 0;
          margin-bottom: 56px;
          background: #fff;
          border: 1.5px solid #e9ecef;
          border-radius: 16px;
          overflow: hidden;
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 56px;
        }

        .stat-item {
          flex: 1;
          padding: 20px 24px;
          text-align: center;
          border-right: 1.5px solid #f3f4f6;
          transition: background 0.2s;
        }

        .stat-item:last-child { border-right: none; }
        .stat-item:hover { background: #fafafa; }

        .stat-number {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .bento-grid { grid-template-columns: 1fr; }
          .features-section { padding: 48px 16px; }
        }

        .bottom-cta {
          margin-top: 56px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .cta-primary {
          background: #0f172a;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: -0.01em;
        }

        .cta-primary:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(15,23,42,0.2);
        }

        .cta-secondary {
          background: #fff;
          color: #374151;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: -0.01em;
        }

        .cta-secondary:hover {
          border-color: #9ca3af;
          transform: translateY(-1px);
        }
      `}</style>

      <section className="features-section">
        <div className="features-inner">
          <div className="features-header">
            <div className="features-label">
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              Enterprise Document Collection
            </div>
            <h2 className="features-title">
              Everything you need to collect
              <br />
              <em>documents from clients</em>
            </h2>
            <p className="features-subtitle">
              Enterprise-grade features designed to streamline your client
              document collection workflow and boost productivity.
            </p>
          </div>

          <div className="stats-bar">
            {[
              { value: 85, suffix: "%", label: "Client Trust Rate" },
              { value: 75, suffix: "%", label: "Fewer Follow-ups" },
              { value: 65, suffix: "%", label: "Mobile Uploads" },
              { value: 60, suffix: "%", label: "Faster Response" },
            ].map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-number">
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bento-grid">
            {features.map((f, i) => (
              <FeatureCard key={i} feature={f} />
            ))}
          </div>

          <div className="bottom-cta">
            <button className="cta-primary">
              Start collecting documents →
            </button>
            <button className="cta-secondary">View live demo</button>
          </div>
        </div>
      </section>
    </>
  );
}
