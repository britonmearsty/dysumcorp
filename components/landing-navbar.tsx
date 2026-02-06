"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/lib/auth-client";
import { ArrowRight, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const navigationItems = [
  { title: "FEATURES", href: "#features" },
  { title: "PRICING", href: "#pricing" },
  { title: "SECURITY", href: "#security" },
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
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.svg"
              alt="Dysumcorp - Secure Client File Collection Portal"
              width={40}
              height={16}
            />
            <span className="font-mono text-xl font-bold">Dysumcorp</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="text-sm font-mono text-foreground hover:text-[#FF6B2C] transition-colors"
            >
              {item.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            onClick={handleGetStarted}
            variant="default"
            className="rounded-none hidden md:inline-flex bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
            aria-label={session?.user ? "Go to dashboard" : "Get started with free account"}
          >
            {session?.user ? "DASHBOARD" : "GET STARTED"} <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-6 mt-6">
                {navigationItems.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="text-sm font-mono text-foreground hover:text-[#FF6B2C] transition-colors"
                  >
                    {item.title}
                  </a>
                ))}
                <Button 
                  onClick={handleGetStarted}
                  className="cursor-pointer rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
                >
                  {session?.user ? "DASHBOARD" : "GET STARTED"} <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
