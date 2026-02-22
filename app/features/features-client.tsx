"use client";

import Link from "next/link";
import {
  ArrowRight,
  CloudUpload,
  Zap,
  CheckSquare,
  Lock,
  Timer,
  BarChart3,
  Globe,
  Bell,
  FileType,
  Shield,
  Smartphone,
} from "lucide-react";

import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/animations";

const coreFeatures = [
  {
    icon: CloudUpload,
    title: "Cloud Gravity",
    tag: "Core Feature",
    desc: "Files collected by clients sync directly to your Google Drive, Dropbox, or OneDrive — no manual downloads, no intermediary storage. Documents arrive organized exactly where you expect them.",
    details: [
      "Google Drive integration",
      "Dropbox integration",
      "OneDrive integration",
      "Automatic folder creation per portal",
      "Zero intermediary storage",
    ],
    dark: false,
  },
  {
    icon: CheckSquare,
    title: "Smart Checklists",
    tag: "Productivity",
    desc: "Stop chasing clients for missing documents. Define exactly what you need — ID, bank statements, contracts — and Dysumcorp guides clients through uploading each item with clear instructions and real-time progress.",
    details: [
      "Customizable required document lists",
      "Per-item upload instructions",
      "Progress tracking for clients",
      "Missing document reminders",
      "Completion status dashboard",
    ],
    dark: true,
  },
  {
    icon: Zap,
    title: "Professional Branding",
    tag: "Coming Soon",
    desc: "Maintain your firm's professional identity with fully white-labeled portals under your own domain. Clients see your brand, your colors, and your logo — not Dysumcorp.",
    details: [
      "Custom domain support",
      "White-label portal experience",
      "Custom logo & colors",
      "Branded email notifications",
      "Remove all Dysumcorp branding",
    ],
    dark: false,
    comingSoon: true,
  },
];

const additionalFeatures = [
  {
    icon: Lock,
    title: "Password Protection",
    desc: "Secure sensitive portals with a password. Share the link and passphrase separately for an extra layer of access control.",
  },
  {
    icon: Timer,
    title: "Expiring Links",
    desc: "Set portals to automatically expire after a defined date or number of uploads, ensuring time-limited access for compliance.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    desc: "Track upload activity, monitor portal performance, and understand client engagement with a comprehensive analytics dashboard.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    desc: "Get notified by email the moment a client uploads a file, so you can act on new documents immediately without checking manually.",
  },
  {
    icon: FileType,
    title: "File Type Validation",
    desc: "Specify which file types are accepted on each portal. Prevent clients from uploading wrong formats before they even try.",
  },
  {
    icon: Globe,
    title: "No Client Account Needed",
    desc: "Clients upload instantly through a browser link — no sign-up, no friction, no account creation. Just a link and a file.",
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    desc: "All files are encrypted in transit with TLS and at rest with 256-bit AES. Your documents are protected from upload to delivery.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Upload UX",
    desc: "Clients can upload photos directly from their phones, including camera captures, making mobile the first-class upload experience.",
  },
];

const footerLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function FeaturesClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="py-20 lg:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn delay={0.1}>
              <span className="inline-block text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-6">
                Capabilities
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-6 leading-[1.1]">
                Everything you need
                <br />
                <span className="italic font-normal text-stone-600">
                  to collect files.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-stone-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                Dysumcorp combines cloud-native document collection, intelligent
                checklists, and enterprise security into one seamless platform
                built for professionals.
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
                  href="/pricing"
                >
                  View Pricing
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-stone-100">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  Core Features
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  The foundation of secure collection
                </h2>
              </div>
            </FadeIn>

            <Stagger
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              delay={0.1}
            >
              {coreFeatures.map((feature, index) => (
                <StaggerItem key={index}>
                  <div
                    className={`p-8 sm:p-10 rounded-[2.5rem] border flex flex-col h-full premium-shadow-hover relative ${
                      feature.dark
                        ? "bg-[#1c1917] text-stone-50 border-stone-800"
                        : "bg-white border-stone-100"
                    }`}
                  >
                    {feature.comingSoon && (
                      <div className="absolute top-6 right-6 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full border border-amber-200">
                        Coming Soon
                      </div>
                    )}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                        feature.dark ? "bg-white/10" : "bg-stone-100"
                      }`}
                    >
                      <feature.icon
                        className={`w-6 h-6 ${feature.dark ? "text-stone-200" : "text-[#1c1917]"}`}
                      />
                    </div>
                    <div
                      className={`inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4 ${
                        feature.dark
                          ? "bg-white/10 text-stone-300"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {feature.tag}
                    </div>
                    <h3
                      className={`text-2xl font-bold serif-font mb-4 ${feature.dark ? "text-stone-50" : "text-[#1c1917]"}`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`leading-relaxed mb-8 flex-grow ${feature.dark ? "text-stone-300" : "text-stone-600"}`}
                    >
                      {feature.desc}
                    </p>
                    <ul className="space-y-3">
                      {feature.details.map((detail, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-2 text-sm font-medium ${feature.dark ? "text-stone-300" : "text-stone-700"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${feature.dark ? "bg-stone-400" : "bg-[#1c1917]"}`}
                          />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Additional Features Grid */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-[#fafaf9]">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  Full Feature Set
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  More power, less friction
                </h2>
                <p className="text-stone-700 mt-6 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                  Every feature is designed to save you time and give your
                  clients a seamless experience.
                </p>
              </div>
            </FadeIn>

            <Stagger
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              delay={0.07}
            >
              {additionalFeatures.map((feature, index) => (
                <StaggerItem key={index}>
                  <div className="bg-white p-6 rounded-2xl border border-stone-100 premium-shadow-hover h-full">
                    <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-[#1c1917]" />
                    </div>
                    <h3 className="font-bold text-lg serif-font text-[#1c1917] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Compare Plans CTA */}
        <section className="py-24 px-4 sm:px-6 bg-[#1c1917] text-stone-50">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold serif-font mb-6">
                Which features do you get?
              </h2>
              <p className="text-stone-400 font-medium mb-10 text-lg max-w-xl mx-auto leading-relaxed">
                Core features are free. Unlock the full power of Dysumcorp —
                unlimited portals, white-labeling, analytics, and more — with
                Pro.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="px-10 py-5 bg-stone-50 text-[#1c1917] rounded-xl font-bold text-lg hover:bg-stone-200 transition-colors"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Get Started Free
                </Button>
                <Link
                  className="px-10 py-5 border border-stone-700 text-stone-300 rounded-xl font-bold text-lg hover:border-stone-500 hover:text-stone-50 transition-colors inline-flex items-center gap-2"
                  href="/pricing"
                >
                  Compare Plans <ArrowRight className="w-5 h-5" />
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
            © 2025 Dysumcorp. All rights reserved.
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
