import { Metadata } from "next";
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

export const metadata: Metadata = {
  title:
    "Client File Collection for Marketing Agencies | Creative Asset Management",
  description:
    "Marketing and creative agencies collect client files, creative assets, and campaign materials directly to cloud storage. Streamline your client workflow today.",
  keywords: [
    "marketing agency file collection",
    "creative agency client portal",
    "collect client assets",
    "agency file management",
    "client creative files",
  ],
};

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

export default function MarketingAgenciesPage() {
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
              <Users className="h-4 w-4" />
              For Marketing Agencies
            </div>
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Collect Client Creative Assets in One Place
            </h1>
            <p className="text-xl text-muted-foreground font-mono mb-8 max-w-2xl mx-auto">
              Marketing and creative agencies collect logos, images, videos, and
              campaign materials from clients. Streamline your creative
              workflow.
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
              Built for Creative Teams
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 bg-background rounded-lg border"
                >
                  <div className="rounded-full bg-[rgba(51,65,85,0.1)] p-3 w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-[#334155]" />
                  </div>
                  <h3 className="font-mono font-bold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground font-mono text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 lg:px-16 bg-[#334155]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-mono font-bold text-white mb-4">
              Ready to Streamline Your Agency Workflow?
            </h2>
            <p className="text-white/80 font-mono mb-8">
              Start collecting client assets in minutes.
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
    </div>
  );
}
