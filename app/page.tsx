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
  Palette,
  Quote,
  Send,
  Shield,
  Smartphone,
  Star,
  UserX,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useAnimation, useInView } from "framer-motion";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "FEATURES", href: "#features" },
  { title: "PRICING", href: "#pricing" },
  { title: "SECURITY", href: "#security" },
  { title: "ABOUT", href: "#about" },
];

const labels = [
  { icon: UserX, label: "No Client Accounts Needed" },
  { icon: Shield, label: "Bank-Level Encryption" },
  { icon: Palette, label: "Your Brand, Your Portal" },
];

const features = [
  {
    icon: FolderOpen,
    label: "Custom Branded Client Portals",
    description:
      "Create professional, white-labeled file collection portals with your company logo and brand colors. Impress clients with a seamless, branded experience.",
  },
  {
    icon: Lock,
    label: "Bank-Level Security & Compliance",
    description:
      "Military-grade 256-bit AES encryption, SOC 2 Type II compliance, and automatic file expiration ensure your sensitive client documents stay protected.",
  },
  {
    icon: Zap,
    label: "Zero-Friction File Uploads",
    description:
      "Clients upload documents in seconds with no signup, no passwords, no downloads. Just click, drag, and done—the simplest file sharing experience.",
  },
];

const bentoFeatures = [
  {
    icon: Globe,
    title: "Custom Domain Integration",
    description:
      "Use your own domain for a fully white-labeled client experience. Example: portal.yourcompany.com or yourcompany.com/upload",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    icon: Bell,
    title: "Real-Time Upload Notifications",
    description:
      "Get instant alerts the moment a client uploads documents. Email, Slack, Microsoft Teams, or webhook integrations—your choice.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: FileText,
    title: "Smart Document Request Checklists",
    description:
      "Create detailed checklists of required documents. Clients see exactly what you need and check off items as they upload—reducing back-and-forth.",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    icon: Users,
    title: "Team Collaboration & Permissions",
    description:
      "Invite unlimited team members with role-based access controls. Admins, managers, and viewers—everyone stays in sync securely.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Clock,
    title: "Auto-Expiring Secure Links",
    description:
      "Set custom expiration dates on upload links for enhanced security and urgency. Links automatically deactivate after your specified time.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Smartphone,
    title: "Mobile-Optimized Upload Experience",
    description:
      "Clients can securely upload from any device—iPhone, Android, tablet, or desktop. Fully responsive design with drag-and-drop support.",
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
    title: "Create Your Branded Portal",
    description:
      "Set up a professional, white-labeled file collection portal in under 5 minutes. Add your company logo, customize brand colors, and specify exactly what documents you need from clients.",
  },
  {
    step: "02",
    icon: Send,
    title: "Share Your Secure Link",
    description:
      "Send your unique, secure portal link to clients via email, embed it on your website, or include it in invoices. Works on any device—no app downloads or software installation required.",
  },
  {
    step: "03",
    icon: CheckCircle,
    title: "Receive & Organize Files Instantly",
    description:
      "Clients upload sensitive documents directly to your encrypted portal. Files are automatically organized by client and you receive instant email or Slack notifications when uploads complete.",
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

  const titleWords = ["SECURE", "CLIENT", "FILE", "COLLECTION", "PORTAL"];

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
                className="text-sm font-mono text-foreground hover:text-[#FF6B2C] transition-colors"
                href={item.href}
              >
                {item.title}
              </a>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              aria-label="Get started with free account"
              className="rounded-none hidden md:inline-flex bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
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
                      className="text-sm font-mono text-foreground hover:text-[#FF6B2C] transition-colors"
                      href={item.href}
                    >
                      {item.title}
                    </a>
                  ))}
                  <Button
                    className="cursor-pointer rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
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
          className="py-24 px-4 md:px-8 lg:px-16"
        >
          <div className="flex flex-col items-center text-center">
            <motion.h1
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              className="relative font-mono text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto leading-tight"
              id="hero-heading"
              initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
              transition={{ duration: 0.6 }}
            >
              {titleWords.map((text, index) => (
                <motion.span
                  key={index}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block mx-2 md:mx-4"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.6,
                  }}
                >
                  {text}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-8 max-w-2xl text-xl text-foreground font-mono"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              Professional branded file collection portals for CPAs, lawyers,
              and consultants. Secure client document uploads with bank-level
              encryption—no client account required.
            </motion.p>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-4 max-w-2xl text-lg text-foreground font-mono"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              Seamlessly integrate with Google Drive and Dropbox. Client files
              upload directly to your cloud storage—organized, secure, and
              instant.
            </motion.p>

            <motion.div
              animate={{ opacity: 1 }}
              className="mt-12 flex flex-wrap justify-center gap-6"
              initial={{ opacity: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              {labels.map((feature, index) => (
                <motion.div
                  key={feature.label}
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
                  <feature.icon className="h-5 w-5 text-[#FF6B2C]" />
                  <span className="text-sm font-mono">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
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
                className="cursor-pointer rounded-none mt-12 bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
                size="lg"
                onClick={handleGetStarted}
              >
                GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
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
            Why CPAs, Lawyers & Consultants Choose Our File Collection Portal
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
                <div className="mb-6 rounded-full bg-[#FF6B2C]/10 p-4">
                  <feature.icon className="h-8 w-8 text-[#FF6B2C]" />
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
                How Our Secure File Collection Portal Works
              </h2>
              <p className="text-muted-foreground font-mono text-lg max-w-2xl mx-auto">
                Set up your branded client file portal in minutes. No technical
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
                  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#FF6B2C] via-[#FFB347] via-[#FF6B2C] to-[#FF4500] bg-[length:200%_100%] animate-gradient-x" />
                  <div className="relative flex flex-col items-center text-center p-8 bg-background rounded-xl">
                    <div className="text-6xl font-mono font-bold text-[#FF6B2C]/20 mb-4">
                      {step.step}
                    </div>
                    <div className="mb-6 rounded-full bg-[#FF6B2C]/10 p-4">
                      <step.icon className="h-8 w-8 text-[#FF6B2C]" />
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
                          <ChevronRight className="h-5 w-5 text-[#FF6B2C]" />
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
                          <ChevronRight className="h-5 w-5 text-[#FF6B2C] -ml-3" />
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
                          <ChevronRight className="h-5 w-5 text-[#FF6B2C] -ml-3" />
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
                className="cursor-pointer rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
                size="lg"
                onClick={handleGetStarted}
              >
                START FREE TRIAL <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
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
                  className={`group relative overflow-hidden rounded-lg border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors ${feature.className}`}
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
                    <div className="mb-4 w-fit rounded-lg bg-[#FF6B2C]/10 p-3">
                      <feature.icon className="h-6 w-6 text-[#FF6B2C]" />
                    </div>
                    <h3 className="mb-2 text-lg font-mono font-bold">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
                      ? "border-[#FF6B2C] bg-[#FF6B2C]/5 scale-105 shadow-lg"
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
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6B2C] text-white text-xs font-mono font-bold px-4 py-1 rounded-full">
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
                        <Check className="h-4 w-4 text-[#FF6B2C] flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-none font-mono ${
                      plan.highlighted
                        ? "bg-[#FF6B2C] hover:bg-[#FF6B2C]/90"
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
              <h2 className="text-4xl font-mono font-bold mb-4">
                Trusted by 10,000+ Professionals Worldwide
              </h2>
              <p className="text-muted-foreground font-mono text-lg max-w-2xl mx-auto">
                See why accounting firms, law offices, and consulting agencies
                choose our secure file collection platform.
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
                  <Quote className="absolute top-6 right-6 h-8 w-8 text-[#FF6B2C]/20" />
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[#FF6B2C] text-[#FF6B2C]"
                      />
                    ))}
                  </div>
                  <p className="text-foreground font-mono text-sm leading-relaxed mb-6 flex-1">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B2C]/10 text-[#FF6B2C] font-mono font-bold">
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

        <section className="py-24 px-4 md:px-8 lg:px-16 bg-[#FF6B2C]">
          <div className="max-w-4xl mx-auto text-center">
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
              <h2 className="text-4xl md:text-5xl font-mono font-bold mb-6 text-white">
                Start Collecting Client Files Securely Today
              </h2>
              <p className="text-white/90 font-mono text-lg mb-10 max-w-2xl mx-auto">
                Join 10,000+ CPAs, lawyers, and consultants who have streamlined
                their document collection workflow. Start your free account
                now—no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="rounded-none bg-white text-[#FF6B2C] hover:bg-white/90 font-mono"
                  size="lg"
                  onClick={handleGetStarted}
                >
                  GET STARTED FREE <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
                <Button
                  className="rounded-none border-2 border-white text-white hover:bg-white hover:text-[#FF6B2C] font-mono"
                  size="lg"
                  variant="outline"
                  onClick={handleScheduleDemo}
                >
                  SCHEDULE A DEMO
                </Button>
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
