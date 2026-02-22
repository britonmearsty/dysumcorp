"use client";

import Link from "next/link";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  Server,
  Building,
  Eye,
  FileKey,
  AlertTriangle,
  RefreshCw,
  Users,
  Globe,
} from "lucide-react";

import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/animations";

const securityPillars = [
  {
    icon: Lock,
    title: "256-bit AES Encryption",
    desc: "Every file is encrypted with military-grade AES-256 encryption both at rest and in transit. Your documents are unreadable to anyone who intercepts them — full stop.",
    detail:
      "We use TLS 1.3 for data in transit and AES-256 at rest, the same standard used by financial institutions worldwide.",
  },
  {
    icon: Eye,
    title: "Zero-Knowledge Architecture",
    desc: "Dysumcorp is a conduit, not a vault. Files flow directly from your client's browser to your cloud storage. We never store your documents on our servers permanently.",
    detail:
      "Files exist on our infrastructure only for the milliseconds it takes to relay them to your connected cloud storage. We can't read them.",
  },
  {
    icon: FileKey,
    title: "Access Control",
    desc: "Every portal can be protected with a unique password. Combine optional password protection with expiring links to create time-limited, credential-gated upload windows.",
    detail:
      "Passwords are hashed using bcrypt before storage. Link expiry is enforced at the server level with no client-side bypass.",
  },
  {
    icon: AlertTriangle,
    title: "Malware Scanning",
    desc: "All uploaded files are scanned for malware before being relayed to your cloud storage. Infected files are quarantined immediately and you are notified.",
    detail:
      "Integrated with industry-leading threat intelligence feeds, updated continuously to catch emerging threats.",
  },
  {
    icon: RefreshCw,
    title: "Audit Trails",
    desc: "Every file upload, portal access, and configuration change is logged with a full audit trail. Know exactly who accessed what and when.",
    detail:
      "Audit logs are tamper-proof, retained for 12 months, and exportable for compliance reporting.",
  },
  {
    icon: Users,
    title: "Team Permissions",
    desc: "Control exactly what each team member can see and do within your organization. Role-based access control ensures sensitive portals stay protected.",
    detail:
      "Granular permissions down to individual portal level. SSO integrations available for enterprise customers.",
  },
];

const certifications = [
  {
    icon: Server,
    title: "SOC 2 Type II",
    badge: "Audited",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
    desc: "Audited and certified by independent third parties against the AICPA's Trust Services Criteria, covering security, availability, and confidentiality.",
    items: [
      "Annual third-party audit",
      "Security, Availability & Confidentiality",
      "Continuous controls monitoring",
      "Report available on request",
    ],
  },
  {
    icon: ShieldCheck,
    title: "GDPR Compliant",
    badge: "Certified",
    badgeColor: "bg-green-50 text-green-700 border-green-100",
    desc: "Full adherence to the European Union's General Data Protection Regulation. We uphold data subject rights, lawful processing, and all required safeguards.",
    items: [
      "EU data residency options",
      "Data Processing Agreements (DPA)",
      "Right to erasure supported",
      "Data portability available",
    ],
  },
  {
    icon: Building,
    title: "HIPAA Ready",
    badge: "Healthcare",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
    desc: "Infrastructure and processes designed for handling Protected Health Information (PHI) for healthcare providers and their business associates.",
    items: [
      "BAA (Business Associate Agreement) available",
      "PHI access logging",
      "Minimum necessary enforcement",
      "Breach notification protocols",
    ],
  },
  {
    icon: Globe,
    title: "Infrastructure",
    badge: "Enterprise",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    desc: "Hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLA, geo-redundant backups, and DDoS mitigation built in.",
    items: [
      "99.9% uptime SLA",
      "Geo-redundant backups",
      "DDoS protection",
      "SOC-compliant data centers",
    ],
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
                Bank-grade protection
                <br />
                <span className="italic font-normal text-stone-600">
                  for sensitive data.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-stone-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                Security isn&apos;t an afterthought at Dysumcorp — it&apos;s the
                core of everything we build. Your documents are encrypted from
                the moment they leave your client&apos;s device until they reach
                your cloud storage.
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
                { num: "256-bit", label: "AES Encryption" },
                { num: "Zero", label: "Knowledge Architecture" },
                { num: "SOC 2", label: "Type II Certified" },
                { num: "99.9%", label: "Uptime SLA" },
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

        {/* Compliance Certifications */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-[#fafaf9]">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
                  Compliance
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
                  Built for regulated industries
                </h2>
                <p className="text-stone-700 mt-6 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                  Whether you&apos;re a law firm, healthcare provider, or
                  financial firm, Dysumcorp meets the compliance standards your
                  industry demands.
                </p>
              </div>
            </FadeIn>

            <Stagger
              className="grid grid-cols-1 sm:grid-cols-2 gap-8"
              delay={0.1}
            >
              {certifications.map((cert, index) => (
                <StaggerItem key={index}>
                  <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-stone-100 premium-shadow-hover h-full flex flex-col">
                    <div className="flex items-start gap-5 mb-6">
                      <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <cert.icon className="w-7 h-7 text-[#1c1917]" />
                      </div>
                      <div>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-2 ${cert.badgeColor}`}
                        >
                          {cert.badge}
                        </span>
                        <h3 className="text-2xl font-bold serif-font text-[#1c1917]">
                          {cert.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-stone-600 leading-relaxed mb-6 flex-grow">
                      {cert.desc}
                    </p>
                    <ul className="space-y-2.5">
                      {cert.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-sm font-medium text-stone-700"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#1c1917] flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
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
                Start collecting documents with enterprise-grade security today.
                Free to get started, no credit card required.
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
