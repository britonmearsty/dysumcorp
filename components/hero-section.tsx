"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { FadeIn, Stagger, StaggerItem } from "./animations";

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
    <header className="pt-24 pb-20 px-6 bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto text-center">
        <FadeIn delay={0.1}>
          <h1 className="text-6xl md:text-[5.5rem] font-bold tracking-tight mb-8 leading-[1.1] serif-font text-[#1c1917]">
            Collect. Organize.
            <br />
            <span className="italic font-normal text-stone-600">Deliver.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="max-w-2xl mx-auto text-xl text-stone-700 leading-relaxed mb-12 font-medium">
            Create secure portals for clients to upload documents directly to
            your cloud storage.{" "}
            <span className="text-[#1c1917] underline decoration-stone-400 underline-offset-4 font-semibold">
              No accounts needed, no friction.
            </span>
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
            <Button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-10 py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 premium-shadow"
            >
              Start collecting <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto px-10 py-5 bg-white border border-stone-200 text-stone-900 rounded-xl font-bold text-lg hover:bg-stone-50 transition-colors"
            >
              View live demo
            </Button>
          </div>
        </FadeIn>

        {/* Stats Card */}
        <FadeIn delay={0.55}>
          <div className="max-w-5xl mx-auto glass-surface rounded-3xl p-10 premium-shadow">
            <Stagger
              delay={0.1}
              className="flex flex-wrap items-center justify-between gap-10"
            >
              <StaggerItem>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-stone-500 font-bold uppercase tracking-[0.2em] mb-2">
                    Active portals
                  </span>
                  <span className="text-5xl font-bold serif-font text-[#1c1917]">
                    12
                  </span>
                </div>
              </StaggerItem>
              <StaggerItem direction="none">
                <div className="h-16 w-px bg-stone-200 hidden lg:block"></div>
              </StaggerItem>
              <StaggerItem>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-stone-500 font-bold uppercase tracking-[0.2em] mb-2">
                    Documents received
                  </span>
                  <span className="text-5xl font-bold serif-font text-[#1c1917]">
                    247{" "}
                    <span className="text-xl font-normal text-stone-500">
                      files
                    </span>
                  </span>
                </div>
              </StaggerItem>
              <StaggerItem direction="none">
                <div className="h-16 w-px bg-stone-200 hidden lg:block"></div>
              </StaggerItem>
              <StaggerItem>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center">
                    <RefreshCw className="text-2xl" />
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
              </StaggerItem>
            </Stagger>
          </div>
        </FadeIn>
      </div>
    </header>
  );
}
