"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing-navbar";

export function AccountantsClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        <section className="py-20 px-4 md:px-8 lg:px-16 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-stone-100 text-[#1c1917] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <Shield className="h-4 w-4" />
              For Accountants & CPAs
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-8 leading-[1.1]">
              Collect Tax Documents Securely from Clients
            </h1>
            <p className="text-lg md:text-xl text-stone-700 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              CPAs and accountants collect financial documents, tax returns, and
              records securely. Bank-level encryption. No client accounts
              needed.
            </p>
            <Button
              className="px-10 py-6 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all premium-shadow flex items-center justify-center gap-3 mx-auto"
              onClick={() => (window.location.href = "/auth")}
            >
              Start Free Account <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16 bg-[#1c1917] text-stone-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold serif-font mb-6">
              Secure Document Collection for Tax Season
            </h2>
            <p className="text-stone-400 font-medium mb-10 text-lg">
              Collect documents from clients securely. SOC 2 compliant
              encryption.
            </p>
            <Button
              className="px-8 py-5 bg-stone-50 text-[#1c1917] rounded-xl font-bold text-lg hover:bg-stone-200 transition-colors"
              onClick={() => (window.location.href = "/auth")}
            >
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
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
          </nav>
        </div>
      </footer>
    </div>
  );
}
