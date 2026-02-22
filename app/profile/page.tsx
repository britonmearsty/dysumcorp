import { redirect } from "next/navigation";
import { User, Mail, Shield, Calendar, Fingerprint } from "lucide-react";
import Link from "next/link";

import { getSession } from "@/lib/auth-server";
import { LandingNavbar } from "@/components/landing-navbar";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />

      <main className="py-20 px-4 md:px-8 lg:px-16 lg:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold serif-font text-[#1c1917] mb-4">
              Your Profile
            </h1>
            <p className="text-stone-600 font-medium">
              Manage your account and workspace settings from here.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 md:p-12 shadow-sm premium-shadow">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                    <User className="w-3 h-3" /> Name
                  </label>
                  <p className="text-xl font-bold text-[#1c1917] serif-font">
                    {session.user.name || "Not provided"}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  <p className="text-xl font-bold text-[#1c1917] serif-font">
                    {session.user.email}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                    <Fingerprint className="w-3 h-3" /> User ID
                  </label>
                  <p className="text-sm font-bold text-[#1c1917] font-mono bg-stone-50 px-3 py-1.5 rounded-lg inline-block">
                    {session.user.id}
                  </p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                    <Shield className="w-3 h-3" /> Account Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${session.user.emailVerified ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                    <p className="text-xl font-bold text-[#1c1917] serif-font">
                      {session.user.emailVerified ? "Verified" : "Unverified"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                    <Calendar className="w-3 h-3" /> Member Since
                  </label>
                  <p className="text-xl font-bold text-[#1c1917] serif-font">
                    {new Date(session.user.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <Link
              className="text-sm font-bold uppercase tracking-widest text-stone-900 border-b-2 border-[#1c1917] pb-1 hover:text-stone-600 hover:border-stone-600 transition-all"
              href="/dashboard"
            >
              Back to Dashboard
            </Link>
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
