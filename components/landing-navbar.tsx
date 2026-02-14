"use client";

import { ArrowRight, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSession } from "@/lib/auth-client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Features", href: "#features" },
  { title: "Pricing", href: "#pricing" },
  { title: "Security", href: "#security" },
  { title: "Demo", href: "#demo" },
  { title: "About", href: "#about" },
];

export function LandingNavbar() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleGetStarted = () => {
    if (session?.user) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 md:px-8 lg:px-16 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
        <Link className="flex items-center gap-2" href="/">
          <div className="flex items-center space-x-2">
            <Image
              alt="Dysumcorp - Secure Client File Collection Portal"
              height={20}
              src="/logo.svg"
              width={44}
            />
            <span className="text-xl font-semibold">Dysumcorp</span>
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center space-x-8"
        >
          {navigationItems.map((item) => (
            <a
              key={item.title}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              href={item.href}
            >
              {item.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center gap-6 mr-6">
            <a
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              href="tel:1-800-DYSUM"
            >
              1-800-DYSUM
            </a>
            <Button
              className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm px-4 py-2"
              variant="outline"
              onClick={() =>
                window.open("https://demo.dysumcorp.com", "_blank")
              }
            >
              Demo
            </Button>
          </div>
          <Button
            aria-label={
              session?.user
                ? "Go to dashboard"
                : "Get started with free account"
            }
            className="hidden md:inline-flex bg-slate-900 hover:bg-slate-950 text-white shadow-lg shadow-slate-900/20 hover:shadow-xl transition-all duration-200"
            variant="default"
            onClick={handleGetStarted}
          >
            {session?.user ? "Dashboard" : "Start Free Trial"}{" "}
            <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="ghost">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[350px]">
              <nav className="flex flex-col gap-6 mt-6">
                {navigationItems.map((item) => (
                  <a
                    key={item.title}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    href={item.href}
                  >
                    {item.title}
                  </a>
                ))}
                <a
                  className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  href="tel:1-800-DYSUM"
                >
                  1-800-DYSUM
                </a>
                <Button
                  className="cursor-pointer border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  variant="outline"
                  onClick={() =>
                    window.open("https://demo.dysumcorp.com", "_blank")
                  }
                >
                  Watch Demo
                </Button>
                <Button
                  className="cursor-pointer bg-slate-900 hover:bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                  onClick={handleGetStarted}
                >
                  {session?.user ? "Dashboard" : "Start Free Trial"}{" "}
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
