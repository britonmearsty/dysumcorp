"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Bell,
  Shield,
  User,
  Globe,
  Lock,
  ChevronRight,
  Upload,
  Camera,
  Loader2,
  Palette,
  HardDrive,
  Mail,
} from "lucide-react";
import { Checkbox } from "@heroui/react";

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
  const [image, setImage] = useState("");
  const [portalLogo, setPortalLogo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Notification state
  const [notifyOnUpload, setNotifyOnUpload] = useState(true);
  const [notifyOnDownload, setNotifyOnDownload] = useState(true);
  const [notifyOnSignIn, setNotifyOnSignIn] = useState(true);
  const [notifyOnPortalCreate, setNotifyOnPortalCreate] = useState(true);
  const [notifyOnStorageWarning, setNotifyOnStorageWarning] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Storage delete behavior
  const [storageDeleteBehavior, setStorageDeleteBehavior] = useState<
    "ask" | "always" | "never"
  >("ask");
  const [storageDeleteLoading, setStorageDeleteLoading] = useState(false);
  const [storageDeleteStatus, setStorageDeleteStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const tabs = [
    {
      id: "profile",
      name: "Profile",
      icon: User,
      description: "Manage your personal information",
    },
    {
      id: "branding",
      name: "Branding",
      icon: Palette,
      description: "Default portal aesthetics",
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      description: "Control your alerts",
    },
    {
      id: "appearance",
      name: "Appearance",
      icon: Globe,
      description: "Customize interface",
    },
    {
      id: "security",
      name: "Security",
      icon: Shield,
      description: "Account protection",
    },
    {
      id: "danger",
      name: "Danger Zone",
      icon: Lock,
      description: "Irreversible actions",
    },
    {
      id: "storage",
      name: "Storage Deletion",
      icon: HardDrive,
      description: "Control storage deletion behavior",
    },
  ];

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setImage(session.user.image || "");
      // Use the newly added field if available
      setPortalLogo((session.user as any).portalLogo || "");
    }
  }, [session]);

  useEffect(() => {
    async function fetchNotificationSettings() {
      try {
        const response = await fetch("/api/user/notifications");

        if (response.ok) {
          const data = await response.json();

          setNotifyOnUpload(data.notifyOnUpload ?? true);
          setNotifyOnDownload(data.notifyOnDownload ?? true);
          setNotifyOnSignIn(data.notifyOnSignIn ?? true);
          setNotifyOnPortalCreate(data.notifyOnPortalCreate ?? true);
          setNotifyOnStorageWarning(data.notifyOnStorageWarning ?? true);
          setWeeklyReports(data.weeklyReports ?? false);
        }
      } catch (error) {
        console.error("Failed to fetch notification settings:", error);
      }
    }

    if (session?.user) {
      fetchNotificationSettings();
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/storage-delete-behavior")
      .then((r) => r.json())
      .then((d) => {
        if (d.storageDeleteBehavior)
          setStorageDeleteBehavior(d.storageDeleteBehavior);
      })
      .catch(() => {});
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
        body: JSON.stringify({ name, image, portalLogo }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      setProfileStatus("success");
      router.refresh();
      resetStatus(setProfileStatus);
    } catch (error) {
      setProfileStatus("error");
      resetStatus(setProfileStatus);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", "profiles");

    try {
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      setImage(data.url);

      // Auto-save the new image
      await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: data.url }),
      });

      setProfileStatus("success");
      router.refresh();
      resetStatus(setProfileStatus);
    } catch (error) {
      console.error("Image upload error:", error);
      setProfileStatus("error");
      resetStatus(setProfileStatus);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setIsUploadingLogo(true);
    const formData = new FormData();
    const originalLogo = portalLogo;

    formData.append("file", file);
    formData.append("folder", "portals/defaults");

    try {
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      const saveRes = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image, portalLogo: data.url }),
      });

      if (!saveRes.ok) throw new Error("Failed to save logo");

      setPortalLogo(data.url);
      setProfileStatus("success");
      router.refresh();
      resetStatus(setProfileStatus);
    } catch (error) {
      console.error("Logo upload error:", error);
      setPortalLogo(originalLogo);
      setProfileStatus("error");
      resetStatus(setProfileStatus);
    } finally {
      setIsUploadingLogo(false);
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
          notifyOnUpload,
          notifyOnDownload,
          notifyOnSignIn,
          notifyOnPortalCreate,
          notifyOnStorageWarning,
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

  const handleStorageDeleteUpdate = async () => {
    setStorageDeleteLoading(true);
    setStorageDeleteStatus("idle");
    try {
      const res = await fetch("/api/user/storage-delete-behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageDeleteBehavior }),
      });

      if (!res.ok) throw new Error();
      setStorageDeleteStatus("success");
      resetStatus(setStorageDeleteStatus);
    } catch {
      setStorageDeleteStatus("error");
      resetStatus(setStorageDeleteStatus);
    } finally {
      setStorageDeleteLoading(false);
    }
  };

  if (isPending) {
    return (
      <div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-lg">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-lg">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 group ${
                    isActive
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
                      layoutId="settings-active-indicator"
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
        <main className="flex-1 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-bg-card rounded-[14px] border border-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </p>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Profile Settings */}
                  {activeTab === "profile" && (
                    <form
                      className="space-y-4 sm:space-y-6"
                      onSubmit={handleProfileUpdate}
                    >
                      {/* Profile Image */}
                      <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 sm:gap-6 mb-8">
                        <div className="relative group">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-border bg-muted flex items-center justify-center relative">
                            {image ? (
                              <img
                                alt="Profile"
                                className="w-full h-full object-cover"
                                src={image}
                              />
                            ) : (
                              <User className="w-12 h-12 text-muted-foreground" />
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                          <label
                            className="absolute -right-2 -bottom-2 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform"
                            htmlFor="profile-image"
                          >
                            <Camera className="w-4 h-4" />
                          </label>
                          <input
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            id="profile-image"
                            type="file"
                            onChange={handleImageUpload}
                          />
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-lg font-bold text-foreground">
                            Profile Picture
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG or GIF. Max 5MB.
                          </p>
                          <Button
                            className="mt-3 h-8 text-[10px] font-bold uppercase tracking-wider"
                            disabled={isUploading}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("profile-image")?.click()
                            }
                          >
                            Change Photo
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label
                          className="text-sm font-semibold text-foreground"
                          htmlFor="name"
                        >
                          Full Name
                        </Label>
                        <Input
                          className="mt-1.5 sm:mt-2 rounded-xl"
                          id="name"
                          placeholder="John Doe"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label
                          className="text-sm font-semibold text-foreground"
                          htmlFor="email"
                        >
                          Email
                        </Label>
                        <Input
                          disabled
                          className="mt-1.5 sm:mt-2 rounded-xl opacity-60"
                          id="email"
                          placeholder="john@example.com"
                          type="email"
                          value={email}
                        />
                        <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
                          Email is managed by your OAuth provider
                        </p>
                      </div>

                      {profileStatus !== "idle" && (
                        <div
                          className={`p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-medium ${
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

                  {/* Branding Settings */}
                  {activeTab === "branding" && (
                    <div className="space-y-8">
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-4 block">
                          Default Portal Logo
                        </Label>
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-border rounded-2xl bg-muted/30">
                          <div className="relative group">
                            <div className="w-48 h-24 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center relative">
                              {portalLogo ? (
                                <img
                                  alt="Portal Logo"
                                  className="max-w-full max-h-full object-contain p-2"
                                  src={portalLogo}
                                />
                              ) : (
                                <Palette className="w-8 h-8 text-muted-foreground/30" />
                              )}
                              {isUploadingLogo && (
                                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                              )}
                            </div>
                            <label
                              className="absolute -right-2 -bottom-2 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform"
                              htmlFor="default-logo"
                            >
                              <Upload className="w-4 h-4" />
                            </label>
                            <input
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingLogo}
                              id="default-logo"
                              type="file"
                              onChange={handleLogoUpload}
                            />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-bold text-foreground">
                              Generic Brand Asset
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              This logo will be used as the default for all new
                              portals you create. Translucent PNG or SVG
                              recommended.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                              <Button
                                className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                disabled={isUploadingLogo}
                                size="sm"
                                onClick={() =>
                                  document
                                    .getElementById("default-logo")
                                    ?.click()
                                }
                              >
                                Upload New Logo
                              </Button>
                              {portalLogo && (
                                <Button
                                  className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPortalLogo("")}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                        <p className="text-xs text-primary font-medium leading-relaxed">
                          <strong>Pro Tip:</strong> Setting a default logo here
                          saves you time when setting up new client portals. You
                          can always override this on a per-portal basis.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  {activeTab === "notifications" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              File Upload Notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              Get notified when files are uploaded to your
                              portals
                            </p>
                          </div>
                          <Checkbox
                            isSelected={notifyOnUpload}
                            onValueChange={setNotifyOnUpload}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              File Download Notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              Get notified when someone downloads files from
                              your portals
                            </p>
                          </div>
                          <Checkbox
                            isSelected={notifyOnDownload}
                            onValueChange={setNotifyOnDownload}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Sign-in Notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              Get notified of new sign-ins to your account
                            </p>
                          </div>
                          <Checkbox
                            isSelected={notifyOnSignIn}
                            onValueChange={setNotifyOnSignIn}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Portal Created Notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              Get notified when a new portal is created
                            </p>
                          </div>
                          <Checkbox
                            isSelected={notifyOnPortalCreate}
                            onValueChange={setNotifyOnPortalCreate}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Storage Warning Notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              Get notified when storage is running low
                            </p>
                          </div>
                          <Checkbox
                            isSelected={notifyOnStorageWarning}
                            onValueChange={setNotifyOnStorageWarning}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Weekly Reports
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              Receive weekly activity summaries
                            </p>
                          </div>
                          <Checkbox
                            isSelected={weeklyReports}
                            onValueChange={setWeeklyReports}
                          />
                        </div>
                      </div>

                      {notificationsStatus !== "idle" && (
                        <div
                          className={`p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-medium ${
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
                        {notificationsLoading
                          ? "Saving..."
                          : "Save Preferences"}
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
                    <div className="space-y-3 sm:space-y-4">
                      <div className="p-3 sm:p-4 bg-muted rounded-xl border border-border">
                        <p className="font-semibold text-sm text-foreground">
                          Authentication Method
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                          OAuth via{" "}
                          {session?.user?.email?.includes("gmail")
                            ? "Google"
                            : "Provider"}
                        </p>
                      </div>

                      <div className="p-3 sm:p-4 bg-muted rounded-xl border border-border">
                        <p className="font-semibold text-sm text-foreground">
                          Connected Email
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 sm:mt-2 break-all">
                          {session?.user?.email}
                        </p>
                      </div>

                      <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-emerald-600 dark:text-emerald-400 h-4 sm:h-5 w-4 sm:w-5" />
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            Account Secured by OAuth
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Storage Deletion */}
                  {activeTab === "storage" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choose what happens to files in your connected storage
                          (Google Drive, Dropbox) when you delete them from the
                          app.
                        </p>
                        <div className="space-y-3">
                          {[
                            {
                              value: "ask",
                              label: "Ask me each time",
                              description:
                                "A checkbox appears in every delete dialog so you can decide per deletion.",
                            },
                            {
                              value: "always",
                              label: "Always delete from storage",
                              description:
                                "Files are automatically removed from Google Drive or Dropbox whenever you delete them here.",
                            },
                            {
                              value: "never",
                              label: "Never delete from storage",
                              description:
                                "Only the app record is removed. Files in your connected storage are never touched.",
                            },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                storageDeleteBehavior === option.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-muted hover:bg-muted/80"
                              }`}
                            >
                              <input
                                checked={storageDeleteBehavior === option.value}
                                className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
                                name="storageDeleteBehavior"
                                type="radio"
                                value={option.value}
                                onChange={() =>
                                  setStorageDeleteBehavior(
                                    option.value as "ask" | "always" | "never",
                                  )
                                }
                              />
                              <div>
                                <p className="font-semibold text-sm text-foreground">
                                  {option.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {option.description}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {storageDeleteStatus !== "idle" && (
                        <div
                          className={`p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-medium ${
                            storageDeleteStatus === "success"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                          }`}
                        >
                          {storageDeleteStatus === "success"
                            ? "Preference saved!"
                            : "Failed to save. Please try again."}
                        </div>
                      )}

                      <Button
                        className="w-full rounded-xl"
                        disabled={storageDeleteLoading}
                        onClick={handleStorageDeleteUpdate}
                      >
                        {storageDeleteLoading ? "Saving..." : "Save Preference"}
                      </Button>
                    </div>
                  )}

                  {/* Danger Zone */}
                  {activeTab === "danger" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-xl border-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            Account Deletion
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            For security reasons, account deletion must be
                            processed manually.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 rounded-xl border border-border bg-muted/30">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Manual Account Deletion Required
                            </p>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                              To protect your data and ensure proper handling of
                              your account, account deletion must be processed
                              manually by our support team. This ensures all
                              your data, portals, and files are handled properly
                              before the account is permanently closed.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            How to Request Account Deletion
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-foreground">
                                  Email Support
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Send your request to{" "}
                                  <a
                                    className="text-primary hover:underline font-medium"
                                    href="mailto:support@dysumcorp.pro"
                                  >
                                    support@dysumcorp.pro
                                  </a>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                              <Globe className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-foreground">
                                  Contact Form
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Submit a request via our{" "}
                                  <Link
                                    className="text-primary hover:underline font-medium"
                                    href="/contact"
                                  >
                                    contact page
                                  </Link>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                            <strong>Note:</strong> Please include your
                            registered email address in your request. Our team
                            will verify your identity before processing the
                            deletion. This process typically takes 24-48 hours.
                          </p>
                        </div>
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
