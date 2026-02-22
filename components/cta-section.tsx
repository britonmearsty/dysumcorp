"use client";

import Link from "next/link";
import { Box } from "lucide-react";

import { FadeIn } from "./animations";

import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <>
      {/* Final CTA Section */}
      <section className="py-32 px-6">
        <FadeIn delay={0.1}>
          <div className="max-w-6xl mx-auto bg-[#1c1917] rounded-[4rem] p-16 md:p-24 text-center text-stone-50 relative overflow-hidden">
            <div className="relative z-10">
              <span className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10">
                Secure Document Exchange
              </span>
              <h2 className="text-5xl md:text-7xl font-bold mb-10 serif-font">
                Ready to transform your file collection?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <Button
                  className="w-full sm:w-auto px-12 py-6 bg-stone-50 text-[#1c1917] rounded-xl font-bold text-xl hover:scale-105 transition-transform premium-shadow"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Create portal free
                </Button>
                <Link
                  className="w-full sm:w-auto px-12 py-6 bg-white/5 backdrop-blur border border-white/20 rounded-xl font-bold text-xl hover:bg-white/10 transition-colors text-stone-100"
                  href="/pricing"
                >
                  View pricing
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/[0.03] rounded-full blur-[100px] -mr-64 -mt-64" />
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto border-t border-stone-200 pt-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1c1917] rounded flex items-center justify-center">
                  <Box className="text-stone-50 text-sm" />
                </div>
                <span className="serif-font font-bold text-xl tracking-tight text-[#1c1917]">
                  dysumcorp
                </span>
              </div>
              <p className="text-sm text-stone-600 max-w-xs leading-relaxed">
                The enterprise-standard for secure client document collection
                and cloud synchronization.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 sm:gap-16">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1c1917]">
                  Product
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/features"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/pricing"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/blog"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/security"
                    >
                      Security
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1c1917]">
                  Use Cases
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/use-cases/accountants"
                    >
                      Accountants
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/use-cases/lawyers"
                    >
                      Lawyers
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/use-cases/freelancers"
                    >
                      Freelancers
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/use-cases/marketing-agencies"
                    >
                      Agencies
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1c1917]">
                  Integrations
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/integrations/google-drive"
                    >
                      Google Drive
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/integrations/dropbox"
                    >
                      Dropbox
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1c1917]">
                  Legal
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/features"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/pricing"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/blog"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-sm text-stone-600 hover:text-[#1c1917] transition-colors"
                      href="/security"
                    >
                      Security
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-stone-500 font-medium">
              © 2024 Dysumcorp Inc. Crafted for excellence.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                System Status: Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
