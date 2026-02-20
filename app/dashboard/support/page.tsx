"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Mail,
  Send,
  CheckCircle,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const tabs = [
    {
      id: "contact",
      name: "Contact Support",
      icon: MessageSquare,
      description: "Get in touch with our support team",
    },
    {
      id: "faq",
      name: "FAQ",
      icon: HelpCircle,
      description: "Frequently asked questions",
    },
  ];

  const faqs = [
    {
      question: "How do I create a new portal?",
      answer:
        "Navigate to the Portals page and click the 'Create Portal' button. Fill in the required information including portal name, slug, and configure your desired settings for branding, storage, security, and messaging.",
    },
    {
      question: "What storage providers are supported?",
      answer:
        "We currently support Google Drive and Dropbox. You can connect your cloud storage accounts from the Storage page in your dashboard. All file uploads will be stored in your connected cloud storage.",
    },
    {
      question: "How do I share a portal with clients?",
      answer:
        "Each portal has a unique URL (e.g., yoursite.com/portal/your-slug). You can copy this link from the portal card and share it with your clients. Clients can upload files without needing an account.",
    },
    {
      question: "Can I password protect files?",
      answer:
        "Yes! When viewing files in the Assets page, you can set a password for individual files. Clients will need to enter this password to download the file.",
    },
    {
      question: "How do I track file downloads?",
      answer:
        "File download counts are automatically tracked and displayed in the Assets page. You can see how many times each file has been downloaded.",
    },
    {
      question: "What are the plan limits?",
      answer:
        "Free plan allows 5 portals. Premium plans offer unlimited portals, custom branding, and advanced features. Check the Billing page for detailed plan information.",
    },
    {
      question: "How do I deactivate a portal?",
      answer:
        "On the Portals page, click the deactivate button (X icon) on any portal card. Deactivated portals won't accept new uploads but existing files remain accessible.",
    },
    {
      question: "Can I customize portal branding?",
      answer:
        "Yes! When creating or editing a portal, you can customize the logo, colors, welcome message, and success message to match your brand.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("sending");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setSubmitStatus("success");
      setTimeout(() => {
        setSubject("");
        setMessage("");
        setSubmitStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Support form error:", error);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Support & Help
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-lg">
          Get assistance, find answers, and explore resources
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? "bg-card shadow-sm border border-border text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon
                    className={`w-4 sm:w-5 h-4 sm:h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm">{tab.name}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto"
                      layoutId="support-active-indicator"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </p>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Contact Support Section */}
                  {activeTab === "contact" && (
                    <div className="max-w-2xl">
                      <form
                        className="space-y-4 sm:space-y-6"
                        onSubmit={handleSubmit}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label
                              className="block text-sm font-semibold text-foreground mb-1.5 sm:mb-2"
                              htmlFor="name"
                            >
                              Name
                            </label>
                            <input
                              required
                              className="w-full px-3 sm:px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                              id="name"
                              placeholder="Your name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              className="block text-sm font-semibold text-foreground mb-1.5 sm:mb-2"
                              htmlFor="email"
                            >
                              Email
                            </label>
                            <input
                              required
                              className="w-full px-3 sm:px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                              id="email"
                              placeholder="your@email.com"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            className="block text-sm font-semibold text-foreground mb-1.5 sm:mb-2"
                            htmlFor="subject"
                          >
                            Subject
                          </label>
                          <input
                            required
                            className="w-full px-3 sm:px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                            id="subject"
                            placeholder="Brief description of your issue"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                          />
                        </div>

                        <div>
                          <label
                            className="block text-sm font-semibold text-foreground mb-1.5 sm:mb-2"
                            htmlFor="message"
                          >
                            Message
                          </label>
                          <textarea
                            required
                            className="w-full px-3 sm:px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
                            id="message"
                            placeholder="Describe your issue or question in detail..."
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                          />
                        </div>

                        {submitStatus === "success" && (
                          <motion.div
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 sm:p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            initial={{ opacity: 0, y: -10 }}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                              <span className="font-medium text-xs sm:text-sm">
                                Message sent successfully! We'll get back to you
                                soon.
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {submitStatus === "error" && (
                          <motion.div
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                            initial={{ opacity: 0, y: -10 }}
                          >
                            <span className="font-medium text-xs sm:text-sm">
                              Failed to send message. Please try again or email
                              us directly.
                            </span>
                          </motion.div>
                        )}

                        <button
                          className="px-4 sm:px-6 py-2.5 bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                          disabled={
                            submitStatus === "sending" ||
                            submitStatus === "success"
                          }
                          type="submit"
                        >
                          {submitStatus === "sending" ? (
                            <>
                              <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : submitStatus === "success" ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Sent!
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Message
                            </>
                          )}
                        </button>
                      </form>

                      <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-2 sm:mb-3">
                          Other Ways to Reach Us
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              Email:
                            </span>{" "}
                            <a
                              className="text-primary hover:underline"
                              href="mailto:support@dysumcorp.pro"
                            >
                              support@dysumcorp.pro
                            </a>
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              Response Time:
                            </span>{" "}
                            Usually within 24 hours
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FAQ Section */}
                  {activeTab === "faq" && (
                    <div className="max-w-3xl space-y-2 sm:space-y-3">
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg overflow-hidden bg-muted/30"
                        >
                          <button
                            className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-muted/50 transition-colors"
                            type="button"
                            onClick={() =>
                              setExpandedFaq(
                                expandedFaq === index ? null : index,
                              )
                            }
                          >
                            <span className="font-semibold text-foreground pr-4 text-sm sm:text-base">
                              {faq.question}
                            </span>
                            <ChevronRight
                              className={`w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground flex-shrink-0 transition-transform ${expandedFaq === index ? "rotate-90" : ""
                                }`}
                            />
                          </button>
                          <AnimatePresence>
                            {expandedFaq === index && (
                              <motion.div
                                animate={{ height: "auto", opacity: 1 }}
                                className="overflow-hidden"
                                exit={{ height: 0, opacity: 0 }}
                                initial={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground border-t border-border bg-card">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-muted/50 rounded-lg border border-border">
                        <h3 className="font-semibold text-foreground mb-2">
                          Can't find what you're looking for?
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                          Contact our support team and we'll be happy to help.
                        </p>
                        <button
                          className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-semibold hover:opacity-90 transition-all w-full sm:w-auto"
                          type="button"
                          onClick={() => setActiveTab("contact")}
                        >
                          Contact Support
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
