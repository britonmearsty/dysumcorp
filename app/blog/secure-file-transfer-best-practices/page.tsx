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
              Security
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />7 min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              February 10, 2025
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
            Secure File Transfer: Best Practices for 2025
          </h1>

          <p className="text-lg text-stone-600 mb-8">
            Protect your sensitive client data with these essential secure file
            transfer protocols and encryption standards.
          </p>

          <div className="prose prose-lg prose-stone max-w-none text-stone-800">
            <h2 className="serif-font">Why Secure File Transfer Matters</h2>
            <p>
              In an era where data breaches make headlines almost daily, the way
              you handle client files isn&apos;t just about
              efficiency&mdash;it&apos;s about trust. Your clients entrust you
              with sensitive documents, and any compromise can damage your
              professional relationships and expose you to legal liability.
            </p>
            <p>
              Whether you&apos;re handling financial documents, legal contracts,
              or personal identification information, the stakes are high.
              Let&apos;s explore the best practices that will keep your file
              transfers secure.
            </p>

            <h2 className="serif-font">Essential Security Practices</h2>

            <h3 className="serif-font">1. Use Encryption End-to-End</h3>
            <p>
              Always use encryption that protects your files from the moment
              they leave your client&apos;s device until they reach your
              storage. Look for solutions that offer TLS 256-bit encryption,
              which is the industry standard for protecting sensitive data
              during transit.
            </p>

            <h3 className="serif-font">2. Implement Access Controls</h3>
            <p>
              Not everyone needs access to every file. Set up role-based
              permissions so that team members can only access the files
              relevant to their work. This minimizes the risk of unauthorized
              access and creates an audit trail for compliance purposes.
            </p>

            <h3 className="serif-font">3. Set Expiration Dates</h3>
            <p>
              Upload links shouldn&apos;t last forever. Set expiration dates on
              shared links to ensure that access is automatically revoked after
              a reasonable period. This is especially important for sensitive
              documents that don&apos;t need long-term availability.
            </p>

            <h3 className="serif-font">4. Require Password Protection</h3>
            <p>
              For the most sensitive files, add an extra layer of security with
              password-protected upload links. This ensures that even if someone
              intercepts the link, they cannot access the contents without the
              password.
            </p>

            <h2 className="serif-font">Choosing a Secure Solution</h2>
            <p>
              When selecting a file transfer solution, look for these key
              security features:
            </p>
            <ul>
              <li>
                <strong>End-to-end encryption:</strong> Data is encrypted at
                rest and in transit
              </li>
              <li>
                <strong>Two-factor authentication:</strong> Extra layer of
                account security
              </li>
              <li>
                <strong>Audit logs:</strong> Complete tracking of who accessed
                what, when
              </li>
              <li>
                <strong>Compliance certifications:</strong> SOC 2, HIPAA, or
                GDPR compliance where applicable
              </li>
            </ul>

            <h2 className="serif-font">Get Started Today</h2>
            <p>
              Implementing these security best practices doesn&apos;t have to be
              complicated. Modern file collection platforms make it easy to
              secure your client transfers without sacrificing convenience.
              Check out our{" "}
              <Link className="text-stone-700 underline" href="/pricing">
                pricing plans
              </Link>{" "}
              to find the right fit for your business security needs.
            </p>
          </div>

          <div className="mt-12 p-8 bg-stone-100 rounded-lg">
            <h3 className="serif-font font-bold text-xl mb-2 text-stone-900">
              Ready to secure your file transfers?
            </h3>
            <p className="text-stone-600 mb-4">
              Start your free account and experience secure file collection
              today.
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
            headline: "Secure File Transfer: Best Practices for 2025",
            datePublished: "2025-02-10",
            dateModified: "2025-02-10",
            author: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            publisher: {
              "@type": "Organization",
              name: "Dysumcorp",
            },
            description:
              "Protect your sensitive client data with these essential secure file transfer protocols and encryption standards.",
          }),
        }}
        type="application/ld+json"
      />
    </div>
  );
}
