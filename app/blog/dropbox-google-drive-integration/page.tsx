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
              Integrations
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />5 min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              February 3, 2025
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
            Dropbox vs Google Drive: Which One for Your Business?
          </h1>

          <p className="text-lg text-stone-600 mb-8">
            Compare the top cloud storage integrations to find the perfect fit
            for your file collection workflow.
          </p>

          <div className="prose prose-lg prose-stone max-w-none text-stone-800">
            <h2 className="serif-font">The Cloud Storage Dilemma</h2>
            <p>
              When setting up your file collection system, one of the most
              important decisions is where your files will live. Both Dropbox
              and Google Drive are popular choices, but they serve different
              needs. Let&apos;s break down the key differences.
            </p>

            <h2 className="serif-font">
              Dropbox: The Collaboration Powerhouse
            </h2>
            <p>
              Dropbox has long been known for its file synchronization
              capabilities and seamless cross-platform experience.
            </p>
            <ul>
              <li>
                <strong>Best for:</strong> Teams that need real-time
                collaboration on documents
              </li>
              <li>
                <strong>Strengths:</strong> Excellent file sync, Paper document
                collaboration, Smart Sync feature
              </li>
              <li>
                <strong>Storage:</strong> Starts at 2GB free, paid plans from
                $11.99/month
              </li>
            </ul>

            <h2 className="serif-font">Google Drive: The Ecosystem Champion</h2>
            <p>
              Google Drive integrates deeply with Google Workspace, making it a
              natural choice for businesses already using Gmail and Google Docs.
            </p>
            <ul>
              <li>
                <strong>Best for:</strong> Businesses heavily invested in Google
                ecosystem
              </li>
              <li>
                <strong>Strengths:</strong> Native Docs/Sheets/Slides, powerful
                search, generous free storage
              </li>
              <li>
                <strong>Storage:</strong> Starts at 15GB free (shared with
                Gmail), paid plans from $2.99/month
              </li>
            </ul>

            <h2 className="serif-font">Making the Right Choice</h2>
            <p>Consider these factors when choosing:</p>

            <h3 className="serif-font">1. Existing Infrastructure</h3>
            <p>
              If your team already uses Google Workspace, Google Drive offers
              tighter integration. If you use Microsoft 365, Dropbox might be a
              better fit.
            </p>

            <h3 className="serif-font">2. Collaboration Needs</h3>
            <p>
              For real-time document collaboration, Google Drive&apos;s native
              editing capabilities are unmatched. For simple file storage and
              sharing, both work well.
            </p>

            <h3 className="serif-font">3. Budget</h3>
            <p>
              Google Drive offers more generous free storage, making it
              attractive for smaller businesses. Dropbox offers more advanced
              features at a higher price point.
            </p>

            <h2 className="serif-font">The Good News</h2>
            <p>
              The best part? You don&apos;t have to choose just one. Many
              businesses use both for different purposes. The key is ensuring
              your file collection system integrates seamlessly with your chosen
              storage solution. Check out our{" "}
              <Link className="text-stone-700 underline" href="/pricing">
                pricing plans
              </Link>{" "}
              to see how we integrate with both.
            </p>
          </div>

          <div className="mt-12 p-8 bg-stone-100 rounded-lg">
            <h3 className="serif-font font-bold text-xl mb-2 text-stone-900">
              Ready to streamline your file collection?
            </h3>
            <p className="text-stone-600 mb-4">
              Start your free account and connect your cloud storage today.
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
            headline: "Dropbox vs Google Drive: Which One for Your Business?",
            datePublished: "2025-02-03",
            dateModified: "2025-02-03",
            author: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            publisher: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            description:
              "Compare the top cloud storage integrations to find the perfect fit for your file collection workflow.",
          }),
        }}
        type="application/ld+json"
      />
    </div>
  );
}
