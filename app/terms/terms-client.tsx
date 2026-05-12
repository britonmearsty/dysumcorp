"use client";

import Link from "next/link";
import {
  ArrowRight,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations";

const highlights = [
  {
    icon: Shield,
    title: "Your Data, Your Ownership",
    desc: "You retain full ownership of all files uploaded to Dysumcorp. We're just the secure conduit that gets them where they need to go.",
  },
  {
    icon: FileText,
    title: "Responsible Use",
    desc: "Dysumcorp is designed for legitimate business purposes — collecting documents from clients, teams, and partners.",
  },
  {
    icon: CheckCircle,
    title: "Service Reliability",
    desc: "We commit to maintaining 99.9% uptime. When issues arise, we communicate transparently and fix them fast.",
  },
];

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By creating a Dysumcorp account or using our service, you agree to be bound by these Terms of Service.",
      "If you don't agree to these terms, please don't use Dysumcorp.",
      "We may update these terms periodically. Continued use means you accept any changes.",
    ],
  },
  {
    title: "2. Account Responsibilities",
    content: [
      "You're responsible for maintaining the security of your account credentials.",
      "You must be at least 18 years old to create an account.",
      "You're responsible for all activity under your account.",
      "Notify us immediately of any unauthorized access or security breaches.",
    ],
  },
     {
       title: "3. Ownership of Your Data",
       content: [
         "You retain full ownership of all files you upload to Dysumcorp.",
         "We never claim ownership of your documents or use them for any purpose without your consent.",
         "Files in transit are automatically purged from Dysumcorp infrastructure within 24 hours of upload, regardless of account status. Account data and portal settings are removed within 30 days of account closure.",
         "You grant us permission to store and transmit your files as necessary to provide the service.",
       ],
     },
  {
    title: "4. Acceptable Use",
    content: [
      "Dysumcorp is for lawful purposes only.",
      "You may not upload harmful, illegal, or prohibited content.",
      "You may not attempt to reverse engineer or compromise our security.",
      "You may not resell or redistribute the service without authorization.",
      "Your portals must comply with applicable privacy laws regarding client data.",
    ],
  },
  {
    title: "5. Payment & Subscriptions",
    content: [
      "Some features require a paid subscription.",
      "You're billed according to the plan you select.",
      "Subscriptions renew automatically unless cancelled.",
      "We offer refunds on a case-by-case basis for annual plans within 30 days of purchase.",
      "Failed payments may result in service suspension.",
    ],
  },
  {
    title: "6. Service Availability",
    content: [
      "We strive for 99.9% uptime but don't guarantee it.",
      "Scheduled maintenance will be announced in advance when possible.",
      "We aren't liable for service interruptions due to factors outside our control.",
      "In case of extended outages, we'll provide prorated service credits.",
    ],
  },
  {
    title: "7. Limitation of Liability",
    content: [
      "Dysumcorp is provided 'as is' without warranties of any kind.",
      "We aren't liable for indirect, incidental, or consequential damages.",
      "Our total liability is limited to the amount you paid in the past 12 months.",
      "We aren't responsible for data loss due to your actions (e.g., accidental deletion).",
    ],
  },
  {
    title: "8. Termination",
    content: [
      "You can cancel your account anytime from settings.",
      "We can suspend or terminate accounts that violate these terms.",
      "Upon termination, you can export your data within 30 days.",
      "Some provisions survive termination (like liability limitations).",
    ],
  },
  {
    title: "9. Contact",
    content: [
      "Questions about these terms? We're here to help.",
      "Email us at legal@dysumcorp.pro",
      "We'll respond within 3 business days.",
    ],
  },
];

export function TermsClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="py-20 lg:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn delay={0.1}>
              <span className="inline-block text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-6">
                Terms of Service
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-6 leading-[1.1]">
                The agreement
                <br />
                <span className="italic font-normal text-stone-600">
                  that keeps us honest.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-stone-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                These terms exist to protect both you and Dysumcorp. We keep
                them clear, fair, and focused on what matters: your data
                security and a reliable service.
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
                  href="/privacy"
                >
                  Privacy Policy
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Key Highlights */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-stone-100">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  In Short
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  What you need to know
                </h2>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {highlights.map((item, index) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className="bg-white p-8 rounded-2xl border border-stone-100 premium-shadow-hover h-full">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6">
                      <item.icon className="w-6 h-6 text-[#1c1917]" />
                    </div>
                    <h3 className="text-xl font-bold serif-font text-[#1c1917] mb-3">
                      {item.title}
                    </h3>
                    <p className="text-stone-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Full Terms */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-[#fafaf9]">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  Legal Details
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  Complete Terms
                </h2>
              </div>
            </FadeIn>

            <div className="space-y-10">
              {sections.map((section, index) => (
                <FadeIn key={index} delay={index * 0.05}>
                  <div className="bg-white p-8 rounded-2xl border border-stone-100 premium-shadow">
                    <h3 className="text-xl font-bold serif-font text-[#1c1917] mb-6">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.content.map((item, i) => (
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

        {/* Compliance Note */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-[#1c1917] text-stone-50">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-800 rounded-full mb-6">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold serif-font mb-6">
                Business Compliance
              </h2>
              <p className="text-stone-400 font-medium mb-6 text-lg max-w-xl mx-auto leading-relaxed">
                If you're using Dysumcorp for business purposes, ensure your use
                complies with applicable laws in your jurisdiction regarding
                document retention, client consent, and data protection.
              </p>
              <p className="text-stone-500 text-sm">
                Dysumcorp provides the tools — you're responsible for how you
                use them.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* Contact CTA */}
        <section className="py-24 px-4 sm:px-6">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold serif-font text-[#1c1917] mb-6">
                Questions?
              </h2>
              <p className="text-stone-600 font-medium mb-10 text-lg max-w-xl mx-auto leading-relaxed">
                These terms are here to protect everyone. If something isn't
                clear, let's talk.
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
              className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#1c1917] transition-colors"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="text-xs font-bold uppercase tracking-widest text-[#1c1917] transition-colors"
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
