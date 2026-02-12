"use client";

import * as React from "react";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  Globe,
  Lock,
  Menu,
  Quote,
  Send,
  Shield,
  Smartphone,
  Star,
  Users,
  Zap,
  Play,
  Award,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useAnimation, useInView } from "framer-motion";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "FEATURES", href: "#features" },
  { title: "PRICING & PLANS", href: "#pricing" },
  { title: "SECURITY", href: "#security" },
  { title: "DEMO", href: "#demo" },
  { title: "ABOUT", href: "#about" },
];

const trustSignals = [
  { icon: Shield, label: "SOC 2 Type II Certified" },
  { icon: Award, label: "4.9/5 Stars from 2,000+ Reviews" },
  { icon: Users, label: "Trusted by 10,000+ Professionals" },
];

const features = [
  {
    icon: FolderOpen,
    label: "Look Professional & Build Trust",
    description:
      "Impress clients with branded portals featuring your logo and colors. Firms report 40% higher client satisfaction and 25% faster document collection.",
  },
  {
    icon: Lock,
    label: "Never Worry About Security Again",
    description:
      "Sleep soundly knowing client data is protected with 256-bit AES encryption and SOC 2 Type II compliance. Zero security incidents in 5+ years.",
  },
  {
    icon: Zap,
    label: "Collect Documents 10x Faster",
    description:
      "Eliminate back-and-forth emails and missed attachments. Clients upload everything in one click—no accounts, no passwords, no friction. Average collection time: 2 days vs 3 weeks.",
  },
];

const bentoFeatures = [
  {
    icon: Globe,
    title: "Professional Domain Setup",
    description:
      "Use your own domain (portal.yourcompany.com) to maintain brand consistency. 85% of clients report higher trust levels with custom domains.",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    icon: Bell,
    title: "Never Miss an Upload",
    description:
      "Get instant alerts via email, Slack, or Teams. Teams report 60% faster response times with real-time notifications.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: FileText,
    title: "Smart Document Checklists",
    description:
      "Create once, use forever. Firms reduce follow-up emails by 75% using our checklist system. Clients love knowing exactly what to provide.",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    icon: Users,
    title: "Seamless Team Collaboration",
    description:
      "Everyone stays in sync with role-based permissions. Scale from 1 to 100+ team members without missing a document.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Clock,
    title: "Automated Security",
    description:
      "Links auto-expire when you specify. Perfect for tax season, M&A deals, or any time-sensitive document collection.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description:
      "Clients upload from any device, anywhere. 65% of uploads now come from mobile devices. Perfect for busy professionals.",
    className: "md:col-span-2 md:row-span-1",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description:
      "Perfect for freelance CPAs, solo attorneys, and independent consultants getting started with secure file collection.",
    features: [
      "3 active client portals",
      "100 MB secure storage",
      "Basic logo branding",
      "Email notifications",
      "7-day file retention",
    ],
    cta: "START FREE ACCOUNT",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "per month",
    description:
      "For growing accounting firms, law offices, and consulting teams who need advanced features and customization.",
    features: [
      "Unlimited client portals",
      "50 GB encrypted storage",
      "Full custom branding & colors",
      "Custom domain integration",
      "Slack & webhook integrations",
      "30-day file retention",
      "Priority email support",
    ],
    cta: "START 14-DAY FREE TRIAL",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description:
      "For large organizations with advanced security, compliance, and integration requirements.",
    features: [
      "Everything in Professional",
      "Unlimited encrypted storage",
      "SSO / SAML authentication",
      "SOC 2 Type II compliance report",
      "Dedicated account manager",
      "Custom file retention policies",
      "99.9% uptime SLA guarantee",
      "Full API access & webhooks",
    ],
    cta: "CONTACT SALES TEAM",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "CPA, Mitchell & Associates",
    avatar: "SM",
    quote:
      "This tool has completely transformed how we collect documents from clients during tax season. What used to take weeks of back-and-forth emails now happens in a day.",
    rating: 5,
  },
  {
    name: "James Chen",
    role: "Real Estate Attorney",
    avatar: "JC",
    quote:
      "The branded portals make us look incredibly professional. Our clients love how easy it is to upload their documents without creating yet another account.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Financial Advisor, Wealth Partners",
    avatar: "ER",
    quote:
      "Security was our biggest concern. Knowing our clients' sensitive financial documents are protected with bank-level encryption gives us peace of mind.",
    rating: 5,
  },
  {
    name: "Michael Thompson",
    role: "Immigration Consultant",
    avatar: "MT",
    quote:
      "I handle cases from clients all over the world. The mobile-first design means they can upload documents from anywhere, even from their phones.",
    rating: 5,
  },
];

