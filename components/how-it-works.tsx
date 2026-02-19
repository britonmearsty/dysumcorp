"use client";

import { FadeIn, Stagger, StaggerItem } from "./animations";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Create your portal",
      desc: "Set up a portal in minutes. Choose your cloud storage, customize settings, and generate a shareable link.",
    },
    {
      num: "02",
      title: "Share with clients",
      desc: "Send the link to your clients. They can upload files instantly from any device without creating an account.",
    },
    {
      num: "03",
      title: "Files auto-sync",
      desc: "Uploaded files automatically sync to your cloud storage. Get notified instantly when new documents arrive.",
    },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-stone-100">
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
          delay={0.12}
          className="grid grid-cols-1 md:grid-cols-3 gap-16"
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
