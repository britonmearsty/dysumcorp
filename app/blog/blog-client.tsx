"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

const posts = [
  {
    slug: "collect-files-clients",
    title: "How to Collect Files from Clients Without Email",
    excerpt:
      "Stop chasing clients for files. Learn how to set up a simple file collection system that works without email attachments.",
    date: "2025-02-14",
    readTime: "5 min read",
    category: "Best Practices",
  },
];

import { LandingNavbar } from "@/components/landing-navbar";

export function BlogClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main className="py-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
              Knowledge Base
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold serif-font text-[#1c1917] mb-6">
              Blog
            </h1>
            <p className="text-lg md:text-xl text-stone-700 max-w-2xl mx-auto font-medium leading-relaxed">
              Tips, guides, and best practices for collecting files from clients
              securely and efficiently.
            </p>
          </div>

          <div className="grid gap-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                className="group block p-8 bg-white border border-stone-200 rounded-[2rem] hover:border-[#1c1917] hover:shadow-xl transition-all duration-300"
                href={`/blog/${post.slug}`}
              >
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-stone-500 mb-6">
                  <span className="bg-stone-100 text-[#1c1917] px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </div>
                  <span>{post.date}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#1c1917] serif-font group-hover:text-stone-700 transition-colors">
                  {post.title}
                </h2>
                <p className="text-stone-600 leading-relaxed font-medium mb-8 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center text-[#1c1917] font-bold text-sm uppercase tracking-widest group-hover:gap-2 transition-all">
                  Read article <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-12 px-4 md:px-8 lg:px-16 bg-white/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1c1917] flex items-center justify-center rounded-lg">
              <span className="text-stone-50 font-bold text-sm">D</span>
            </div>
            <span className="serif-font font-bold text-[#1c1917]">
              dysumcorp
            </span>
          </div>
          <span className="text-sm font-medium text-stone-500">
            © 2025 Dysumcorp. All rights reserved.
          </span>
          <nav className="flex gap-8">
            <Link
              className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#1c1917] transition-colors"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#1c1917] transition-colors"
              href="/privacy"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
