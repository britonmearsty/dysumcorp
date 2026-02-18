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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .testimonials-section {
          background: linear-gradient(180deg, #FFFFFF 0%, #F5F8FA 100%);
          padding: 100px 20px;
          width: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
          position: relative;
        }

        .testimonials-section::before,
        .testimonials-section::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          pointer-events: none;
        }

        .testimonials-section::before {
          width: 500px;
          height: 500px;
          top: -150px;
          right: -100px;
        }

        .testimonials-section::after {
          width: 600px;
          height: 600px;
          bottom: -200px;
          left: -150px;
        }

        .header {
          text-align: center;
          margin-bottom: 80px;
          position: relative;
          z-index: 1;
        }

        .title {
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 20px;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .subtitle {
          font-size: 18px;
          color: #4a4a4a;
          line-height: 1.6;
          margin: 0 0 32px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1a1a1a;
          color: white;
          font-size: 15px;
          font-weight: 600;
          padding: 16px 32px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          background: #2a2a2a;
        }

        .cta-icon {
          width: 16px;
          height: 16px;
        }

        .avatar-stage {
          position: relative;
          height: 160px;
          margin-bottom: 60px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }

        .wave-svg {
          display: none;
        }

        .avatars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 0 24px;
        }

        .avatar-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .avatar-ring {
          border-radius: 50%;
          padding: 4px;
          background: white;
          border: 3px solid transparent;
          transition: all 0.3s;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .avatar-btn:hover .avatar-ring {
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .ring-active {
          border-color: #1a1a1a;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }

        .avatar-img {
          display: block;
          border-radius: 50%;
          object-fit: cover;
          transition: all 0.3s;
        }

        .avatar-active .avatar-img {
          width: 80px;
          height: 80px;
          opacity: 1;
        }

        .avatar-inactive .avatar-img {
          width: 64px;
          height: 64px;
          opacity: 0.6;
        }

        .avatar-inactive:hover .avatar-img {
          opacity: 0.9;
        }

        .quote-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 0 20px;
          max-width: 900px;
          margin: 0 auto;
        }

        .nav-btn {
          background: white;
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          font-size: 24px;
          color: #1a1a1a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          line-height: 1;
          transition: all 0.3s;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        .nav-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          background: #f8f9fa;
        }

        .quote-wrap {
          text-align: center;
          max-width: 600px;
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          transition: opacity 0.3s, transform 0.3s;
        }

        .quote-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .quote-hidden {
          opacity: 0;
          transform: translateY(10px);
        }

        .quote-text {
          font-size: 18px;
          color: #1a1a1a;
          line-height: 1.7;
          margin: 0 0 20px;
          font-weight: 500;
        }

        .quote-author {
          font-size: 14px;
          color: #666;
          font-weight: 600;
          margin: 0;
        }

        .quote-role {
          color: #999;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .testimonials-section {
            padding: 60px 20px;
          }

          .avatar-active .avatar-img {
            width: 64px;
            height: 64px;
          }

          .avatar-inactive .avatar-img {
            width: 48px;
            height: 48px;
          }

          .avatar-stage {
            height: 140px;
            margin-bottom: 40px;
          }

          .avatars {
            gap: 12px;
          }

          .quote-wrap {
            padding: 32px 24px;
          }

          .quote-text {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  );
}
