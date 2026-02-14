import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderOpen, Shield, Zap, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title:
    "Receive Client Files Directly to Google Drive | Dysumcorp Integration",
  description:
    "Let clients send you files straight to your Google Drive folder. No account required on their end. Simple, secure, and automatic file collection.",
  keywords: [
    "receive files to google drive",
    "client upload google drive",
    "google drive client portal",
    "file collection google drive",
    "client file transfer to google drive",
    "google drive integration",
    "collect files to google drive",
  ],
  openGraph: {
    title:
      "Receive Client Files Directly to Google Drive | Dysumcorp Integration",
    description:
      "Let clients send you files straight to your Google Drive folder. No account required.",
  },
};

const benefits = [
  {
    icon: FolderOpen,
    title: "Automatic File Organization",
    description:
      "Files from clients automatically land in your specified Google Drive folder, organized by client name or custom fields.",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description:
      "Your data is protected with 256-bit AES encryption. Google Drive's enterprise-grade security keeps your files safe.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description:
      "As soon as your client uploads a file, it appears in your Google Drive. No waiting, no syncing issues.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Get instant email notifications when clients upload files to your Google Drive.",
  },
];

const faqs = [
  {
    question: "Does my client need a Google account?",
    answer:
      "No! Your clients can upload files through your unique upload link without creating any account or logging in. They don't need Google Drive either.",
  },
  {
    question: "Can I choose which folder files go to?",
    answer:
      "Yes, you can specify exactly which Google Drive folder you want files to be uploaded to. You can also create dynamic folder structures based on client information.",
  },
  {
    question: "What happens if I'm not signed into Google Drive?",
    answer:
      "No problem! Files are uploaded to your Google Drive automatically in the background. You can check them whenever you're ready.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Dysumcorp supports files up to 10GB on Professional plans. The free plan supports files up to 100MB.",
  },
];

export default function GoogleDrivePage() {
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
              Google Drive Integration
            </div>
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Collect Client Files Directly to Google Drive
            </h1>
            <p className="text-xl text-muted-foreground font-mono mb-8 max-w-2xl mx-auto">
              Let clients upload files straight to your Google Drive folder. No
              account required on their end. Simple, secure, and automatic.
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
              Why Professionals Choose Google Drive Integration
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
              Ready to Collect Files to Google Drive?
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
