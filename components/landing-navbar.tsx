"use client";

import { ArrowRight, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSession } from "@/lib/auth-client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "FEATURESs", href: "#features" },
  { title: "PRICING & PLANS", href: "#pricing" },
  { title: "SECURITY", href: "#security" },
  { title: "DEMO", href: "#demo" },
  { title: "ABOUT", href: "#about" },
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
    <header className="sticky top-0 z-50 px-4 md:px-8 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
        <Link className="flex items-center gap-2" href="/">
          <div className="flex items-center space-x-2">
            <Image
              alt="Dysumcorp - Secure Client File Collection Portal"
              height={16}
              src="/logo.svg"
              width={40}
            />
            <span className="font-mono text-xl font-bold">Dysumcorp</span>
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center space-x-8"
        >
          {navigationItems.map((item) => (
            <a
              key={item.title}
              className="text-sm font-mono text-foreground hover:text-[#334155] transition-colors"
              href={item.href}
            >
              {item.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center gap-6 mr-6">
            <a
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              href="tel:1-800-DYSUM"
            >
              1-800-DYSUM
            </a>
            <Button
              className="rounded-none border border-foreground hover:bg-foreground hover:text-background font-mono text-sm px-4 py-2"
              variant="outline"
              onClick={() =>
                window.open("https://demo.dysumcorp.com", "_blank")
              }
            >
              DEMO
            </Button>
          </div>
          <Button
            aria-label={
              session?.user
                ? "Go to dashboard"
                : "Get started with free account"
            }
            className="rounded-none hidden md:inline-flex bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
            variant="default"
            onClick={handleGetStarted}
          >
            {session?.user ? "DASHBOARD" : "START FREE TRIAL"}{" "}
            <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="ghost">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-6 mt-6">
                {navigationItems.map((item) => (
                  <a
                    key={item.title}
                    className="text-sm font-mono text-foreground hover:text-[#334155] transition-colors"
                    href={item.href}
                  >
                    {item.title}
                  </a>
                ))}
                <a
                  className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                  href="tel:1-800-DYSUM"
                >
                  1-800-DYSUM
                </a>
                <Button
                  className="cursor-pointer rounded-none border border-foreground hover:bg-foreground hover:text-background font-mono"
                  variant="outline"
                  onClick={() =>
                    window.open("https://demo.dysumcorp.com", "_blank")
                  }
                >
                  WATCH DEMO
                </Button>
                <Button
                  className="cursor-pointer rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
                  onClick={handleGetStarted}
                >
                  {session?.user ? "DASHBOARD" : "START FREE TRIAL"}{" "}
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
