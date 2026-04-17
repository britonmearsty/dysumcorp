"use client";

import { ArrowRight, RefreshCw } from "lucide-react";

import { FadeIn } from "./animations";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function HeroSection() {
  const { data: session } = useSession();

  const handleGetStarted = () => {
    if (session?.user) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/auth";
    }
  };

  return (
    <header className="pt-16 pb-12 px-4 sm:px-6 bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto text-center">
        <FadeIn delay={0.1}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-bold tracking-tight mb-6 sm:mb-8 leading-[1.1] serif-font text-[#1c1917]">
            Collect. Organize.
            <br />
            <span className="italic font-normal text-stone-600">Deliver.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-stone-700 leading-relaxed mb-8 sm:mb-12 font-medium px-2 sm:px-0">
            Create secure portals for clients to upload documents directly to
            your cloud storage.{" "}
            <span className="text-[#1c1917] underline decoration-stone-400 underline-offset-4 font-semibold">
              No accounts needed, no friction.
            </span>
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex items-center justify-center mb-12 sm:mb-24">
            <Button
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-base sm:text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 premium-shadow"
              onClick={handleGetStarted}
            >
              Start collecting <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </FadeIn>

        {/* Cloud Storage indicator */}
        <FadeIn delay={0.55}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold tracking-tight text-[#1c1917]">
                Cloud Storage
              </p>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                Auto-sync Enabled
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </header>
  );
}
