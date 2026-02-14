"use client";

import Link from "next/link";
import {
  ArrowRight,
  FolderOpen,
  Users,
  Clock,
  Shield,
  Zap,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FolderOpen,
    title: "Branded Upload Portals",
    description:
      "Impress clients with professional portals featuring your logo and brand colors.",
  },
  {
    icon: Clock,
    title: "Stop Chasing Files",
    description:
      "Send one link and get files automatically. No more follow-up emails.",
  },
  {
    icon: Shield,
    title: "Secure File Handling",
    description: "256-bit encryption keeps client files safe. SOC 2 compliant.",
  },
  {
    icon: Zap,
    title: "Instant Organization",
    description:
      "Files automatically land in the right folder, organized by client.",
  },
];

const useCases = [
  "Logo and brand assets from clients",
  "Website content and copy",
  "Photography and video files",
  "Contract signatures",
  "Client feedback and revisions",
  "Invoice and payment documents",
];

export default function FreelancersPage() {
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
              For Freelancers
            </div>
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Collect Client Files Without the Email Chase
            </h1>
            <p className="text-xl text-muted-foreground font-mono mb-8 max-w-2xl mx-auto">
              Designers, developers, writers & consultants collect files from
              clients directly to cloud storage. No client account required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono text-lg px-8 py-6"
                onClick={() => (window.location.href = "/auth")}
              >
                Start Free Account <ArrowRight className="ml-2 w-5 h-5" />
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
            <h2 className="text-3xl font-mono font-bold text-center mb-4">
              Everything You Need to Collect Client Files
            </h2>
            <p className="text-muted-foreground font-mono text-center mb-12 max-w-2xl mx-auto">
              Built specifically for freelance professionals who need a simple,
              secure way to receive files from clients.
            </p>
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

        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-mono font-bold text-center mb-12">
              What Freelancers Use Dysumcorp For
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {useCases.map((useCase) => (
                <div
                  key={useCase}
                  className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg"
                >
                  <Check className="h-5 w-5 text-[#334155] flex-shrink-0" />
                  <span className="font-mono">{useCase}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 lg:px-16 bg-[#334155]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-mono font-bold text-white mb-4">
              Ready to Simplify Your File Collection?
            </h2>
            <p className="text-white/80 font-mono mb-8">
              Join thousands of freelancers who collect client files 10x faster.
            </p>
            <Button
              className="rounded-none bg-white text-[#334155] hover:bg-white/90 font-mono text-lg px-8 py-6"
              onClick={() => (window.location.href = "/auth")}
            >
              Start Free Account <ArrowRight className="ml-2 w-5 h-5" />
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