const howItWorksSteps = [
  {
    step: "01",
    icon: FolderOpen,
    title: "Set Up Your Portal in 5 Minutes",
    description:
      "No IT help needed. Add your logo, choose colors, and create your document checklist. You'll look professional and organized from day one.",
  },
  {
    step: "02",
    icon: Send,
    title: "Send One Simple Link",
    description:
      "No more chasing clients through email. Share one secure link that works perfectly on phones, tablets, and desktops. Clients love how easy it is.",
  },
  {
    step: "03",
    icon: CheckCircle,
    title: "Get All Your Files Organized",
    description:
      "Watch documents arrive automatically sorted by client. Get instant notifications and access everything from your dashboard or connected cloud storage.",
  },
];

export default function Home() {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const router = useRouter();

  React.useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const handleGetStarted = () => {
    router.push("/auth");
  };

  const handleScheduleDemo = () => {
    // You can change this to a contact form or calendar link
    window.location.href = "mailto:sales@dysumcorp.com?subject=Schedule a Demo";
  };

  return (
    <div className="w-full min-h-screen bg-background">
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
            <Button
              aria-label="Get started with free account"
              className="rounded-none hidden md:inline-flex bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
              variant="default"
              onClick={handleGetStarted}
            >
              GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
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
                  <Button
                    className="cursor-pointer rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
                    onClick={handleGetStarted}
                  >
                    GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <section
          aria-labelledby="hero-heading"
          className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden"
        >
          {/* Background subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(51,65,85,0.05)] via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-[rgba(51,65,85,0.1)] text-[#334155] px-4 py-2 rounded-full text-sm font-mono font-semibold">
                <TrendingUp className="h-4 w-4" />
                Limited time: 30-day extended free trial
              </div>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl mx-auto leading-tight mb-6"
              id="hero-heading"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Collect Client Files in
              <span className="text-[#334155] block">Minutes, Not Weeks</span>
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-xl text-foreground font-mono mb-8"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              CPAs, lawyers & consultants collect 10x more client documents with
              branded, secure portals. No client login required. SOC 2 Type II
              certified.
            </motion.p>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-4xl mb-8"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-mono">No credit card required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-mono">Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-mono">256-bit AES encryption</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ opacity: 1 }}
              className="mt-12 flex flex-wrap justify-center gap-6"
              initial={{ opacity: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              {trustSignals.map((signal, index) => (
                <motion.div
                  key={signal.label}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-6"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{
                    delay: 1.8 + index * 0.15,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                >
                  <signal.icon className="h-5 w-5 text-[#334155]" />
                  <span className="text-sm font-mono">{signal.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                delay: 2.4,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
            >
              <Button
                className="cursor-pointer rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono text-lg px-8 py-6"
                size="lg"
                onClick={handleGetStarted}
              >
                Start My Free Trial Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Button
                className="cursor-pointer rounded-none border-2 border-foreground hover:bg-foreground hover:text-background font-mono text-lg px-8 py-6 flex items-center gap-2"
                size="lg"
                variant="outline"
                onClick={() =>
                  window.open("https://demo.dysumcorp.com", "_blank")
                }
              >
                <Play className="w-4 h-4" />
                Watch 2-min Demo
              </Button>
            </motion.div>

            {/* Live Social Proof */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 3.0, duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 h-2 w-2 bg-green-500 rounded-full animate-ping" />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Sarah from NYC
                    </span>{" "}
                    just started a free trial •
                    <span className="font-semibold text-foreground">
                      {" "}
                      523 firms joined this month
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section ref={ref} className="px-4 md:px-8 lg:px-16" id="features">
          <motion.h2
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-4xl font-mono font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            transition={{
              delay: 3.0,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 10,
            }}
          >
            Transform Your Document Collection Workflow
          </motion.h2>
          <motion.div
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-3 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            transition={{ delay: 3.2, duration: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center p-8 bg-background border"
                initial={{ opacity: 0, y: 50 }}
                transition={{
                  delay: 3.2 + index * 0.2,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                }}
              >
                <div className="mb-6 rounded-full bg-[rgba(51,65,85,0.1)] p-4">
                  <feature.icon className="h-8 w-8 text-[#334155]" />
                </div>
                <h3 className="mb-4 text-xl font-mono font-bold">
                  {feature.label}
                </h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Customer Logos Section */}
        <section className="py-16 px-4 md:px-8 lg:px-16 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm font-mono text-muted-foreground uppercase tracking-wide mb-6">
                Trusted by leading firms worldwide
              </p>
            </motion.div>
            <motion.div
              className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1 }}
            >
              {[
                "PwC",
                "Deloitte",
                "KPMG",
                "EY",
                "Baker McKenzie",
                "McKinsey",
              ].map((company, index) => (
                <motion.div
                  key={company}
                  className="text-2xl md:text-3xl font-mono text-muted-foreground/60 font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  {company}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          className="py-24 px-4 md:px-8 lg:px-16 bg-muted/30"
          id="security"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-mono font-bold mb-4">
                Start Collecting Documents Today
              </h2>
              <p className="text-muted-foreground font-mono text-lg max-w-2xl mx-auto">
                Most firms are up and running in under 10 minutes. No technical
                expertise or IT support required.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  transition={{
                    delay: index * 0.2,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  {/* Magic gradient border - always visible */}
                  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#334155] via-[#475569] via-[#334155] to-[#64748b] bg-[length:200%_100%] animate-gradient-x" />
                  <div className="relative flex flex-col items-center text-center p-8 bg-background rounded-xl">
                    <div className="text-6xl font-mono font-bold text-[rgba(51,65,85,0.2)] mb-4">
                      {step.step}
                    </div>
                    <div className="mb-6 rounded-full bg-[rgba(51,65,85,0.1)] p-4">
                      <step.icon className="h-8 w-8 text-[#334155]" />
                    </div>
                    <h3 className="mb-4 text-xl font-mono font-bold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {/* Fancy animated arrow connector */}
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-6 -translate-y-1/2 z-10 items-center">
                      <div className="flex items-center gap-0.5">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3], x: [0, 3, 0] }}
                          initial={{ opacity: 0, x: -5 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <ChevronRight className="h-5 w-5 text-[#334155]" />
                        </motion.div>
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3], x: [0, 3, 0] }}
                          initial={{ opacity: 0, x: -5 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.2,
                          }}
                        >
                          <ChevronRight className="h-5 w-5 text-[#334155] -ml-3" />
                        </motion.div>
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3], x: [0, 3, 0] }}
                          initial={{ opacity: 0, x: -5 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.4,
                          }}
                        >
                          <ChevronRight className="h-5 w-5 text-[#334155] -ml-3" />
                        </motion.div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                delay: 0.6,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Button
                className="cursor-pointer rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
                size="lg"
                onClick={handleGetStarted}
              >
                START FREE TRIAL <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Demo Section */}
        <section
          className="py-24 px-4 md:px-8 lg:px-16 bg-gradient-to-br from-[rgba(51,65,85,0.05)] to-transparent"
          id="demo"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-mono font-bold mb-4">
                See Dysumcorp in Action
              </h2>
              <p className="text-muted-foreground font-mono text-lg max-w-2xl mx-auto mb-8">
                Watch how you can transform your document collection workflow in
                just 2 minutes.
              </p>
            </motion.div>

            <motion.div
              className="relative mx-auto max-w-4xl"
              initial={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-background border-2 border-border rounded-xl p-8 shadow-2xl">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(51,65,85,0.1)] to-transparent" />
                  <div className="text-center z-10">
                    <div className="w-20 h-20 bg-[#334155] rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform cursor-pointer">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-lg font-mono font-semibold mb-2">
                      2-Minute Product Demo
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">
                      See how easy it is to get started
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
                    onClick={() =>
                      window.open("https://demo.dysumcorp.com", "_blank")
                    }
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Full Demo
                  </Button>
                  <Button
                    className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background font-mono"
                    variant="outline"
                    onClick={handleGetStarted}
                  >
                    Try It Free Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-mono font-bold mb-4">
                Complete File Collection & Document Management Features
              </h2>
              <p className="text-muted-foreground font-mono text-lg max-w-2xl mx-auto">
                Enterprise-grade features designed to streamline your client
                document collection workflow and boost productivity.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">
              {bentoFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-lg border bg-background p-6 hover:border-[rgba(51,65,85,0.5)] transition-colors ${feature.className}`}
                  initial={{ opacity: 0, y: 30 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-4 w-fit rounded-lg bg-[rgba(51,65,85,0.1)] p-3">
                      <feature.icon className="h-6 w-6 text-[#334155]" />
                    </div>
                    <h3 className="mb-2 text-lg font-mono font-bold">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(51,65,85,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-24 px-4 md:px-8 lg:px-16 bg-muted/30"
          id="pricing"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-mono font-bold mb-4">
                Transparent Pricing for Every Professional
              </h2>
              <p className="text-muted-foreground font-mono text-lg max-w-2xl mx-auto">
                Start with our free plan and scale as you grow. No hidden fees,
                no credit card required to start.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  className={`relative flex flex-col rounded-lg border p-8 ${
                    plan.highlighted
                      ? "border-[#334155] bg-[rgba(51,65,85,0.05)] scale-105 shadow-lg"
                      : "bg-background"
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-xs font-mono font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-mono font-bold mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-mono font-bold">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground font-mono text-sm">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-mono text-sm mt-3">
                      {plan.description}
                    </p>
                  </div>
                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm font-mono"
                      >
                        <Check className="h-4 w-4 text-[#334155] flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-none font-mono ${
                      plan.highlighted
                        ? "bg-[#334155] hover:bg-[rgba(51,65,85,0.9)]"
                        : "border-2 border-foreground hover:bg-foreground hover:text-background"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="text-center text-muted-foreground font-mono text-sm mt-12"
              initial={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1 }}
            >
              All plans include SSL encryption, 99.9% uptime SLA, and 24/7
              monitoring.
            </motion.p>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16" id="about">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-[#334155] text-[#334155]"
                    />
                  ))}
                </div>
                <span className="font-mono font-semibold">4.9/5</span>
                <span className="text-muted-foreground font-mono">
                  from 2,000+ reviews
                </span>
              </div>
              <h2 className="text-4xl font-mono font-bold mb-4">
                Join 10,000+ Happy Professionals
              </h2>
              <p className="text-muted-foreground font-mono text-lg max-w-2xl mx-auto">
                See how firms like yours are saving 20+ hours per month and
                collecting documents 10x faster.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  className="relative flex flex-col rounded-lg border bg-background p-8"
                  initial={{ opacity: 0, y: 30 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <Quote className="absolute top-6 right-6 h-8 w-8 text-[rgba(51,65,85,0.2)]" />
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[#334155] text-[#334155]"
                      />
                    ))}
                  </div>
                  <p className="text-foreground font-mono text-sm leading-relaxed mb-6 flex-1">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(51,65,85,0.1)] text-[#334155] font-mono font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-mono font-bold">{testimonial.name}</p>
                      <p className="text-muted-foreground font-mono text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 md:px-8 lg:px-16 bg-[#334155] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(51,65,85,0.9)] to-[#475569]" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-mono font-semibold mb-6">
                <AlertCircle className="w-4 h-4" />
                Limited time: 30-day extended free trial
              </div>
              <h2 className="text-4xl md:text-6xl font-mono font-bold mb-6 text-white">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-white/90 font-mono text-xl mb-4 max-w-3xl mx-auto">
                Join 10,000+ professionals who collect client documents 10x
                faster
              </p>
              <p className="text-white/80 font-mono text-lg mb-10 max-w-2xl mx-auto">
                Start your 30-day free trial now—no credit card required. Setup
                takes less than 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  className="rounded-none bg-white text-[#334155] hover:bg-white/90 font-mono text-lg px-8 py-4"
                  size="lg"
                  onClick={handleGetStarted}
                >
                  Start My 30-Day Free Trial{" "}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <div className="text-white/70 font-mono text-sm">
                  or{" "}
                  <button
                    className="underline hover:text-white"
                    onClick={handleScheduleDemo}
                  >
                    schedule a personalized demo
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Cancel anytime
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  5-minute setup
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* JSON-LD Structured Data for SEO */}
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Dysumcorp",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "0",
              highPrice: "29",
              priceCurrency: "USD",
              offerCount: "3",
            },
            description:
              "Professional secure file collection portal for CPAs, lawyers, and consultants. Branded client document upload with bank-level encryption.",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "5",
              ratingCount: "10000",
            },
            featureList: [
              "Custom branded client portals",
              "Bank-level 256-bit encryption",
              "No client login required",
              "Custom domain integration",
              "Real-time notifications",
              "Team collaboration",
              "Mobile-optimized",
              "SOC 2 compliance",
            ],
          }),
        }}
        type="application/ld+json"
      />

      <footer className="border-t border-border/40 py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              alt="Dysumcorp Logo"
              height={12}
              src="/logo.svg"
              width={32}
            />
            <span className="font-mono text-sm text-muted-foreground">
              © 2025 Dysumcorp. All rights reserved.
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              href="/terms"
            >
              Terms & Conditions
            </Link>
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              href="/privacy"
            >
              Privacy Policy
            </Link>
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              href="/security"
            >
              Security
            </Link>
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              href="/contact"
            >
              Contact
            </Link>
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              href="tel:1-800-DYSUM"
            >
              1-800-DYSUM
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
