import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Document Collection for Accountants | Secure Client Document Portal",
  description:
    "Accountants collect tax documents, financial statements, and records from clients securely. No client login required. Bank-level encryption for sensitive data.",
  keywords: [
    "accountant document collection",
    "tax document portal",
    "CPA client portal",
    "secure document collection",
    "accounting file sharing",
  ],
};

export default function AccountantsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 px-4 md:px-8 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
          <Link className="flex items-center gap-2" href="/">
            <span className="font-mono text-xl font-bold">Dysumcorp</span>
          </Link>
          <Button
            className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
            onClick={() => (window.location.href = "/auth")}
          >
            GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </header>

      <main>
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[rgba(51,65,85,0.1)] text-[#334155] px-4 py-2 rounded-full text-sm font-mono font-semibold mb-6">
              <Shield className="h-4 w-4" />
              For Accountants & CPAs
            </div>
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Collect Tax Documents Securely from Clients
            </h1>
            <p className="text-xl text-muted-foreground font-mono mb-8 max-w-2xl mx-auto">
              CPAs and accountants collect financial documents, tax returns, and
              records securely. Bank-level encryption. No client accounts
              needed.
            </p>
            <Button
              className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono text-lg px-8 py-6"
              onClick={() => (window.location.href = "/auth")}
            >
              Start Free Account <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 lg:px-16 bg-[#334155]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-mono font-bold text-white mb-4">
              Secure Document Collection for Tax Season
            </h2>
            <p className="text-white/80 font-mono mb-8">
              Collect documents from clients securely. SOC 2 compliant
              encryption.
            </p>
            <Button
              className="rounded-none bg-white text-[#334155] hover:bg-white/90 font-mono text-lg px-8 py-6"
              onClick={() => (window.location.href = "/auth")}
            >
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-mono text-sm text-muted-foreground">
            © 2025 Dysumcorp. All rights reserved.
          </span>
          <nav className="flex gap-6">
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
          </nav>
        </div>
      </footer>
    </div>
  );
}
