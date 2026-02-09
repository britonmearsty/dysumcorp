"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Bell,
  Shield,
  User,
  Globe,
  Lock,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSwitcher } from "@/components/theme-switcher";

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
        <div className="text-muted-foreground font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-mono font-bold">SETTINGS</h1>
        <p className="text-muted-foreground font-mono mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FF6B2C]/10 flex items-center justify-center">
              <User className="h-5 w-5 text-[#FF6B2C]" />
            </div>
            <div>
              <h3 className="font-mono font-bold">PROFILE SETTINGS</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Manage your information
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleProfileUpdate}>
            <div>
              <Label className="text-sm font-mono" htmlFor="name">
                FULL NAME
              </Label>
              <Input
                className="mt-2 font-mono rounded-none border-2"
                id="name"
                placeholder="John Doe"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-mono" htmlFor="email">
                EMAIL
              </Label>
              <Input
                disabled
                className="mt-2 font-mono rounded-none border-2 opacity-60"
                id="email"
                placeholder="john@example.com"
                type="email"
                value={email}
              />
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Email is managed by your OAuth provider
              </p>
            </div>

            {profileStatus !== "idle" && (
              <div
                className={`p-3 border-2 text-sm font-mono ${
                  profileStatus === "success"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}
              >
                {profileStatus === "success"
                  ? "Profile updated successfully!"
                  : "Failed to update profile. Please try again."}
              </div>
            )}

            <Button
              className="w-full font-mono rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90"
              disabled={profileLoading}
              type="submit"
            >
              {profileLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SAVING...
                </>
              ) : (
                "SAVE CHANGES"
              )}
            </Button>
          </form>
        </div>

        {/* Notifications */}
        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-mono font-bold">NOTIFICATIONS</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Control your alerts
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border hover:border-[#FF6B2C]/50 transition-colors">
              <div>
                <p className="font-medium text-sm font-mono">
                  EMAIL NOTIFICATIONS
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Receive email updates
                </p>
              </div>
              <input
                checked={emailNotifications}
                className="w-5 h-5 cursor-pointer accent-[#FF6B2C]"
                type="checkbox"
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-border hover:border-[#FF6B2C]/50 transition-colors">
              <div>
                <p className="font-medium text-sm font-mono">
                  PUSH NOTIFICATIONS
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Browser notifications
                </p>
              </div>
              <input
                checked={pushNotifications}
                className="w-5 h-5 cursor-pointer accent-[#FF6B2C]"
                type="checkbox"
                onChange={(e) => setPushNotifications(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-border hover:border-[#FF6B2C]/50 transition-colors">
              <div>
                <p className="font-medium text-sm font-mono">WEEKLY REPORTS</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Activity summaries
                </p>
              </div>
              <input
                checked={weeklyReports}
                className="w-5 h-5 cursor-pointer accent-[#FF6B2C]"
                type="checkbox"
                onChange={(e) => setWeeklyReports(e.target.checked)}
              />
            </div>

            {notificationsStatus !== "idle" && (
              <div
                className={`p-3 border-2 text-sm font-mono ${
                  notificationsStatus === "success"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}
              >
                {notificationsStatus === "success"
                  ? "Notifications updated successfully!"
                  : "Failed to update notifications. Please try again."}
              </div>
            )}

            <Button
              className="w-full font-mono rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90"
              disabled={notificationsLoading}
              onClick={handleNotificationUpdate}
            >
              {notificationsLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SAVING...
                </>
              ) : (
                "SAVE PREFERENCES"
              )}
            </Button>
          </div>
        </div>

        {/* Appearance */}
        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-mono font-bold">APPEARANCE</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Customize interface
              </p>
            </div>
          </div>

          <ThemeSwitcher />
        </div>

        {/* Security */}
        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-mono font-bold">SECURITY</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Account protection
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 border border-border">
              <p className="font-medium text-sm font-mono">
                AUTHENTICATION METHOD
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                OAuth via{" "}
                {session?.user?.email?.includes("gmail")
                  ? "Google"
                  : "Provider"}
              </p>
            </div>

            <div className="p-3 border border-border">
              <p className="font-medium text-sm font-mono">CONNECTED EMAIL</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {session?.user?.email}
              </p>
            </div>

            <div className="p-3 bg-green-500/10 border-2 border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500 h-4 w-4" />
                <p className="text-sm font-mono text-green-500">
                  ACCOUNT SECURED BY OAUTH
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone - Full Width */}
      <div className="border-2 border-red-500/50 bg-background p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-red-500">DANGER ZONE</h3>
            <p className="text-sm text-red-500 font-mono">
              Irreversible actions
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <div className="flex items-center justify-between p-4 border-2 border-red-500/50 bg-red-500/5">
            <div>
              <p className="font-medium text-sm font-mono">DELETE ACCOUNT</p>
              <p className="text-xs text-red-500 font-mono mt-1">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              className="font-mono rounded-none border-2 border-red-500 text-red-500 hover:bg-red-500/10"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
            >
              DELETE ACCOUNT
            </Button>
          </div>
        ) : (
          <div className="space-y-4 p-4 border-2 border-red-500/50 bg-red-500/5">
            <div>
              <p className="font-medium text-red-500 font-mono">
                ARE YOU ABSOLUTELY SURE?
              </p>
              <p className="text-sm text-red-500 font-mono mt-2">
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </p>
            </div>

            <div>
              <Label className="text-sm font-mono" htmlFor="deleteConfirm">
                Type{" "}
                <span className="font-mono font-bold text-red-500">DELETE</span>{" "}
                to confirm
              </Label>
              <Input
                className="mt-2 font-mono rounded-none border-2 border-red-500/50 focus:border-red-500"
                id="deleteConfirm"
                placeholder="DELETE"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>

            {notificationsStatus !== "idle" && (
              <div
                className={`p-3 border-2 text-sm font-mono ${
                  notificationsStatus === "success"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}
              >
                {notificationsStatus === "success"
                  ? "ACCOUNT DELETION INITIATED"
                  : deleteConfirmText !== "DELETE"
                    ? 'PLEASE TYPE "DELETE" TO CONFIRM'
                    : "FAILED TO DELETE ACCOUNT"}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="font-mono rounded-none bg-red-500 text-white hover:bg-red-600"
                disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                variant="default"
                onClick={handleDeleteAccount}
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    DELETING...
                  </>
                ) : (
                  "CONFIRM DELETE"
                )}
              </Button>
              <Button
                className="font-mono rounded-none border-2"
                disabled={deleteLoading}
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setNotificationsStatus("idle");
                }}
              >
                CANCEL
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
