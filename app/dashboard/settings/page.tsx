"use client";

import { useState, useEffect } from "react";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      showMessage("success", "Profile updated successfully!");
    } catch (error) {
      showMessage("error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsLoading(true);

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

      showMessage("success", "Notification preferences updated!");
    } catch (error) {
      showMessage("error", "Failed to update notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      showMessage("error", 'Please type "DELETE" to confirm');

      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete account");

      window.location.href = "/";
    } catch (error) {
      showMessage("error", "Failed to delete account. Please try again.");
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form className="border rounded-lg p-6" onSubmit={handleProfileUpdate}>
        <h2 className="font-mono font-semibold text-xl mb-4">
          Profile Settings
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              className="mt-2"
              id="name"
              placeholder="John Doe"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              disabled
              className="mt-2"
              id="email"
              placeholder="john@example.com"
              type="email"
              value={email}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email is managed by your OAuth provider and cannot be changed here
            </p>
          </div>
          <Button disabled={isLoading} type="submit">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your account
              </p>
            </div>
            <input
              checked={emailNotifications}
              className="w-5 h-5 cursor-pointer"
              type="checkbox"
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your devices
              </p>
            </div>
            <input
              checked={pushNotifications}
              className="w-5 h-5 cursor-pointer"
              type="checkbox"
              onChange={(e) => setPushNotifications(e.target.checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Reports</p>
              <p className="text-sm text-muted-foreground">
                Get weekly summary of your activity
              </p>
            </div>
            <input
              checked={weeklyReports}
              className="w-5 h-5 cursor-pointer"
              type="checkbox"
              onChange={(e) => setWeeklyReports(e.target.checked)}
            />
          </div>
          <Button disabled={isLoading} onClick={handleNotificationUpdate}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Security</h2>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Account Security</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your account is secured through OAuth authentication with{" "}
              {session?.user?.email?.includes("gmail")
                ? "Google"
                : "your provider"}
              . Password management is handled by your OAuth provider.
            </p>
          </div>
          <div>
            <p className="font-medium">Connected Accounts</p>
            <p className="text-sm text-muted-foreground mt-2">
              Email: {session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 border-red-200">
        <h2 className="font-mono font-semibold text-xl mb-4 text-red-600">
          Danger Zone
        </h2>
        <div className="space-y-4">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-red-600">
                  Are you absolutely sure?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </p>
              </div>
              <div>
                <Label htmlFor="deleteConfirm">
                  Type <span className="font-mono font-bold">DELETE</span> to
                  confirm
                </Label>
                <Input
                  className="mt-2"
                  id="deleteConfirm"
                  placeholder="DELETE"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={isLoading || deleteConfirmText !== "DELETE"}
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  {isLoading ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button
                  disabled={isLoading}
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
