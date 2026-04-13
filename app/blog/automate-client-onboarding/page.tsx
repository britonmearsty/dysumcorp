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
              Automation
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />6 min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              February 7, 2025
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
            How to Automate Your Client Onboarding Workflow
          </h1>

          <p className="text-lg text-stone-600 mb-8">
            Save hours every week by automating the document and file collection
            process for new clients.
          </p>

          <div className="prose prose-lg prose-stone max-w-none text-stone-800">
            <h2 className="serif-font">The Onboarding Bottleneck</h2>
            <p>
              Client onboarding is often the most time-consuming part of your
              workflow. Chasing down documents, sending reminders, and manually
              organizing files can consume hours that could be spent on
              high-value work. But it doesn&apos;t have to be this way.
            </p>
            <p>
              Automation transforms the entire onboarding experience&mdash;for
              both you and your clients. Let&apos;s dive into how you can
              streamline this process.
            </p>

            <h2 className="serif-font">The Manual Process Problem</h2>
            <p>
              Traditional onboarding typically looks like this: send an email
              requesting documents, wait (sometimes for days), send a follow-up
              email, download attachments, rename files, organize into folders,
              and then finally begin the actual work. This manual approach is
              error-prone and frustrating for everyone involved.
            </p>

            <h2 className="serif-font">How Automation Changes Everything</h2>

            <h3 className="serif-font">1. Automated Request Links</h3>
            <p>
              Instead of composing individual emails, create reusable upload
              links that you can send to new clients instantly. These links can
              be customized with your branding and specify exactly what
              documents you need.
            </p>

            <h3 className="serif-font">2. Smart File Organization</h3>
            <p>
              When files are uploaded, they can be automatically organized into
              the correct client folders in your cloud storage. No more manual
              sorting or renaming&mdash;it happens instantly.
            </p>

            <h3 className="serif-font">3. Automated Reminders</h3>
            <p>
              If a client hasn&apos;t uploaded their documents, set up automatic
              reminder emails that go out at specified intervals. This removes
              the awkwardness of &quot;chasing&quot; clients while ensuring you
              get what you need.
            </p>

            <h3 className="serif-font">4. Instant Notifications</h3>
            <p>
              Get notified the moment a client uploads their files. No more
              checking email constantly&mdash;you&apos;ll know exactly when
              it&apos;s time to start working.
            </p>

            <h2 className="serif-font">Real World Impact</h2>
            <p>
              Consider this: if you onboard 10 new clients per week and spend
              just 30 minutes per client on document collection, that&apos;s 5
              hours weekly. Automation can reduce this to minutes, freeing up
              significant time for revenue-generating activities.
            </p>

            <h2 className="serif-font">Get Started Today</h2>
            <p>
              Ready to reclaim your time? Setting up automated client onboarding
              is easier than you think. Check out our{" "}
              <Link className="text-stone-700 underline" href="/pricing">
                pricing plans
              </Link>{" "}
              to find the right solution for your business.
            </p>
          </div>

          <div className="mt-12 p-8 bg-stone-100 rounded-lg">
            <h3 className="serif-font font-bold text-xl mb-2 text-stone-900">
              Ready to automate your onboarding?
            </h3>
            <p className="text-stone-600 mb-4">
              Start your free account and streamline your client intake process.
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
            headline: "How to Automate Your Client Onboarding Workflow",
            datePublished: "2025-02-07",
            dateModified: "2025-02-07",
            author: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            publisher: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            description:
              "Save hours every week by automating the document and file collection process for new clients.",
          }),
        }}
        type="application/ld+json"
      />
    </div>
  );
}
