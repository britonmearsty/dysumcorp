import Image from "next/image";

import { Quote } from "lucide-react";

import { FadeIn } from "./animations";

const testimonial = {
  quote:
    "The security of bank-level encryption gives our clients peace of mind while removing all friction from our collection process.",
  name: "Emily Rodriguez",
  role: "Principal, Rodriguez Wealth Partners",
  image:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
};

export default function TestimonialsSection() {
  return (
    <section className="py-32 bg-stone-100">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <FadeIn delay={0.1}>
          <Quote className="text-7xl text-stone-300 mb-10 mx-auto" />
        </FadeIn>
        <FadeIn delay={0.2}>
          <h2 className="text-3xl md:text-5xl font-bold mb-10 serif-font leading-tight text-[#1c1917]">
            &quot;{testimonial.quote}&quot;
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
              <Image
                alt={testimonial.name}
                className="object-cover grayscale"
                fill
                src={testimonial.image}
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-[#1c1917] tracking-tight">
                {testimonial.name}
              </p>
              <p className="text-sm text-stone-600 font-medium uppercase tracking-widest mt-1">
                {testimonial.role}
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
