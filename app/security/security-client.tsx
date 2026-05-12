"use client";

import Link from "next/link";
import { ArrowRight, Lock, Eye, FileKey, ShieldCheck } from "lucide-react";

import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/animations";

const securityPillars = [
    {
      icon: Lock,
      title: "Encryption in Transit and at Rest",
      desc: "Files are temporarily held on Cloudflare's infrastructure during transfer, then automatically deleted within 24 hours.",
      detail:
        "Files are encrypted with AES-256 during upload and while temporarily held on Cloudflare's infrastructure during routing to your storage. Files are automatically purged from our infrastructure within 24 hours of upload.",
    },
    {
      icon: Eye,
      title: "Private by Design",
      desc: "Your documents are accessible only to you and your clients. Dysumcorp does not store, read, or access your files. We're the pipe, not the vault.",
      detail:
        "Files are temporarily routed through Cloudflare infrastructure during transfer and automatically deleted within 24 hours. Dysumcorp does not read, index, or access your files at any point. Your cloud, your control.",
    },
  {
    icon: Eye,
    title: "Private by Design",
    desc: "Your documents are accessible only to you and your clients. Dysumcorp does not store, read, or access your files. We're the pipe, not the vault.",
    detail:
      "Files are processed in memory during transfer and never written to Dysumcorp storage. Your cloud, your control.",
  },
  {
    icon: FileKey,
    title: "Access Control",
    desc: "Every portal can be protected with a unique password. Combine optional password protection with expiring links for time-limited, credential-gated upload windows.",
    detail:
      "Passwords are hashed using industry-standard algorithms. Link expiry is enforced at the server level.",
  },
   {
      icon: ShieldCheck,
      title: "Temporary Transit Only",
      desc: "Files are held temporarily on Cloudflare R2 during routing to your cloud storage and deleted automatically within 24 hours.",
      detail:
        "Files are held temporarily on Cloudflare R2 during routing to your cloud storage and deleted automatically within 24 hours. Dysumcorp never holds files permanently. Once forwarded to your Drive or Dropbox, we have no further access.",
    },
];

const footerLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SecurityClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="py-20 lg:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn delay={0.1}>
              <span className="inline-block text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-6">
                Security First
              </span>
               <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-6 leading-[1.1]">
                 Your files don't stay
                 <br />
                 <span className="italic font-normal text-stone-600">
                   on our servers.
                 </span>
               </h1>
               <p className="text-lg sm:text-xl text-stone-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                 Files are temporarily held on Cloudflare's infrastructure during transfer,
                 then automatically deleted within 24 hours.
                 They are never stored permanently — only in your Google Drive or Dropbox.
               </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="px-10 py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all premium-shadow inline-flex items-center gap-3"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Get Started Securely <ArrowRight className="w-5 h-5" />
                </Button>
                <Link
                  className="px-10 py-5 border border-stone-300 text-stone-700 rounded-xl font-bold text-lg hover:bg-stone-100 transition-colors"
                  href="/pricing"
                >
                  View Pricing
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

         {/* Quick Stats */}
        <section className="py-10 px-4 sm:px-6 bg-[#1c1917]">
          <div className="max-w-5xl mx-auto">
            <Stagger
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center"
              delay={0.08}
            >
              {[
                { num: "AES-256", label: "Encryption" },
                { num: "Private", label: "By Design" },
                { num: "Direct", label: "Cloud Transfer" },
                { num: "Auto-Deleted", label: "Within 24h" },
              ].map((stat, i) => (
                <StaggerItem key={i}>
                  <div className="py-6">
                    <span className="text-2xl sm:text-3xl font-bold serif-font text-stone-50 block">
                      {stat.num}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mt-1 block">
                      {stat.label}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Security Pillars */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-stone-100">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  How We Protect You
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  Six pillars of security
                </h2>
                <p className="text-stone-700 mt-6 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                  A layered approach to security means every document is
                  protected at multiple levels — from upload to storage to
                  access control.
                </p>
              </div>
            </FadeIn>

            <Stagger
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              delay={0.08}
            >
              {securityPillars.map((pillar, index) => (
                <StaggerItem key={index}>
                  <div className="bg-white p-8 rounded-[2rem] border border-stone-100 premium-shadow-hover h-full flex flex-col">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6">
                      <pillar.icon className="w-6 h-6 text-[#1c1917]" />
                    </div>
                    <h3 className="text-xl font-bold serif-font text-[#1c1917] mb-3">
                      {pillar.title}
                    </h3>
                    <p className="text-stone-600 leading-relaxed mb-6 flex-grow">
                      {pillar.desc}
                    </p>
                    <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
                      <p className="text-xs text-stone-500 leading-relaxed font-medium italic">
                        {pillar.detail}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Summary Section */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-stone-100">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                In Short
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                We're the pipe, not the storage.
              </h2>
              <p className="text-stone-700 mt-6 text-lg leading-relaxed font-medium">
                Your files, your cloud, your control.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 sm:px-6 bg-[#1c1917] text-stone-50">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold serif-font mb-6">
                Your clients trust you
                <br />
                <span className="italic font-normal text-stone-400">
                  trust Dysumcorp with their data.
                </span>
              </h2>
              <p className="text-stone-400 font-medium mb-10 text-lg max-w-xl mx-auto leading-relaxed">
                Start collecting files in minutes. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="px-10 py-5 bg-stone-50 text-[#1c1917] rounded-xl font-bold text-lg hover:bg-stone-200 transition-colors"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Start Free Account
                </Button>
                <Link
                  className="px-10 py-5 border border-stone-700 text-stone-300 rounded-xl font-bold text-lg hover:border-stone-500 hover:text-stone-50 transition-colors inline-flex items-center gap-2"
                  href="/use-cases"
                >
                  See Use Cases <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-12 px-4 md:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1c1917] flex items-center justify-center rounded-lg">
              <span className="text-stone-50 font-bold text-sm">D</span>
            </div>
            <span className="serif-font font-bold text-[#1c1917]">
              dysumcorp
            </span>
          </div>
          <span className="text-sm font-medium text-stone-500">
            © 2026 Dysumcorp. All rights reserved.
          </span>
          <nav className="flex gap-8">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#1c1917] transition-colors"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
