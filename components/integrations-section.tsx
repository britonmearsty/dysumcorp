"use client";

import { FadeIn, Stagger, StaggerItem } from "./animations";

const integrations = [
  {
    name: "Google Drive",
    desc: "Auto-sync to specific shared folders.",
    color: "#0066DA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
        <path
          d="M4.5 16.5L12 22L19.5 16.5"
          stroke="#0066DA"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 22L12 12"
          stroke="#0066DA"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 12L19.5 5.5L21 4L15 4L12 7"
          stroke="#EA4335"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12L4.5 5.5L3 4L9 4L12 7"
          stroke="#34A853"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 5.5L12 12L19.5 5.5"
          stroke="#FBBC04"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Dropbox",
    desc: "Direct API integration for speed.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
        <path
          d="M12 4L6 7L12 10L18 7L12 4Z"
          stroke="#0061FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 13L12 16L18 13"
          stroke="#0061FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 7L6 13L12 16L18 13L18 7"
          stroke="#0061FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 16L12 22L6 19L6 13"
          stroke="#0061FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 16L12 22L18 19L18 13"
          stroke="#0061FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "OneDrive",
    desc: "Seamless for Microsoft 365 teams.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
        <path
          d="M4 6L12 2L20 6V14L12 18L4 14V6Z"
          stroke="#0078D4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 10L12 14L20 10"
          stroke="#0078D4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 14V22"
          stroke="#0078D4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "AWS S3",
    desc: "Enterprise-grade storage archiving.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
        <path
          d="M12 3L4 7L12 11L20 7L12 3Z"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 11L12 15L20 11"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 15L12 21"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 7V13L12 17L20 13V7"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 15L20 11V7"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 15L4 11V7"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function IntegrationsSection() {
  return (
    <section id="integrations" className="py-32 px-6 bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto text-center">
        <FadeIn>
          <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
            Sync & Automate
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 serif-font mb-20 text-[#1c1917]">
            Integrated with your stack
          </h2>
        </FadeIn>

        <Stagger
          delay={0.1}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {integrations.map((integration, index) => (
            <StaggerItem key={index}>
              <div className="p-10 rounded-[2.5rem] border border-stone-100 bg-white hover:premium-shadow transition-all duration-500 group text-center h-full">
                <div className="mb-6 flex justify-center">
                  {integration.icon}
                </div>
                <h4 className="font-bold serif-font text-xl mb-2 text-[#1c1917]">
                  {integration.name}
                </h4>
                <p className="text-xs text-stone-600">{integration.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
