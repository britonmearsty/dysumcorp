import testimonials from "@/data/testimonials.json";

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  message: string;
  avatar: string;
  featured: boolean;
};

export function getTestimonials(featuredOnly = false): Testimonial[] {
  if (featuredOnly) {
    return testimonials.filter((t) => t.featured);
  }
  return testimonials;
}
