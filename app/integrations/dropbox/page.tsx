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

export default function DropboxPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 px-4 md:px-8 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
          <Link className="flex items-center gap-2" href="/">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xl font-bold">Dysumcorp</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Button
              className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
              onClick={() => (window.location.href = "/auth")}
            >
              GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[rgba(51,65,85,0.1)] text-[#334155] px-4 py-2 rounded-full text-sm font-mono font-semibold mb-6">
              <FolderOpen className="h-4 w-4" />
              Dropbox Integration
            </div>
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Collect Client Files Straight to Dropbox
            </h1>
            <p className="text-xl text-muted-foreground font-mono mb-8 max-w-2xl mx-auto">
              Receive files from clients directly in your Dropbox. No client
              account required. Simple, secure, and automatic delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono text-lg px-8 py-6"
                onClick={() => (window.location.href = "/auth")}
              >
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background font-mono text-lg px-8 py-6"
                variant="outline"
                onClick={() => (window.location.href = "/pricing")}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 lg:px-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-mono font-bold text-center mb-12">
              Why Professionals Choose Dropbox Integration
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex gap-4 p-6 bg-background rounded-lg border"
                >
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-[rgba(51,65,85,0.1)] p-3">
                      <benefit.icon className="h-6 w-6 text-[#334155]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-lg mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground font-mono text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-mono font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="p-6 bg-muted/20 rounded-lg">
                  <h3 className="font-mono font-bold text-lg mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground font-mono text-sm">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 lg:px-16 bg-[#334155]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-mono font-bold text-white mb-4">
              Ready to Collect Files to Dropbox?
            </h2>
            <p className="text-white/80 font-mono mb-8">
              Start your free trial today. No credit card required.
            </p>
            <Button
              className="rounded-none bg-white text-[#334155] hover:bg-white/90 font-mono text-lg px-8 py-6"
              onClick={() => (window.location.href = "/auth")}
            >
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              © 2025 Dysumcorp. All rights reserved.
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground"
              href="/privacy"
            >
              Privacy
            </Link>
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground"
              href="/contact"
            >
              Contact
            </Link>
          </nav>
        </div>
      </footer>

      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
        type="application/ld+json"
      />
    </div>
  );
}
