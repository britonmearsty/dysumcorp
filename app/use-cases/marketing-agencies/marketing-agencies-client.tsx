"use client";

import Link from "next/link";
import {
  ArrowRight,
  Users,
  FolderOpen,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FolderOpen,
    title: "Organize by Campaign",
    description:
      "Create separate upload links for each campaign or client project.",
  },
  {
    icon: Clock,
    title: "Faster Turnaround",
    description:
      "Clients upload files in one click. No waiting for email attachments.",
  },
  {
    icon: Shield,
    title: "NDA-Ready Security",
    description:
      "Enterprise-grade encryption keeps sensitive campaign data protected.",
  },
  {
    icon: Zap,
    title: "Team Collaboration",
    description: "Your whole team gets notifications when new files arrive.",
  },
];

import { LandingNavbar } from "@/components/landing-navbar";

export function MarketingAgenciesClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main>
        <section className="py-20 px-4 md:px-8 lg:px-16 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-stone-100 text-[#1c1917] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <Users className="h-4 w-4" />
              For Marketing Agencies
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold serif-font text-[#1c1917] mb-8 leading-[1.1]">
              Collect Client Creative Assets in One Place
            </h1>
            <p className="text-lg md:text-xl text-stone-700 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Marketing and creative agencies collect logos, images, videos, and
              campaign materials from clients. Streamline your creative
              workflow.
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
            <h2 className="text-3xl md:text-4xl font-bold serif-font text-center mb-6 text-[#1c1917]">
              Built for Creative Teams
            </h2>
            <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-8 bg-white rounded-3xl border border-stone-100 premium-shadow-hover"
                >
                  <div className="rounded-2xl bg-stone-50 p-4 w-fit mb-6">
                    <feature.icon className="h-6 w-6 text-[#1c1917]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1c1917] mb-3 serif-font">
                    {feature.title}
                  </h3>
                  <p className="text-stone-600 font-medium text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16 bg-[#1c1917] text-stone-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold serif-font mb-6">
              Ready to Streamline Your Agency Workflow?
            </h2>
            <p className="text-stone-400 font-medium mb-10 text-lg">
              Start collecting client assets in minutes.
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
