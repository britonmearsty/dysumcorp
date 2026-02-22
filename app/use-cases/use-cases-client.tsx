"use client";

import Link from "next/link";
import {
  ArrowRight,
  Scale,
  Calculator,
  PieChart,
  Building2,
  Camera,
  Megaphone,
  CheckCircle,
} from "lucide-react";

import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/animations";

const useCases = [
  {
    icon: Scale,
    title: "Law Firms",
    tag: "Case Intake",
    tagColor: "bg-blue-50 text-blue-700 border-blue-100",
    href: "/use-cases/lawyers",
    headline: "Eliminate document chaos at case intake",
    summary:
      "Attorneys lose hours each week chasing contracts, ID documents, and evidence files via email. Dysumcorp gives every client a secure, branded portal where they upload exactly what you need — organized, encrypted, and auto-synced to your cloud.",
    benefits: [
      "Secure KYC document collection",
      "Attorney-client privilege protection",
      "SOC 2 Type II compliant",
      "Auto-organized by case folder",
      "No client account required",
      "Expiring link access control",
    ],
  },
  {
    icon: Calculator,
    title: "Accountants",
    tag: "Tax Season",
    tagColor: "bg-green-50 text-green-700 border-green-100",
    href: "/use-cases/accountants",
    headline: "Make tax season frictionless",
    summary:
      "Chasing bank statements, receipts, and signed forms from dozens of clients is the #1 bottleneck for accounting firms. Dysumcorp replaces email threads with a structured upload checklist that guides clients step-by-step.",
    benefits: [
      "Structured upload checklists",
      "Direct sync to Google Drive / Dropbox",
      "Tax record organization by year",
      "Automatic email notifications",
      "Bulk portal creation for clients",
      "Deadline reminders & expiring links",
    ],
  },
  {
    icon: PieChart,
    title: "Wealth Advisors",
    tag: "High-Net-Worth",
    tagColor: "bg-amber-50 text-amber-700 border-amber-100",
    href: "/use-cases/freelancers",
    headline: "Elevate the client onboarding experience",
    summary:
      "High-net-worth clients expect a premium, discreet experience. Dysumcorp's white-labeled portals let you collect portfolio statements, identification, and compliance documents under your firm's brand — not a generic link.",
    benefits: [
      "White-labeled client portals",
      "Custom domain support",
      "Encrypted document delivery",
      "Password-protected access",
      "Compliance-friendly audit trail",
      "Premium, branded experience",
    ],
  },
  {
    icon: Building2,
    title: "Real Estate",
    tag: "Transaction Efficiency",
    tagColor: "bg-purple-50 text-purple-700 border-purple-100",
    href: "/use-cases/marketing-agencies",
    headline: "Close deals faster with organized documents",
    summary:
      "Real estate transactions involve mountains of paperwork — appraisals, inspections, title documents, and signed disclosures. Dysumcorp centralizes everything in one portal per deal, making closings faster and far less stressful.",
    benefits: [
      "Per-property deal portals",
      "Appraisal & inspection file collection",
      "Signed disclosure organization",
      "Buyer/seller document tracking",
      "Auto-sync to OneDrive / Dropbox",
      "Instant notification on upload",
    ],
  },
  {
    icon: Camera,
    title: "Photographers",
    tag: "Client Delivery",
    tagColor: "bg-rose-50 text-rose-700 border-rose-100",
    href: "/use-cases/photographers",
    headline: "Collect shoot briefs and deliver galleries",
    summary:
      "Photographers need client briefs, signed contracts, and reference images before a shoot, and a secure way to deliver high-res galleries after. Dysumcorp handles both sides of the workflow in one polished experience.",
    benefits: [
      "Pre-shoot brief collection",
      "Contract & release form uploads",
      "High-res gallery delivery",
      "Watermarked preview support",
      "Client-select portal for proofing",
      "Branded download experience",
    ],
  },
  {
    icon: Megaphone,
    title: "Marketing Agencies",
    tag: "Asset Collection",
    tagColor: "bg-orange-50 text-orange-700 border-orange-100",
    href: "/use-cases/marketing-agencies",
    headline: "Get brand assets from clients without the back-and-forth",
    summary:
      "Agencies waste days waiting for logos, brand guidelines, product photos, and ad copy from clients. Dysumcorp organizes every asset request into a structured checklist, ensuring you get exactly what you need for launch.",
    benefits: [
      "Structured brand asset checklists",
      "Logo, photo & video collection",
      "Multi-client campaign portals",
      "File type & size validation",
      "Auto-organized by campaign",
      "Instant notifications on upload",
    ],
  },
];

const footerLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function UseCasesClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="py-20 lg:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn delay={0.1}>
              <span className="inline-block text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-6">
                Industries
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-6 leading-[1.1]">
                Built for professionals
                <br />
                <span className="italic font-normal text-stone-600">
                  who demand trust.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-stone-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                Dysumcorp was built for high-stakes industries where data
                security, client experience, and operational efficiency are
                non-negotiable.
              </p>
              <Button
                className="px-10 py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all premium-shadow inline-flex items-center gap-3"
                onClick={() => (window.location.href = "/auth")}
              >
                Start Free Account <ArrowRight className="w-5 h-5" />
              </Button>
            </FadeIn>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 bg-stone-100">
          <div className="max-w-7xl mx-auto">
            <Stagger
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              delay={0.08}
            >
              {useCases.map((useCase, index) => (
                <StaggerItem key={index}>
                  <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 sm:p-12 premium-shadow-hover h-full flex flex-col">
                    <div className="flex items-start gap-6 mb-8">
                      <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <useCase.icon className="w-7 h-7 text-[#1c1917]" />
                      </div>
                      <div>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-2 ${useCase.tagColor}`}
                        >
                          {useCase.tag}
                        </span>
                        <h2 className="text-2xl font-bold serif-font text-[#1c1917]">
                          {useCase.title}
                        </h2>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-stone-800 mb-4 leading-snug">
                      {useCase.headline}
                    </h3>

                    <p className="text-stone-600 leading-relaxed mb-8 flex-grow">
                      {useCase.summary}
                    </p>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                      {useCase.benefits.map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-stone-700 font-medium"
                        >
                          <CheckCircle className="w-4 h-4 text-[#1c1917] flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <Link
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#1c1917] hover:gap-3 transition-all"
                      href={useCase.href}
                    >
                      Learn more <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 bg-[#1c1917] text-stone-50">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold serif-font mb-6">
                Ready to streamline your
                <br />
                <span className="italic font-normal text-stone-400">
                  document collection?
                </span>
              </h2>
              <p className="text-stone-400 font-medium mb-10 text-lg max-w-xl mx-auto leading-relaxed">
                Join thousands of professionals who collect documents securely,
                efficiently, and without the email headache.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="px-10 py-5 bg-stone-50 text-[#1c1917] rounded-xl font-bold text-lg hover:bg-stone-200 transition-colors"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Link
                  className="px-10 py-5 border border-stone-700 text-stone-300 rounded-xl font-bold text-lg hover:border-stone-500 hover:text-stone-50 transition-colors"
                  href="/pricing"
                >
                  View Pricing
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
