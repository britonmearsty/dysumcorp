"use client";

export default function CTASection() {
  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .cta-section {
          background: linear-gradient(180deg, #F5F8FA 0%, #E8EEF2 100%);
          padding: 100px 20px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .cta-section::before,
        .cta-section::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          pointer-events: none;
        }

        .cta-section::before {
          width: 600px;
          height: 600px;
          top: -200px;
          left: -150px;
        }

        .cta-section::after {
          width: 500px;
          height: 500px;
          bottom: -150px;
          right: -100px;
        }

        .cta-inner {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
          background: white;
          border-radius: 24px;
          padding: 60px 40px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        .cta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f8f9fa;
          border-radius: 100px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          margin-bottom: 24px;
        }

        .cta-title {
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.2;
          margin: 0 0 20px 0;
          letter-spacing: -0.02em;
        }

        .cta-description {
          font-size: 18px;
          color: #4a4a4a;
          line-height: 1.6;
          margin: 0 0 40px 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #1a1a1a;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          font-family: inherit;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          background: #2a2a2a;
        }

        .btn-secondary {
          background: white;
          color: #1a1a1a;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        .btn-secondary:hover {
          border-color: #1a1a1a;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .cta-features {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          margin-top: 48px;
          flex-wrap: wrap;
        }

        .cta-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }

        .check-icon {
          width: 20px;
          height: 20px;
          background: #1a1a1a;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .cta-section {
            padding: 60px 20px;
          }

          .cta-inner {
            padding: 40px 24px;
          }

          .cta-features {
            gap: 20px;
          }
        }
      `}</style>

      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-badge">
            ✨ Start Free Today
          </div>
          <h2 className="cta-title">
            Ready to transform your file collection?
          </h2>
          <p className="cta-description">
            Join thousands of professionals who collect files 10x faster with Dysumcorp. 
            No credit card required.
          </p>
          <div className="cta-buttons">
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/auth'}
            >
              Create your portal free
            </button>
            <button 
              className="btn-secondary"
              onClick={() => window.location.href = '/pricing'}
            >
              View pricing
            </button>
          </div>
          <div className="cta-features">
            <div className="cta-feature">
              <div className="check-icon">✓</div>
              Free forever plan
            </div>
            <div className="cta-feature">
              <div className="check-icon">✓</div>
              No credit card needed
            </div>
            <div className="cta-feature">
              <div className="check-icon">✓</div>
              Setup in 2 minutes
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

