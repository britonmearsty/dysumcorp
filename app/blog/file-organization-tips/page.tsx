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
              Productivity
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />4 min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              January 28, 2025
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
            10 File Organization Tips for Small Businesses
          </h1>

          <p className="text-lg text-stone-600 mb-8">
            Keep your client files organized and findable with these proven file
            naming and folder structure strategies.
          </p>

          <div className="prose prose-lg prose-stone max-w-none text-stone-800">
            <h2 className="serif-font">Why Organization Matters</h2>
            <p>
              Every minute spent searching for a file is a minute not spent on
              billable work. Poor file organization costs businesses thousands
              of dollars annually in wasted time. The good news? A few simple
              habits can transform your file management.
            </p>

            <h2 className="serif-font">Essential File Organization Tips</h2>

            <h3 className="serif-font">
              1. Create a Consistent Naming Convention
            </h3>
            <p>
              Establish a naming formula and stick to it. For example:
              <br />
              <code>ClientName_YYYY-MM_DocumentType_Version</code>
              <br />
              This makes files sortable and searchable.
            </p>

            <h3 className="serif-font">2. Use Date Formats Consistently</h3>
            <p>
              Always use YYYY-MM-DD format. This ensures files sort
              chronologically regardless of how you view them.
            </p>

            <h3 className="serif-font">
              3. Create a Standard Folder Structure
            </h3>
            <p>
              Design a template folder structure that you use for every client.
              Include folders like: Contracts, Invoices, Correspondence, Project
              Files.
            </p>

            <h3 className="serif-font">4. Never Use Special Characters</h3>
            <p>
              Avoid using characters like /, \, :, *, ?, &quot;, &lt;, &gt;, |
              in file names. These can cause sync errors and make files
              unopenable.
            </p>

            <h3 className="serif-font">5. Include Version Numbers</h3>
            <p>
              When updating documents, use version numbers: Contract_v1,
              Contract_v2, etc. This prevents confusion and allows you to track
              changes.
            </p>

            <h3 className="serif-font">6. Set Up Automatic Organization</h3>
            <p>
              Use tools that automatically sort incoming files into the correct
              folders based on client name or project. This eliminates manual
              sorting.
            </p>

            <h3 className="serif-font">7. Archive Old Projects</h3>
            <p>
              Move completed projects to an archive folder. This keeps your
              active work area clean while preserving historical files.
            </p>

            <h3 className="serif-font">8. Create a Master Index</h3>
            <p>
              Maintain a spreadsheet or document that maps client names to
              folder locations. This is especially helpful when you have many
              clients.
            </p>

            <h3 className="serif-font">9. Back Up Everything</h3>
            <p>
              Implement a 3-2-1 backup strategy: 3 copies of data, on 2
              different media, with 1 stored offsite.
            </p>

            <h3 className="serif-font">10. Schedule Regular Cleanups</h3>
            <p>
              Set a monthly reminder to review and organize your files.
              Proactive maintenance prevents chaos from building up.
            </p>

            <h2 className="serif-font">Get Started Today</h2>
            <p>
              Good file organization habits take time to develop, but the payoff
              is enormous. Want to make file collection and organization
              effortless? Check out our{" "}
              <Link className="text-stone-700 underline" href="/pricing">
                pricing plans
              </Link>{" "}
              to automate your workflow.
            </p>
          </div>

          <div className="mt-12 p-8 bg-stone-100 rounded-lg">
            <h3 className="serif-font font-bold text-xl mb-2 text-stone-900">
              Ready to automate file organization?
            </h3>
            <p className="text-stone-600 mb-4">
              Start your free account and let the system handle your files.
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
            headline: "10 File Organization Tips for Small Businesses",
            datePublished: "2025-01-28",
            dateModified: "2025-01-28",
            author: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            publisher: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            description:
              "Keep your client files organized and findable with these proven file naming and folder structure strategies.",
          }),
        }}
        type="application/ld+json"
      />
    </div>
  );
}
