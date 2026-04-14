"use client";

import Link from "next/link";
import { ArrowRight, Clock, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing-navbar";

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <LandingNavbar />

      <main className="py-20 px-4 md:px-8 lg:px-16">
        <article className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 text-sm text-stone-600 mb-6">
            <span className="bg-stone-200 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">
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

          <div className="mb-8">
            <Link
              className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1"
              href="/blog"
            >
              ← Back to Blog
            </Link>
          </div>

          <h1 className="serif-font text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-stone-900">
            How to Collect Files from Clients Without Email
          </h1>

          <p className="text-lg text-stone-600 mb-8">
            Stop the endless back-and-forth emails chasing client files. Here's
            how to set up a simple system that makes file collection effortless.
          </p>

          <div className="prose prose-lg prose-stone max-w-none text-stone-800">
            <h2 className="serif-font">
              The Problem with Email File Collection
            </h2>
            <p>
              If you're like most professionals, you've probably experienced the
              frustration of chasing clients for files via email. "Did you send
              the contract?" "I can't find the attachment." "The file is too
              large for email."
            </p>
            <p>
              Email wasn't designed for file transfer. It's clunky, unreliable,
              and creates unnecessary friction in your client relationships.
              Plus, file size limits on providers like{" "}
              <a
                className="text-stone-700 underline"
                href="https://support.google.com/mail/answer/6584?hl=en"
                rel="noopener noreferrer"
                target="_blank"
              >
                Gmail
              </a>{" "}
              can prevent your clients from sending large documents altogether.
            </p>

            <h2 className="serif-font">
              The Solution: Dedicated File Collection Links
            </h2>
            <p>
              Instead of asking clients to attach files to emails, send them a
              simple upload link. They click, upload their files, and you're
              done. No account creation, no login, no hassle.
            </p>

            <h3 className="serif-font">Here's how it works:</h3>
            <ol>
              <li>Create a branded upload portal with your logo and colors</li>
              <li>Share your unique upload link with your client</li>
              <li>Client clicks the link and uploads their files</li>
              <li>
                Files automatically land in your{" "}
                <a
                  className="text-stone-700 underline"
                  href="https://www.google.com/drive/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Google Drive
                </a>{" "}
                or{" "}
                <a
                  className="text-stone-700 underline"
                  href="https://www.dropbox.com/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Dropbox
                </a>
              </li>
            </ol>

            <h2 className="serif-font">Benefits for Your Practice</h2>
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
                protects sensitive data. Learn more about{" "}
                <a
                  className="text-stone-700 underline"
                  href="https://en.wikipedia.org/wiki/Transport_Layer_Security"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  TLS security
                </a>{" "}
                and how it keeps your data safe.
              </li>
            </ul>

            <h2 className="serif-font">Get Started Today</h2>
            <p>
              Setting up file collection without email is easier than you think.
              Tools like Dysumcorp let you create upload links in minutes that
              work on any device. Check out our{" "}
              <Link className="text-stone-700 underline" href="/pricing">
                pricing plans
              </Link>{" "}
              to find the right fit for your business.
            </p>
          </div>

          <div className="mt-12 p-8 bg-stone-100 rounded-lg">
            <h3 className="serif-font font-bold text-xl mb-2 text-stone-900">
              Ready to simplify your file collection?
            </h3>
            <p className="text-stone-600 mb-4">
              Start your free account and create your first upload link in
              minutes.
            </p>
            <Button
              className="bg-[#1c1917] text-stone-50 px-7 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800"
              onClick={() => (window.location.href = "/auth")}
            >
              Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </article>
      </main>

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
