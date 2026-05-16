"use client";

import { Quote } from "lucide-react";

import { FadeIn, Stagger, StaggerItem } from "./animations";

import type { Testimonial } from "@/lib/getTestimonials";

function AvatarFallback({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-12 h-12 rounded-full bg-[#1c1917] text-stone-50 flex items-center justify-center text-sm font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-[#fafaf9]">
      <div className="max-w-6xl mx-auto">
        <FadeIn delay={0.1}>
          <div className="text-center mb-16">
            <span className="inline-block mb-4 px-5 py-2 bg-stone-100 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600 border border-stone-200">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold serif-font text-[#1c1917]">
              Trusted by early users
            </h2>
          </div>
        </FadeIn>

        <Stagger>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <StaggerItem key={t.id}>
                <div className="p-8 rounded-2xl border border-stone-200 bg-white shadow-sm h-full flex flex-col">
                  <Quote className="w-8 h-8 text-stone-300 mb-4 shrink-0" />
                  <p className="text-stone-700 leading-relaxed mb-8 flex-1">
                    &ldquo;{t.message}&rdquo;
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-stone-100">
                    <AvatarFallback name={t.name} />
                    <div>
                      <p className="font-bold text-[#1c1917] text-sm">
                        {t.name}
                      </p>
                      <p className="text-xs text-stone-500 font-medium">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      </div>
    </section>
  );
}
