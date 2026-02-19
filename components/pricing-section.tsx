"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "./animations";

const pricingPlans = [
  {
    name: "Starter",
    price: "19",
    period: "/month",
    features: [
      "5 Active Portals",
      "2GB Storage Space",
      "Basic File Checklists",
      "Google Drive Sync",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "49",
    period: "/month",
    features: [
      "20 Active Portals",
      "50GB Storage Space",
      "White-label Branding",
      "Advanced Automation",
      "Priority Support",
    ],
    cta: "Start Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited Portals",
      "Unlimited Storage",
      "SOC2 & HIPAA Compliance",
      "SSO & SAML Integration",
      "Dedicated Account Manager",
    ],
    cta: "Contact Sales",
    popular: false,
    dark: true,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6 bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-20">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
              Pricing Plans
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
              Transparent investment
            </h2>
            <p className="text-stone-700 mt-6 max-w-xl mx-auto text-lg leading-relaxed">
              Scale your collection process with plans designed for individuals,
              growing teams, and large institutions.
            </p>
          </div>
        </FadeIn>

        <Stagger delay={0.15} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <StaggerItem key={index}>
              <div
                className={`p-12 rounded-[2.5rem] flex flex-col border premium-shadow-hover relative h-full ${
                  plan.dark
                    ? "bg-[#1c1917] text-stone-50 border-transparent"
                    : plan.popular
                      ? "bg-white border-2 border-[#1c1917]"
                      : "bg-white border-stone-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1c1917] text-stone-50 text-[9px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3
                    className={`text-2xl font-bold serif-font mb-2 ${plan.dark ? "text-stone-50" : "text-[#1c1917]"}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${plan.dark ? "text-stone-50" : "text-[#1c1917]"}`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        plan.dark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-5 mb-12 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-3 text-sm font-medium ${
                        plan.dark ? "text-stone-300" : "text-stone-700"
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 ${
                          plan.dark ? "text-stone-50" : "text-[#1c1917]"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                    plan.dark
                      ? "bg-white text-[#1c1917] hover:scale-105"
                      : plan.popular
                        ? "bg-[#1c1917] text-stone-50 hover:bg-stone-800"
                        : "bg-[#1c1917] border border-stone-200 text-stone-50 hover:bg-stone-800"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
