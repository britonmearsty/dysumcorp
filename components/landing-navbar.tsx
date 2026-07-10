"use client";

import { ArrowRight, LayoutDashboard, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useSession } from "@/lib/auth-client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Use Cases", href: "/use-cases" },
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "Blog", href: "/blog" },
  { title: "Security", href: "/security" },
];

export function LandingNavbar() {
  const { data: session, isPending } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <nav className="sticky top-0 z-50 bg-[#fafaf9] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-24 flex items-center justify-between">
        <Link className="flex items-center gap-2 sm:gap-3" href="/">
          <Image
            alt="dysumcorp logo"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            height={40}
            src="/logo.png"
            width={40}
          />
          <span className="serif-font text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
            dysumcorp
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              className="text-[10px] font-bold uppercase tracking-widest text-stone-700 hover:text-[#1c1917] transition-colors"
              href={item.href}
            >
              {item.title}
            </Link>
          ))}

          {isLoggedIn ? (
            <Link
              className="flex items-center gap-2 bg-[#1c1917] text-stone-50 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
              href="/dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          ) : isPending ? (
            // Invisible placeholder — same size as the button — prevents layout shift
            <div className="w-[88px] h-[42px] rounded-full bg-transparent" aria-hidden />
          ) : (
            <Link
              className="bg-[#1c1917] text-stone-50 px-7 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
              href="/auth"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button className="lg:hidden" size="icon" variant="ghost">
              <Menu className="h-5 w-5 text-stone-700" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[350px] bg-[#fafaf9] border-stone-200">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-8">
                <Image
                  alt="dysumcorp logo"
                  className="w-8 h-8 object-contain"
                  height={32}
                  src="/logo.png"
                  width={32}
                />
                <span className="serif-font font-bold text-xl tracking-tight text-[#1c1917]">
                  dysumcorp
                </span>
              </div>
              <nav className="flex flex-col gap-4 flex-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    className="text-base font-medium text-stone-700 hover:text-[#1c1917] transition-colors py-2"
                    href={item.href}
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
              <div className="pt-6 border-t border-stone-200 mt-auto">
                {isLoggedIn ? (
                  <Link
                    className="flex items-center justify-center gap-2 w-full bg-[#1c1917] text-stone-50 py-4 rounded-xl font-bold"
                    href="/dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : isPending ? (
                  <div className="w-full h-[52px] rounded-xl bg-stone-100 animate-pulse" aria-hidden />
                ) : (
                  <Link
                    className="flex items-center justify-center gap-2 w-full bg-[#1c1917] text-stone-50 py-4 rounded-xl font-bold"
                    href="/auth"
                  >
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
