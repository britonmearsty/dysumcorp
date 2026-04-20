"use client";

import { Shield, Lock, FileCheck, Scale } from "lucide-react";

import { FadeIn, Stagger, StaggerItem } from "./animations";

const certifications = [
  {
    icon: FileCheck,
    title: "SOC 2 Type II",
    desc: "Enterprise-grade security controls and monitoring.",
  },
  {
    icon: Shield,
    title: "GDPR Compliant",
    desc: "Full data privacy protection for global operations.",
  },
  {
    icon: Scale,
    title: "Industry Ready",
    desc: "Built for regulated sectors including legal, financial, and healthcare.",
  },
];

export default function SecuritySection() {
  return (
    <section className="py-32 px-6 bg-[#fafaf9]" id="security">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <FadeIn className="flex-1" direction="left">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
              Security Architecture
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 serif-font leading-tight text-[#1c1917]">
              Your data fortress
            </h2>
            <p className="text-stone-700 mt-8 text-lg leading-relaxed">
              Every file is protected by enterprise-grade encryption from upload
              to destination. We built Dysumcorp with security as the foundation,
              not an afterthought.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="text-2xl text-stone-900" />
                  <span className="font-bold text-sm text-[#1c1917]">
                    End-to-End Encryption
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  AES-256 encryption protects your data at every stage of the journey.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="text-2xl text-stone-900" />
                  <span className="font-bold text-sm text-[#1c1917]">
                    Private by Design
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Your documents remain accessible only to you and your clients.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn className="flex-1 w-full" delay={0.2} direction="right">
            <div className="bg-white rounded-[2.5rem] p-12 premium-shadow">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500 mb-10">
                Compliance
              </h4>
              <Stagger className="space-y-10" delay={0.15}>
                {certifications.map((cert, index) => (
                  <StaggerItem key={index}>
                    <div className="flex items-center gap-8 border-b border-stone-100 pb-8 last:border-0 last:pb-0">
                      <div className="w-16 h-16 bg-stone-50 flex items-center justify-center rounded-xl">
                        <cert.icon className="text-4xl text-stone-900" />
                      </div>
                      <div>
                        <h5 className="font-bold serif-font text-xl text-[#1c1917]">
                          {cert.title}
                        </h5>
                        <p className="text-sm text-stone-600">{cert.desc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
