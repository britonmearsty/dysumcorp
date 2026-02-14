"use client";

import Link from "next/link";
import { ArrowRight, Clock, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BlogPostPage() {
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
        <article className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono mb-6">
            <span className="bg-[rgba(51,65,85,0.1)] px-2 py-1 rounded">
              Best Practices
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />5 min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              February 14, 2025
            </span>
          </div>

          <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            How to Collect Files from Clients Without Email
          </h1>

          <p className="text-lg text-muted-foreground font-mono mb-8">
            Stop the endless back-and-forth emails chasing client files. Here's
            how to set up a simple system that makes file collection effortless.
          </p>

          <div className="prose prose-lg max-w-none">
            <h2>The Problem with Email File Collection</h2>
            <p>
              If you're like most professionals, you've probably experienced the
              frustration of chasing clients for files via email. "Did you send
              the contract?" "I can't find the attachment." "The file is too
              large for email."
            </p>
            <p>
              Email wasn't designed for file transfer. It's clunky, unreliable,
              and creates unnecessary friction in your client relationships.
            </p>

            <h2>The Solution: Dedicated File Collection Links</h2>
            <p>
              Instead of asking clients to attach files to emails, send them a
              simple upload link. They click, upload their files, and you're
              done. No account creation, no login, no hassle.
            </p>

            <h3>Here's how it works:</h3>
            <ol>
              <li>Create a branded upload portal with your logo and colors</li>
              <li>Share your unique upload link with your client</li>
              <li>Client clicks the link and uploads their files</li>
              <li>Files automatically land in your Google Drive or Dropbox</li>
            </ol>

            <h2>Benefits for Your Practice</h2>
            <ul>
              <li>
                <strong>No more chasing:</strong> Clients can upload files
                anytime, anywhere
              </li>
              <li>
                <strong>Professional image:</strong> Branded portals impress
                clients
              </li>
              <li>
                <strong>Automatic organization:</strong> Files are sorted by
                client automatically
              </li>
              <li>
                <strong>Better security:</strong> Encrypted file transfer
                protects sensitive data
              </li>
            </ul>

            <h2>Get Started Today</h2>
            <p>
              Setting up file collection without email is easier than you think.
              Tools like Dysumcorp let you create upload links in minutes that
              work on any device.
            </p>
          </div>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-mono font-bold text-lg mb-2">
              Ready to simplify your file collection?
            </h3>
            <p className="text-muted-foreground font-mono mb-4">
              Start your free account and create your first upload link in
              minutes.
            </p>
            <Button
              className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
              onClick={() => (window.location.href = "/auth")}
            >
              Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </article>
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

      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "How to Collect Files from Clients Without Email",
            datePublished: "2025-02-14",
            dateModified: "2025-02-14",
            author: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            publisher: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            description:
              "Stop chasing clients for files. Learn how to set up a simple file collection system that works without email attachments.",
          }),
        }}
        type="application/ld+json"
      />
    </div>
  );
}
