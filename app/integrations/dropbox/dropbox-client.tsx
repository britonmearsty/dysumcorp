"use client";

import Link from "next/link";
import { ArrowRight, FolderOpen, Shield, Zap, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: FolderOpen,
    title: "Seamless Dropbox Integration",
    description:
      "Files are automatically uploaded to your specified Dropbox folder. Everything stays organized in your existing workflow.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "Dropbox's world-class security infrastructure protects your files. Plus, Dysumcorp adds an extra layer of encryption.",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "Files appear in Dropbox the moment your client uploads them. No delays, no manual transfers.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Get notified immediately when files arrive. Stay on top of client deliveries without checking manually.",
  },
];

const faqs = [
  {
    question: "Does my client need a Dropbox account?",
    answer:
      "No. Your clients can upload files through your upload link without any account. They don't even need Dropbox installed.",
  },
  {
    question: "Can I select which Dropbox folder receives files?",
    answer:
      "Absolutely. You can configure any folder in your Dropbox to receive client uploads. Create separate folders for different clients or projects.",
  },
  {
    question: "What file types and sizes are supported?",
    answer:
      "Dysumcorp supports all file types. Professional plans allow files up to 10GB. The free plan supports files up to 100MB.",
  },
  {
    question: "Can I use both Google Drive and Dropbox?",
    answer:
      "Yes! On Professional plans, you can connect both Google Drive and Dropbox. Choose which storage destination for each upload link.",
  },
];

import { LandingNavbar } from "@/components/landing-navbar";

export function DropboxClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        <section className="py-20 px-4 md:px-8 lg:px-16 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-stone-100 text-[#1c1917] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <FolderOpen className="h-4 w-4" />
              Dropbox Integration
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-8 leading-[1.1]">
              Collect Client Files Straight to Dropbox
            </h1>
            <p className="text-lg md:text-xl text-stone-700 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Receive files from clients directly in your Dropbox. No client
              account required. Simple, secure, and automatic delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                className="px-10 py-6 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all premium-shadow flex items-center justify-center gap-3"
                onClick={() => (window.location.href = "/auth")}
              >
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                className="px-10 py-6 bg-white border border-stone-200 text-[#1c1917] rounded-xl font-bold text-lg hover:bg-stone-50 transition-colors"
                variant="outline"
                onClick={() => (window.location.href = "/pricing")}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold serif-font text-center mb-16 text-[#1c1917]">
              Why Professionals Choose Dropbox Integration
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex gap-6 p-8 bg-white rounded-3xl border border-stone-100 premium-shadow-hover"
                >
                  <div className="flex-shrink-0">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <benefit.icon className="h-6 w-6 text-[#1c1917]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1c1917] mb-3 serif-font">
                      {benefit.title}
                    </h3>
                    <p className="text-stone-600 font-medium text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold serif-font text-center mb-16 text-[#1c1917]">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="p-8 bg-white border border-stone-100 rounded-[2rem]"
                >
                  <h3 className="text-lg font-bold text-[#1c1917] mb-4 serif-font">
                    {faq.question}
                  </h3>
                  <p className="text-stone-600 font-medium text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16 bg-[#1c1917] text-stone-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold serif-font mb-6">
              Ready to Collect Files to Dropbox?
            </h2>
            <p className="text-stone-400 font-medium mb-10 text-lg">
              Start your free trial today. No credit card required.
            </p>
            <Button
              className="px-8 py-5 bg-stone-50 text-[#1c1917] rounded-xl font-bold text-lg hover:bg-stone-200 transition-colors"
              onClick={() => (window.location.href = "/auth")}
            >
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-12 px-4 md:px-8 lg:px-16 bg-white/50">
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
            <Link
              className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#1c1917] transition-colors"
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
            <Link
              className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#1c1917] transition-colors"
              href="/contact"
            >
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
