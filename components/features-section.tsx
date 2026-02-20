"use client";

import {
  Scale,
  Calculator,
  PieChart,
  Building2,
  TrendingUp,
  Zap,
  CheckCircle,
} from "lucide-react";

import { FadeIn, Stagger, StaggerItem } from "./animations";

import { useSession } from "@/lib/auth-client";

const useCases = [
  {
    icon: Scale,
    title: "Law Firms",
    desc: "Securely collect KYC documents, evidence files, and signed agreements without the email back-and-forth.",
    tag: "Ideal for Case Intake",
  },
  {
    icon: Calculator,
    title: "Accountants",
    desc: "Gather tax records, bank statements, and receipts in organized folders directly linked to your cloud.",
    tag: "Tax Season Optimized",
  },
  {
    icon: PieChart,
    title: "Wealth Advisors",
    desc: "Streamline financial reviews by collecting portfolio statements and identification in a high-trust environment.",
    tag: "High-Net-Worth Standard",
  },
  {
    icon: Building2,
    title: "Real Estate",
    desc: "Centralize closing documents, appraisal reports, and inspections for faster, organized deal completions.",
    tag: "Transaction Efficiency",
  },
];

const features = [
  {
    stat: "85%",
    statLabel: "trust rate",
    title: "Professional Branding",
    desc: "Maintain your firm's professional image with custom domains and white-labeling.",
    visual: (
      <div className="bg-stone-100 border border-stone-200 rounded-2xl p-6">
        <div className="flex items-center justify-between text-[11px] mb-3">
          <span className="font-bold text-stone-700">
            portal.yourcompany.com
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-[9px] bg-white px-3 py-1.5 rounded-md border border-stone-200 font-bold uppercase text-stone-600">
            White-label
          </span>
        </div>
      </div>
    ),
  },
  {
    stat: "60%",
    statLabel: "faster",
    title: "Instant Connectivity",
    desc: "Get alerts via Slack, Teams, or Email the second a client submits a document.",
    icon: Zap,
    visual: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-stone-100 p-4 rounded-xl text-xs font-bold text-stone-700">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
          </svg>
          Slack
        </div>
        <div className="flex items-center gap-3 bg-stone-100 p-4 rounded-xl text-xs font-bold text-stone-700">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.25 5.5l-7.5 4.25-7.5-4.25v9.5l7.5 4.25 7.5-4.25v-9.5z" />
          </svg>
          Teams
        </div>
      </div>
    ),
  },
  {
    stat: "75%",
    statLabel: "fewer emails",
    title: "Smart Checklists",
    desc: "Firms reduce manual follow-ups by providing clients with clear, structured requirements.",
    dark: true,
    visual: (
      <div className="space-y-4 text-xs">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span>Bank ID</span>
          <span className="text-stone-300">✓ Done</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span>Tax 2023</span>
          <span className="text-stone-300 italic">Pending</span>
        </div>
      </div>
    ),
  },
];

export default function FeaturesSection() {
  const { data: session } = useSession();

  return (
    <>
      {/* Use Cases Section */}
      <section
        className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-[#fafaf9]"
        id="use-cases"
      >
        <div className="max-w-7xl mx-auto">
          <FadeIn delay={0.1}>
            <div className="text-center mb-12 sm:mb-20">
              <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                Industries
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                Designed for professionals
              </h2>
              <p className="text-stone-700 mt-4 sm:mt-6 max-w-xl mx-auto text-base sm:text-lg leading-relaxed px-2 sm:px-0">
                Tailored document collection workflows for high-stakes
                industries where security and client experience are paramount.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
            delay={0.08}
          >
            {useCases.map((useCase, index) => (
              <StaggerItem key={index}>
                <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-stone-100 premium-shadow-hover h-full">
                  <useCase.icon className="text-3xl sm:text-4xl text-stone-900 mb-4 sm:mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 serif-font text-[#1c1917]">
                    {useCase.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed mb-4 sm:mb-6">
                    {useCase.desc}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {useCase.tag}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-stone-100" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-20">
              <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                Everything you need
              </h2>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10"
            delay={0.1}
          >
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <div
                  className={`p-6 sm:p-8 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-stone-100 flex flex-col justify-between premium-shadow-hover h-full ${
                    feature.dark ? "bg-[#1c1917] text-stone-50" : "bg-white"
                  }`}
                >
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 ${
                        feature.dark
                          ? "bg-white/10 text-stone-200"
                          : "bg-stone-100 text-stone-700"
                      } text-[10px] font-bold uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8`}
                    >
                      {feature.dark ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : feature.icon ? (
                        <feature.icon className="w-3 h-3" />
                      ) : (
                        <TrendingUp className="w-3 h-3" />
                      )}
                      {feature.stat} {feature.statLabel}
                    </div>
                    <h3
                      className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 serif-font ${feature.dark ? "text-stone-50" : "text-[#1c1917]"}`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`leading-relaxed mb-6 sm:mb-10 ${
                        feature.dark ? "text-stone-300" : "text-stone-600"
                      }`}
                    >
                      {feature.desc}
                    </p>
                  </div>
                  {feature.visual}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}
