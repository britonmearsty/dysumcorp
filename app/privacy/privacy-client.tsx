"use client";

import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Lock,
  Eye,
  Users,
  Bell,
  Globe,
} from "lucide-react";

import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations";

const privacyPrinciples = [
  {
    icon: Shield,
    title: "Data Security",
    desc: "We use industry-standard 256-bit AES encryption for all stored files and TLS 1.3 for data in transit. Your documents are protected from upload to delivery.",
  },
  {
    icon: Lock,
    title: "Your Data, Your Control",
    desc: "You own all files uploaded to Dysumcorp. Delete your account anytime and we'll permanently remove all your data within 30 days.",
  },
  {
    icon: Eye,
    title: "We Don't Sell Data",
    desc: "Dysumcorp never sells, rents, or trades your personal information or file data to third parties. Never.",
  },
  {
    icon: Users,
    title: "Limited Access",
    desc: "Only authorized team members with proper authentication can access your data, and all access is logged and audited.",
  },
  {
    icon: Bell,
    title: "Transparency",
    desc: "We provide detailed logs of all activity on your portals. You always know who uploaded what and when.",
  },
  {
    icon: Globe,
    title: "Global Compliance",
    desc: "Dysumcorp complies with GDPR, CCPA, and other major privacy regulations. Your data stays secure across borders.",
  },
];

const dataWeCollect = [
  {
    category: "Account Information",
    items: [
      "Email address and name you provide",
      "Company name and billing information",
      "Team members you invite",
    ],
  },
  {
    category: "Usage Data",
    items: [
      "Portal creation and upload activity",
      "File types and sizes (not content)",
      "Browser and device information",
    ],
  },
  {
    category: "Files You Upload",
    items: [
      "Documents shared by you and your clients",
      "File names and folder structures",
      "Upload timestamps",
    ],
  },
];

export function PrivacyClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="py-20 lg:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn delay={0.1}>
              <span className="inline-block text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-6">
                Privacy
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-6 leading-[1.1]">
                Your privacy is
                <br />
                <span className="italic font-normal text-stone-600">
                  our priority.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-stone-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                At Dysumcorp, we believe trust is earned through transparency.
                This policy explains exactly how we handle your data — nothing
                more, nothing less.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="px-10 py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all premium-shadow inline-flex items-center gap-3"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Start Free Account <ArrowRight className="w-5 h-5" />
                </Button>
                <Link
                  className="px-10 py-5 border border-stone-300 text-stone-700 rounded-xl font-bold text-lg hover:bg-stone-100 transition-colors inline-flex items-center gap-2"
                  href="/security"
                >
                  Security Details
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Privacy Principles */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-stone-100">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  Our Commitment
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  Six principles guide everything we do
                </h2>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privacyPrinciples.map((principle, index) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className="bg-white p-8 rounded-2xl border border-stone-100 premium-shadow-hover h-full">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6">
                      <principle.icon className="w-6 h-6 text-[#1c1917]" />
                    </div>
                    <h3 className="text-xl font-bold serif-font text-[#1c1917] mb-3">
                      {principle.title}
                    </h3>
                    <p className="text-stone-600 leading-relaxed">
                      {principle.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* What We Collect */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-[#fafaf9]">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  Data We Collect
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  Complete transparency
                </h2>
                <p className="text-stone-700 mt-6 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                  We believe you should know exactly what information we collect
                  and why.
                </p>
              </div>
            </FadeIn>

            <div className="space-y-8">
              {dataWeCollect.map((section, index) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className="bg-white p-8 rounded-2xl border border-stone-100 premium-shadow">
                    <h3 className="text-xl font-bold serif-font text-[#1c1917] mb-6">
                      {section.category}
                    </h3>
                    <ul className="space-y-3">
                      {section.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-stone-700"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1c1917] mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Cookie Section */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-[#1c1917] text-stone-50">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold serif-font mb-6">
                Cookies & Tracking
              </h2>
              <p className="text-stone-400 font-medium mb-6 text-lg max-w-xl mx-auto leading-relaxed">
                We use essential cookies to keep you logged in and improve your
                experience. We don't use third-party tracking or advertising
                cookies.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-stone-500">
                <Shield className="w-4 h-4" />
                No advertising trackers. No analytics from third parties.
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Contact CTA */}
        <section className="py-24 px-4 sm:px-6">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold serif-font text-[#1c1917] mb-6">
                Questions about privacy?
              </h2>
              <p className="text-stone-600 font-medium mb-10 text-lg max-w-xl mx-auto leading-relaxed">
                We're always happy to explain how we protect your data. Reach
                out anytime.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="px-10 py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-colors"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Get Started Free
                </Button>
                <Link
                  className="px-10 py-5 border border-stone-300 text-stone-700 rounded-xl font-bold text-lg hover:bg-stone-100 transition-colors inline-flex items-center gap-2"
                  href="/pricing"
                >
                  View Pricing <ArrowRight className="w-5 h-5" />
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
            <Link
              className="text-xs font-bold uppercase tracking-widest text-[#1c1917] transition-colors"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#1c1917] transition-colors"
              href="/privacy"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
