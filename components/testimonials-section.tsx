"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "CPA, Mitchell & Associates",
    avatar: "https://i.pravatar.cc/150?img=1",
    quote:
      "This tool has completely transformed how we collect documents from clients during tax season. What used to take weeks now happens in a day.",
  },
  {
    id: 2,
    name: "James Chen",
    role: "Real Estate Attorney",
    avatar: "https://i.pravatar.cc/150?img=3",
    quote:
      "The branded portals make us look incredibly professional. Our clients love how easy it is to upload documents without creating accounts.",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Financial Advisor, Wealth Partners",
    avatar: "https://i.pravatar.cc/150?img=5",
    quote:
      "Security was our biggest concern. Knowing our clients' sensitive data is protected with bank-level encryption gives us peace of mind.",
  },
  {
    id: 4,
    name: "Michael Thompson",
    role: "Immigration Consultant",
    avatar: "https://i.pravatar.cc/150?img=8",
    quote:
      "Clients can upload documents from anywhere, even from their phones. It's completely changed how we handle case files.",
  },
  {
    id: 5,
    name: "Jessica Park",
    role: "Marketing Director",
    avatar: "https://i.pravatar.cc/150?img=9",
    quote:
      "We've cut our document collection time by 80%. The automated workflows save us hours every single week.",
  },
  {
    id: 6,
    name: "David Wilson",
    role: "Solo Practitioner",
    avatar: "https://i.pravatar.cc/150?img=11",
    quote:
      "Simple, secure, and professional. Exactly what my practice needed to look more credible to clients.",
  },
];

const waveOffsets = [0, 60, -20, 50, -10, 55];

export default function TestimonialsSection() {
  const [active, setActive] = useState(2);
  const [animating, setAnimating] = useState(false);
  const [displayedQuote, setDisplayedQuote] = useState(testimonials[2].quote);
  const [fadeIn, setFadeIn] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number) => {
    if (index === active || animating) return;
    setAnimating(true);
    setFadeIn(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActive(index);
      setDisplayedQuote(testimonials[index].quote);
      setFadeIn(true);
      setAnimating(false);
    }, 280);
  };

  const prev = () =>
    goTo((active - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((active + 1) % testimonials.length);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <section className="testimonials-section">
      <div className="header">
        <h2 className="title">What Our Customers Say</h2>
        <p className="subtitle">
          Join thousands of professionals who trust Dysumcorp for secure client
          file collection
        </p>
        <a className="cta-btn" href="/auth">
          Get Started <ArrowRight className="cta-icon" />
        </a>
      </div>

      <div className="avatar-stage">
        <svg
          className="wave-svg"
          preserveAspectRatio="none"
          viewBox="0 0 900 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 75 80 C 175 20, 250 140, 375 80 C 450 40, 525 130, 600 75 C 680 20, 760 130, 825 80"
            fill="none"
            stroke="#D1D5DB"
            strokeDasharray="6 6"
            strokeWidth="1.5"
          />
          {[155, 290, 460, 615, 755].map((cx, i) => (
            <circle
              key={i}
              cx={cx}
              cy={i % 2 === 0 ? 55 : 105}
              fill="#D1D5DB"
              r="4"
            />
          ))}
        </svg>

        <div className="avatars">
          {testimonials.map((t, i) => {
            const isActive = i === active;
            const offset = waveOffsets[i];

            return (
              <button
                key={t.id}
                aria-label={`View testimonial from ${t.name}`}
                className={`avatar-btn ${isActive ? "avatar-active" : "avatar-inactive"}`}
                onClick={() => goTo(i)}
              >
                <div
                  className={`avatar-ring ${isActive ? "ring-active" : ""}`}
                  style={{ transform: `translateY(${offset}px)` }}
                >
                  <img alt={t.name} className="avatar-img" src={t.avatar} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="quote-area">
        <button aria-label="Previous" className="nav-btn" onClick={prev}>
          &#8249;
        </button>
        <div
          className={`quote-wrap ${fadeIn ? "quote-visible" : "quote-hidden"}`}
        >
          <p className="quote-text">&quot;{displayedQuote}&quot;</p>
          <p className="quote-author">
            — {testimonials[active].name},{" "}
            <span className="quote-role">{testimonials[active].role}</span>
          </p>
        </div>
        <button aria-label="Next" className="nav-btn" onClick={next}>
          &#8250;
        </button>
      </div>

      <style jsx>{`
        .testimonials-section {
          background: #ffffff;
          padding: 56px 48px 52px;
          width: 100%;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            "Helvetica Neue",
            Arial,
            sans-serif;
          overflow: hidden;
          position: relative;
        }

        .header {
          text-align: center;
          margin-bottom: 48px;
        }

        .title {
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 12px;
        }

        .subtitle {
          font-size: 1rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 24px;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 12px 24px;
          border-radius: 999px;
          text-decoration: none;
          transition:
            background 0.2s ease,
            transform 0.15s ease;
        }

        .cta-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .cta-icon {
          width: 16px;
          height: 16px;
        }

        .avatar-stage {
          position: relative;
          height: 180px;
          margin-bottom: 40px;
        }

        .wave-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .avatars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .avatar-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
        }

        .avatar-ring {
          border-radius: 50%;
          padding: 3px;
          background: transparent;
          border: 3px solid transparent;
          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .avatar-btn:hover .avatar-ring {
          transform: translateY(var(--offset, 0px)) scale(1.08);
        }

        .ring-active {
          border-color: #e53e3e;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.15);
        }

        .avatar-img {
          display: block;
          border-radius: 50%;
          object-fit: cover;
          transition:
            width 0.3s ease,
            height 0.3s ease,
            opacity 0.3s ease;
        }

        .avatar-active .avatar-img {
          width: 80px;
          height: 80px;
          opacity: 1;
        }

        .avatar-inactive .avatar-img {
          width: 60px;
          height: 60px;
          opacity: 0.55;
        }

        .avatar-inactive:hover .avatar-img {
          opacity: 0.85;
        }

        .quote-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 0 8px;
        }

        .nav-btn {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          font-size: 1.4rem;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          line-height: 1;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.15s ease;
        }

        .nav-btn:hover {
          border-color: #0f172a;
          background: #f8fafc;
          transform: scale(1.05);
        }

        .quote-wrap {
          text-align: center;
          max-width: 560px;
          transition:
            opacity 0.28s ease,
            transform 0.28s ease;
        }

        .quote-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .quote-hidden {
          opacity: 0;
          transform: translateY(6px);
        }

        .quote-text {
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          color: #334155;
          line-height: 1.65;
          margin: 0 0 8px;
        }

        .quote-author {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 400;
          margin: 0;
        }

        .quote-role {
          color: #64748b;
        }

        @media (max-width: 640px) {
          .testimonials-section {
            padding: 40px 20px 40px;
          }

          .avatar-active .avatar-img {
            width: 60px;
            height: 60px;
          }

          .avatar-inactive .avatar-img {
            width: 44px;
            height: 44px;
          }

          .avatar-stage {
            height: 150px;
          }
        }
      `}</style>
    </section>
  );
}
