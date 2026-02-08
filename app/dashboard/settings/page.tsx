"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  CheckCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  UsersIcon,
  GlobeIcon,
  LockIcon,
} from "@/components/icons";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const sections: SettingsSection[] = [
    {
      id: "profile",
      title: "Profile Settings",
      description: "Manage your account information",
      icon: <UsersIcon size={20} />,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Control how you receive updates",
      icon: <BellIcon size={20} />,
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Customize your interface",
      icon: <GlobeIcon size={20} />,
    },
    {
      id: "security",
      title: "Security",
      description: "Manage your account security",
      icon: <ShieldCheckIcon size={20} />,
    },
    {
      id: "danger",
      title: "Danger Zone",
      description: "Irreversible account actions",
      icon: <LockIcon size={20} />,
    },
  ];

  const getStatusColor = (status: "idle" | "success" | "error") => {
    switch (status) {
      case "success":
        return "success";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusMessage = (
    status: "idle" | "success" | "error",
    section: string,
  ) => {
    switch (status) {
      case "success":
        return `${section} updated successfully!`;
      case "error":
        return `Failed to update ${section}. Please try again.`;
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-mono">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and preferences
          </p>
        </div>

        {/* Quick status indicator */}
        <div className="hidden md:flex items-center gap-2">
          <Chip className="font-mono" color="success" size="sm" variant="flat">
            Connected
          </Chip>
          <div className="text-sm text-muted-foreground font-mono">
            {session?.user?.email}
          </div>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <UsersIcon size={20} />
              </div>
              <div>
                <h3 className="font-mono font-semibold">Profile Settings</h3>
                <p className="text-sm text-default-600">
                  Manage your information
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 pt-0">
            <form className="space-y-4" onSubmit={handleProfileUpdate}>
              <div>
                <Label className="text-sm font-mono" htmlFor="name">
                  Full Name
                </Label>
                <Input
                  className="mt-2 font-mono"
                  id="name"
                  placeholder="John Doe"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-mono" htmlFor="email">
                  Email
                </Label>
                <Input
                  disabled
                  className="mt-2 font-mono opacity-60"
                  id="email"
                  placeholder="john@example.com"
                  type="email"
                  value={email}
                />
                <p className="text-xs text-default-500 font-mono mt-1">
                  Email is managed by your OAuth provider
                </p>
              </div>

              {/* Profile Status */}
              {profileStatus !== "idle" && (
                <div
                  className={`p-3 rounded-lg text-sm font-mono ${
                    profileStatus === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {getStatusMessage(profileStatus, "Profile")}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1 font-mono rounded-lg"
                  color="primary"
                  disabled={profileLoading}
                  type="submit"
                >
                  {profileLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <BellIcon size={20} />
              </div>
              <div>
                <h3 className="font-mono font-semibold">Notifications</h3>
                <p className="text-sm text-default-600">Control your alerts</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 pt-0">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-default-50 dark:hover:bg-default-100 transition-colors">
              <div>
                <p className="font-medium text-sm font-mono">
                  Email Notifications
                </p>
                <p className="text-xs text-default-600">
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

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-default-50 dark:hover:bg-default-100 transition-colors">
              <div>
                <p className="font-medium text-sm font-mono">
                  Push Notifications
                </p>
                <p className="text-xs text-default-600">
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

            {/* Weekly Reports */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-default-50 dark:hover:bg-default-100 transition-colors">
              <div>
                <p className="font-medium text-sm font-mono">Weekly Reports</p>
                <p className="text-xs text-default-600">Activity summaries</p>
              </div>
              <input
                checked={weeklyReports}
                className="w-5 h-5 cursor-pointer accent-primary"
                type="checkbox"
                onChange={(e) => setWeeklyReports(e.target.checked)}
              />
            </div>

            {/* Notification Status */}
            {notificationsStatus !== "idle" && (
              <div
                className={`p-3 rounded-lg text-sm font-mono ${
                  notificationsStatus === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                }`}
              >
                {getStatusMessage(notificationsStatus, "Notifications")}
              </div>
            )}

            <Button
              className="w-full font-mono rounded-lg"
              color="primary"
              disabled={notificationsLoading}
              onClick={handleNotificationUpdate}
            >
              {notificationsLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </CardBody>
        </Card>

        {/* Appearance */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <GlobeIcon size={20} />
              </div>
              <div>
                <h3 className="font-mono font-semibold">Appearance</h3>
                <p className="text-sm text-default-600">Customize interface</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <ThemeSwitcher />
          </CardBody>
        </Card>

        {/* Security */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <h3 className="font-mono font-semibold">Security</h3>
                <p className="text-sm text-default-600">Account protection</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 pt-0">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-default-50 dark:bg-default-100">
                <p className="font-medium text-sm font-mono">
                  Authentication Method
                </p>
                <p className="text-xs text-default-600 mt-1">
                  OAuth via{" "}
                  {session?.user?.email?.includes("gmail")
                    ? "Google"
                    : "Provider"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-default-50 dark:bg-default-100">
                <p className="font-medium text-sm font-mono">Connected Email</p>
                <p className="text-xs text-default-600 mt-1 font-mono">
                  {session?.user?.email}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon
                    className="text-green-600 dark:text-green-400"
                    size={16}
                  />
                  <p className="text-sm font-mono text-green-700 dark:text-green-300">
                    Account secured by OAuth
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Danger Zone - Full Width */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <LockIcon size={20} />
            </div>
            <div>
              <h3 className="font-mono font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </h3>
              <p className="text-sm text-red-500 dark:text-red-500">
                Irreversible actions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <div>
                <p className="font-medium text-sm font-mono">Delete Account</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                className="font-mono border-red-200 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400 font-mono">
                  Are you absolutely sure?
                </p>
                <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </p>
              </div>

              <div>
                <Label className="text-sm font-mono" htmlFor="deleteConfirm">
                  Type{" "}
                  <span className="font-mono font-bold text-red-600">
                    DELETE
                  </span>{" "}
                  to confirm
                </Label>
                <Input
                  className="mt-2 font-mono border-red-200 dark:border-red-800 focus:border-red-400"
                  id="deleteConfirm"
                  placeholder="DELETE"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>

              {/* Delete Status */}
              {notificationsStatus !== "idle" && (
                <div
                  className={`p-3 rounded-lg text-sm font-mono ${
                    notificationsStatus === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {notificationsStatus === "success"
                    ? "Account deletion initiated"
                    : deleteConfirmText !== "DELETE"
                      ? 'Please type "DELETE" to confirm'
                      : "Failed to delete account"}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="font-mono bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                  disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                  variant="default"
                  onClick={handleDeleteAccount}
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Confirm Delete"
                  )}
                </Button>
                <Button
                  className="font-mono"
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
        </CardBody>
      </Card>
    </div>
  );
}
