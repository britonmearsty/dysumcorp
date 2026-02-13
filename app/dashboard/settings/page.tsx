"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Bell,
  Shield,
  User,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  // Individual loading states for each section
  const [profileLoading, setProfileLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Success/error states for each section
  const [profileStatus, setProfileStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [notificationsStatus, setNotificationsStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const tabs = [
    { id: "profile", name: "Profile", icon: User, description: "Manage your personal information" },
    { id: "notifications", name: "Notifications", icon: Bell, description: "Control your alerts" },
    { id: "appearance", name: "Appearance", icon: Globe, description: "Customize interface" },
    { id: "security", name: "Security", icon: Shield, description: "Account protection" },
    { id: "danger", name: "Danger Zone", icon: Lock, description: "Irreversible actions" },
  ];

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const resetStatus = (
    setter: (status: "idle" | "success" | "error") => void,
    delay: number = 3000,
  ) => {
    setTimeout(() => setter("idle"), delay);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileStatus("idle");

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      setProfileStatus("success");
      resetStatus(setProfileStatus);
    } catch (error) {
      setProfileStatus("error");
      resetStatus(setProfileStatus);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setNotificationsLoading(true);
    setNotificationsStatus("idle");

    try {
      const response = await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
          weeklyReports,
        }),
      });

      if (!response.ok) throw new Error("Failed to update notifications");

      setNotificationsStatus("success");
      resetStatus(setNotificationsStatus);
    } catch (error) {
      setNotificationsStatus("error");
      resetStatus(setNotificationsStatus);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setNotificationsStatus("error");
      resetStatus(setNotificationsStatus);

      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete account");

      router.push("/");
    } catch (error) {
      setDeleteLoading(false);
      setNotificationsStatus("error");
      resetStatus(setNotificationsStatus);
    }
  };

  if (isPending) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your account preferences and application settings
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span className="font-medium text-sm">{tab.name}</span>
                  {isActive && (
                    <motion.div layoutId="settings-active-indicator" className="ml-auto">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                  <h2 className="text-xl font-semibold text-foreground">
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </p>
                </div>

                <div className="p-8">
                  {/* Profile Settings */}
                  {activeTab === "profile" && (
                    <form className="space-y-6" onSubmit={handleProfileUpdate}>
                      <div>
                        <Label className="text-sm font-semibold text-foreground" htmlFor="name">
                          Full Name
                        </Label>
                        <Input
                          className="mt-2 rounded-xl"
                          id="name"
                          placeholder="John Doe"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-foreground" htmlFor="email">
                          Email
                        </Label>
                        <Input
                          disabled
                          className="mt-2 rounded-xl opacity-60"
                          id="email"
                          placeholder="john@example.com"
                          type="email"
                          value={email}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Email is managed by your OAuth provider
                        </p>
                      </div>

                      {profileStatus !== "idle" && (
                        <div
                          className={`p-4 rounded-xl text-sm font-medium ${
                            profileStatus === "success"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                          }`}
                        >
                          {profileStatus === "success"
                            ? "Profile updated successfully!"
                            : "Failed to update profile. Please try again."}
                        </div>
                      )}

                      <Button
                        className="w-full rounded-xl"
                        disabled={profileLoading}
                        type="submit"
                      >
                        {profileLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  )}

                  {/* Notifications */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border hover:bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Email Notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Receive email updates
                            </p>
                          </div>
                          <input
                            checked={emailNotifications}
                            className="w-5 h-5 cursor-pointer accent-primary"
                            type="checkbox"
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border hover:bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Push Notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Browser notifications
                            </p>
                          </div>
                          <input
                            checked={pushNotifications}
                            className="w-5 h-5 cursor-pointer accent-primary"
                            type="checkbox"
                            onChange={(e) => setPushNotifications(e.target.checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border hover:bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">Weekly Reports</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Activity summaries
                            </p>
                          </div>
                          <input
                            checked={weeklyReports}
                            className="w-5 h-5 cursor-pointer accent-primary"
                            type="checkbox"
                            onChange={(e) => setWeeklyReports(e.target.checked)}
                          />
                        </div>
                      </div>

                      {notificationsStatus !== "idle" && (
                        <div
                          className={`p-4 rounded-xl text-sm font-medium ${
                            notificationsStatus === "success"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                          }`}
                        >
                          {notificationsStatus === "success"
                            ? "Notifications updated successfully!"
                            : "Failed to update notifications. Please try again."}
                        </div>
                      )}

                      <Button
                        className="w-full rounded-xl"
                        disabled={notificationsLoading}
                        onClick={handleNotificationUpdate}
                      >
                        {notificationsLoading ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  )}

                  {/* Appearance */}
                  {activeTab === "appearance" && (
                    <div>
                      <ThemeSwitcher />
                    </div>
                  )}

                  {/* Security */}
                  {activeTab === "security" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-xl border border-border">
                        <p className="font-semibold text-sm text-foreground">
                          Authentication Method
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          OAuth via{" "}
                          {session?.user?.email?.includes("gmail")
                            ? "Google"
                            : "Provider"}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-xl border border-border">
                        <p className="font-semibold text-sm text-foreground">Connected Email</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {session?.user?.email}
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-emerald-600 dark:text-emerald-400 h-5 w-5" />
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            Account Secured by OAuth
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Danger Zone */}
                  {activeTab === "danger" && (
                    <div className="space-y-6">
                      {!showDeleteConfirm ? (
                        <div className="flex items-center justify-between p-6 rounded-xl border-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
                          <div>
                            <p className="font-semibold text-sm text-foreground">Delete Account</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Permanently delete your account and all data
                            </p>
                          </div>
                          <Button
                            className="rounded-xl border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            Delete Account
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 p-6 rounded-xl border-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
                          <div>
                            <p className="font-bold text-red-600 dark:text-red-400">
                              Are you absolutely sure?
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              This action cannot be undone. This will permanently delete your
                              account and remove all your data from our servers.
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm font-semibold text-foreground" htmlFor="deleteConfirm">
                              Type{" "}
                              <span className="font-bold text-red-600 dark:text-red-400">DELETE</span>{" "}
                              to confirm
                            </Label>
                            <Input
                              className="mt-2 rounded-xl border-2 border-red-500/50 focus:border-red-500"
                              id="deleteConfirm"
                              placeholder="DELETE"
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                            />
                          </div>

                          {notificationsStatus !== "idle" && (
                            <div
                              className={`p-4 rounded-xl text-sm font-medium ${
                                notificationsStatus === "success"
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                              }`}
                            >
                              {notificationsStatus === "success"
                                ? "Account deletion initiated"
                                : deleteConfirmText !== "DELETE"
                                  ? 'Please type "DELETE" to confirm'
                                  : "Failed to delete account"}
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Button
                              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                              disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                              variant="default"
                              onClick={handleDeleteAccount}
                            >
                              {deleteLoading ? "Deleting..." : "Confirm Delete"}
                            </Button>
                            <Button
                              className="rounded-xl"
                              disabled={deleteLoading}
                              variant="outline"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText("");
                                setNotificationsStatus("idle");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
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
