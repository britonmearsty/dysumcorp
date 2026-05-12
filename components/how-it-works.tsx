"use client";

import { FadeIn, Stagger, StaggerItem } from "./animations";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Create your portal",
      desc: "Connect your Google Drive or Dropbox, name your portal, and get a shareable link. Done in under 2 minutes.",
    },
    {
      num: "02",
      title: "Share with clients",
      desc: "Send the link by email, WhatsApp, or embed it on your website. Clients upload from any device — no login, no app, no friction.",
    },
    {
      num: "03",
      title: "Files auto-sync",
      desc: "Every upload lands directly in your Drive or Dropbox, organized and ready. You get an instant notification — no manual downloading ever.",
    },
  ];

  return (
    <section className="py-32 bg-stone-100" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn delay={0.1}>
          <div className="text-center mb-20">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
              Workflow
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
              Simple, fast, secure
            </h2>
          </div>
        </FadeIn>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-3 gap-16"
          delay={0.12}
        >
          {steps.map((step, index) => (
            <StaggerItem key={index}>
              <div className="group relative">
                <div className="w-20 h-20 bg-white border border-stone-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#1c1917] group-hover:text-stone-50 transition-all duration-500">
                  <span className="text-3xl serif-font font-bold text-[#1c1917] group-hover:text-stone-50">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-4 serif-font text-[#1c1917]">
                  {step.title}
                </h3>
                <p className="text-stone-700 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
