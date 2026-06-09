"use client";

import { Shield, Lock } from "lucide-react";

import { FadeIn } from "./animations";

export default function SecuritySection() {
  return (
    <section className="py-32 px-6 bg-[#fafaf9]" id="security">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <FadeIn className="flex-1" direction="left">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
              Your Privacy
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 serif-font leading-tight text-[#1c1917]">
              Built with your privacy in mind
            </h2>
            <p className="text-stone-700 mt-8 text-lg leading-relaxed">
              Files upload securely to your Drive or Dropbox via our infrastructure. We never keep copies. Your cloud, your control.
            </p>

            <p className="text-stone-700 mt-6 text-lg leading-relaxed font-medium italic">
              We're the pipe, not the vault. Your files, your cloud, your control.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="text-2xl text-stone-900" />
                  <span className="font-bold text-sm text-[#1c1917]">
                    Strong Encryption
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  AES-256 encryption protects your data in transit and at rest.
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
        </div>
      </div>
    </section>
  );
}
