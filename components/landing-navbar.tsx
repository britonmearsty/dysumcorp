"use client";

import { ArrowRight, Menu } from "lucide-react";
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
  const { data: session } = useSession();

  const handleSignUp = () => {
    if (session?.user) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/auth";
    }
  };

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
          <Button
            className="bg-[#1c1917] text-stone-50 px-7 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
            onClick={handleSignUp}
          >
            Sign up
          </Button>
        </div>

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
                  src="/logo.png"
                  alt="dysumcorp logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
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
                <Button
                  className="w-full bg-[#1c1917] text-stone-50 py-6"
                  onClick={handleSignUp}
                >
                  Sign up
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
