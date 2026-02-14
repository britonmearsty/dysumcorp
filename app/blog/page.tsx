"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

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

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 px-4 md:px-8 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
          <Link className="flex items-center gap-2" href="/">
            <span className="font-mono text-xl font-bold">Dysumcorp</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button
              className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
              onClick={() => (window.location.href = "/auth")}
            >
              GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="py-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-mono text-4xl md:text-5xl font-bold mb-4 text-center">
            Blog
          </h1>
          <p className="text-xl text-muted-foreground font-mono text-center mb-12">
            Tips, guides, and best practices for collecting files from clients.
          </p>

          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                className="block p-6 border rounded-lg hover:border-[#334155] transition-colors"
                href={`/blog/${post.slug}`}
              >
                <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono mb-3">
                  <span className="bg-[rgba(51,65,85,0.1)] px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </span>
                  <span>{post.date}</span>
                </div>
                <h2 className="font-mono text-2xl font-bold mb-2">
                  {post.title}
                </h2>
                <p className="text-muted-foreground font-mono">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center text-[#334155] font-mono font-semibold">
                  Read more <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-mono text-sm text-muted-foreground">
            © 2025 Dysumcorp. All rights reserved.
          </span>
          <nav className="flex gap-6">
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="text-sm font-mono text-muted-foreground hover:text-foreground"
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
