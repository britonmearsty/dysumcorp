"use client";

import { ShieldCheck, Lock, Server, Building } from "lucide-react";

import { FadeIn, Stagger, StaggerItem } from "./animations";

const certifications = [
  {
    icon: Server,
    title: "SOC2 Type II",
    desc: "Audited and verified enterprise security standards.",
  },
  {
    icon: ShieldCheck,
    title: "GDPR Compliant",
    desc: "Full adherence to European data privacy regulations.",
  },
  {
    icon: Building,
    title: "HIPAA Ready",
    desc: "Secure handling for sensitive healthcare documentation.",
  },
];

export default function SecuritySection() {
  return (
    <section className="py-32 px-6 bg-[#fafaf9]" id="security">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <FadeIn className="flex-1" direction="left">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
              Security First
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 serif-font leading-tight text-[#1c1917]">
              Bank-grade protection for your sensitive data
            </h2>
            <p className="text-stone-700 mt-8 text-lg leading-relaxed">
              Security isn&apos;t an afterthought—it&apos;s the core of
              everything we build. Your documents are encrypted from the moment
              they leave your client&apos;s device until they reach your
              storage.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="text-2xl text-stone-900" />
                  <span className="font-bold text-sm text-[#1c1917]">
                    256-bit AES Encryption
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Military-grade encryption for all data at rest and in transit.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-2xl text-stone-900" />
                  <span className="font-bold text-sm text-[#1c1917]">
                    Zero-Knowledge
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  We never store your documents; they sync directly to you.
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
