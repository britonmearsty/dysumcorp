"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Star,
  Bell,
  ChevronRight,
  ExternalLink,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Select, SelectItem } from "@heroui/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Mock ticket data
  const tickets = [
    {
      id: "TICK-1234",
      subject: "Login issues on mobile app",
      status: "Open",
      priority: "High",
      created: "2 hours ago",
      messages: 3,
    },
    {
      id: "TICK-1233",
      subject: "Feature request: Dark mode",
      status: "In Progress",
      priority: "Medium",
      created: "1 day ago",
      messages: 5,
    },
    {
      id: "TICK-1232",
      subject: "Billing question",
      status: "Resolved",
      priority: "Low",
      created: "3 days ago",
      messages: 2,
    },
    {
      id: "TICK-1231",
      subject: "API integration help",
      status: "Resolved",
      priority: "Medium",
      created: "5 days ago",
      messages: 8,
    },
  ];

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: "New Feature Released",
      message: "Check out our new file sharing capabilities",
      time: "1 hour ago",
      type: "info",
    },
    {
      id: 2,
      title: "Maintenance Scheduled",
      message: "System maintenance on Sunday 2AM-4AM EST",
      time: "3 hours ago",
      type: "warning",
    },
    {
      id: 3,
      title: "Ticket Updated",
      message: "Your ticket TICK-1233 has been updated",
      time: "1 day ago",
      type: "success",
    },
  ];

  const resources = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of using the platform",
      link: "#",
    },
    {
      title: "API Documentation",
      description: "Complete API reference and examples",
      link: "#",
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      link: "#",
    },
    {
      title: "Community Forum",
      description: "Connect with other users",
      link: "#",
    },
  ];

  const tabs = [
    {
      id: "tickets",
      name: "My Tickets",
      icon: MessageSquare,
      description: "Track and manage your support requests",
    },
    {
      id: "feedback",
      name: "Feedback",
      icon: Star,
      description: "Share your experience and suggestions",
    },
    {
      id: "updates",
      name: "Updates",
      icon: Bell,
      description: "Recent notifications and announcements",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "In Progress":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "Resolved":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
      case "Medium":
        return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "Low":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const handleCreateTicket = () => {
    // In a real app, this would submit to an API
    console.log("Creating ticket:", {
      ticketSubject,
      ticketMessage,
      ticketPriority,
    });
    setSubmitStatus("success");
    setTimeout(() => {
      setShowCreateTicket(false);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("Medium");
      setSubmitStatus("idle");
    }, 1500);
  };

  const handleSubmitFeedback = () => {
    // In a real app, this would submit to an API
    console.log("Submitting feedback:", { feedbackRating, feedbackMessage });
    setSubmitStatus("success");
    setTimeout(() => {
      setFeedbackMessage("");
      setFeedbackRating(0);
      setSubmitStatus("idle");
    }, 2000);
  };

  const openTickets = tickets.filter((t) => t.status === "Open").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Support
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Get help, manage tickets, and share feedback
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm">{tab.name}</span>
                  {isActive && (
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto"
                      initial={{ opacity: 0, x: -5 }}
                      layoutId="support-active-indicator"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="mt-6 p-4 bg-bg-card rounded-[12px] border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Open Tickets</span>
                <span className="font-semibold text-foreground">
                  {openTickets}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tickets</span>
                <span className="font-semibold text-foreground">
                  {tickets.length}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-bg-card rounded-[14px] border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                  <h2 className="text-xl font-semibold text-foreground">
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </p>
                </div>

                <div className="p-8">
                  {/* My Tickets Section */}
                  {activeTab === "tickets" && (
                    <div className="space-y-6">
                      {!showCreateTicket && !selectedTicket ? (
                        <>
                          <div className="flex items-center justify-end">
                            <Button
                              className="rounded-xl"
                              onClick={() => setShowCreateTicket(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create Ticket
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {tickets.map((ticket) => (
                              <div
                                key={ticket.id}
                                className="p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors cursor-pointer"
                                onClick={() => setSelectedTicket(ticket.id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getStatusIcon(ticket.status)}
                                      <span className="text-xs font-mono text-muted-foreground">
                                        {ticket.id}
                                      </span>
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}
                                      >
                                        {ticket.priority}
                                      </span>
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">
                                      {ticket.subject}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>Status: {ticket.status}</span>
                                      <span>•</span>
                                      <span>{ticket.messages} messages</span>
                                      <span>•</span>
                                      <span>Created {ticket.created}</span>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Help Resources */}
                          <div className="mt-8 pt-8 border-t border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                              Help Resources
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              {resources.map((resource, index) => (
                                <a
                                  key={index}
                                  className="p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors group"
                                  href={resource.link}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                        {resource.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {resource.description}
                                      </p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : showCreateTicket ? (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                              Create New Ticket
                            </h3>
                            <button
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => {
                                setShowCreateTicket(false);
                                setTicketSubject("");
                                setTicketMessage("");
                                setTicketPriority("Medium");
                                setSubmitStatus("idle");
                              }}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div>
                            <Label
                              className="text-sm font-semibold text-foreground"
                              htmlFor="subject"
                            >
                              Subject
                            </Label>
                            <Input
                              className="mt-2 rounded-xl"
                              id="subject"
                              placeholder="Brief description of your issue"
                              type="text"
                              value={ticketSubject}
                              onChange={(e) => setTicketSubject(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label
                              className="text-sm font-semibold text-foreground"
                              htmlFor="priority"
                            >
                              Priority
                            </Label>
                            <Select
                              className="mt-2"
                              label="Priority"
                              selectedKeys={[ticketPriority]}
                              onChange={(e) =>
                                setTicketPriority(e.target.value)
                              }
                            >
                              <SelectItem key="Low">Low</SelectItem>
                              <SelectItem key="Medium">Medium</SelectItem>
                              <SelectItem key="High">High</SelectItem>
                            </Select>
                          </div>

                          <div>
                            <Label
                              className="text-sm font-semibold text-foreground"
                              htmlFor="message"
                            >
                              Message
                            </Label>
                            <textarea
                              className="mt-2 w-full min-h-[150px] px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              id="message"
                              placeholder="Describe your issue in detail..."
                              value={ticketMessage}
                              onChange={(e) => setTicketMessage(e.target.value)}
                            />
                          </div>

                          {submitStatus === "success" && (
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">
                                  Ticket created successfully!
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Button
                              className="rounded-xl"
                              disabled={
                                !ticketSubject ||
                                !ticketMessage ||
                                submitStatus === "success"
                              }
                              onClick={handleCreateTicket}
                            >
                              {submitStatus === "success"
                                ? "Created!"
                                : "Submit Ticket"}
                            </Button>
                            <Button
                              className="rounded-xl"
                              variant="outline"
                              onClick={() => {
                                setShowCreateTicket(false);
                                setTicketSubject("");
                                setTicketMessage("");
                                setTicketPriority("Medium");
                                setSubmitStatus("idle");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Ticket Details View
                        <div className="space-y-6">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setSelectedTicket(null)}
                            >
                              <ChevronRight className="w-4 h-4 rotate-180" />
                              <span className="text-sm font-medium">
                                Back to tickets
                              </span>
                            </button>
                          </div>

                          {(() => {
                            const ticket = tickets.find(
                              (t) => t.id === selectedTicket,
                            );

                            if (!ticket) return null;

                            return (
                              <div className="space-y-6">
                                {/* Ticket Header */}
                                <div className="p-6 bg-muted rounded-xl border border-border">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(ticket.status)}
                                        <span className="text-xs font-mono text-muted-foreground">
                                          {ticket.id}
                                        </span>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}
                                        >
                                          {ticket.priority}
                                        </span>
                                      </div>
                                      <h3 className="text-xl font-semibold text-foreground">
                                        {ticket.subject}
                                      </h3>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Status: {ticket.status}</span>
                                    <span>•</span>
                                    <span>Created {ticket.created}</span>
                                  </div>
                                </div>

                                {/* Mock Messages */}
                                <div className="space-y-4">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Messages ({ticket.messages})
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="p-4 bg-muted rounded-xl border border-border">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-foreground">
                                          You
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {ticket.created}
                                        </span>
                                      </div>
                                      <p className="text-sm text-foreground">
                                        Initial ticket message describing the
                                        issue...
                                      </p>
                                    </div>

                                    {ticket.status !== "Open" && (
                                      <div className="p-4 bg-bg-card rounded-[12px] border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-sm font-semibold text-foreground">
                                            Support Team
                                          </span>
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            Admin
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {ticket.status === "Resolved"
                                              ? "2 days ago"
                                              : "1 day ago"}
                                          </span>
                                        </div>
                                        <p className="text-sm text-foreground">
                                          Thank you for reaching out. We're
                                          looking into this issue...
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Reply Form */}
                                  {ticket.status !== "Resolved" && (
                                    <div className="pt-4 border-t border-border">
                                      <Label
                                        className="text-sm font-semibold text-foreground"
                                        htmlFor="reply"
                                      >
                                        Add Reply
                                      </Label>
                                      <textarea
                                        className="mt-2 w-full min-h-[100px] px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        id="reply"
                                        placeholder="Type your message..."
                                      />
                                      <Button className="mt-3 rounded-xl">
                                        Send Reply
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Section */}
                  {activeTab === "feedback" && (
                    <div className="max-w-md space-y-6">
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-3 block">
                          How would you rate your experience?
                        </Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              className="transition-transform hover:scale-110"
                              onClick={() => setFeedbackRating(rating)}
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  rating <= feedbackRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label
                          className="text-sm font-semibold text-foreground"
                          htmlFor="feedback"
                        >
                          Your Feedback
                        </Label>
                        <textarea
                          className="mt-2 w-full min-h-[150px] px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          id="feedback"
                          placeholder="Tell us what you think..."
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value)}
                        />
                      </div>

                      {submitStatus === "success" && (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">
                              Thank you for your feedback!
                            </span>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full rounded-xl"
                        disabled={
                          !feedbackRating ||
                          !feedbackMessage ||
                          submitStatus === "success"
                        }
                        onClick={handleSubmitFeedback}
                      >
                        {submitStatus === "success"
                          ? "Submitted!"
                          : "Submit Feedback"}
                      </Button>
                    </div>
                  )}

                  {/* Updates Section */}
                  {activeTab === "updates" && (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 bg-muted rounded-xl border border-border"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                notification.type === "info"
                                  ? "bg-blue-100 dark:bg-blue-950/30"
                                  : notification.type === "warning"
                                    ? "bg-yellow-100 dark:bg-yellow-950/30"
                                    : "bg-emerald-100 dark:bg-emerald-950/30"
                              }`}
                            >
                              <Bell
                                className={`w-4 h-4 ${
                                  notification.type === "info"
                                    ? "text-blue-600 dark:text-blue-400"
                                    : notification.type === "warning"
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {notification.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
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
