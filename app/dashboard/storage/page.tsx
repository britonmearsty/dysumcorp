"use client";

import { useEffect, useState } from "react";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface ConnectionStatus {
  google: boolean;
  dropbox: boolean;
}

export default function StoragePage() {
  const [connections, setConnections] = useState<ConnectionStatus>({
    google: false,
    dropbox: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const response = await fetch("/api/storage/connections");

      if (response.ok) {
        const data = await response.json();
        
        // Transform new API format to old format for this page
        const googleAccount = data.accounts?.find((a: any) => a.provider === "google");
        const dropboxAccount = data.accounts?.find((a: any) => a.provider === "dropbox");

        setConnections({
          google: googleAccount?.isConnected || false,
          dropbox: dropboxAccount?.isConnected || false,
        });
      }
    } catch (error) {
      console.error("Failed to check connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: "google" | "dropbox") => {
    setActionLoading(provider);
    try {
      await signIn.social({
        provider,
        callbackURL: "/dashboard/storage",
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (provider: "google" | "dropbox") => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${provider === "google" ? "Google Drive" : "Dropbox"}?`,
      )
    ) {
      return;
    }

    setActionLoading(provider);
    try {
      const response = await fetch("/api/storage/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        setConnections((prev) => ({ ...prev, [provider]: false }));
      } else {
        alert("Failed to disconnect. Please try again.");
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Storage
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Monitor your storage usage and manage connections
        </p>
      </div>

      {/* Storage Connections */}
      <div className="bg-bg-card rounded-[12px] border border-border p-6 shadow-sm">
        <h2 className="font-semibold text-xl mb-6 text-foreground">
          Storage Connections
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Google Drive */}
          <div className="bg-bg-card rounded-[12px] p-6 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bg-card border border-border flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Google Drive</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loading
                      ? "Checking..."
                      : connections.google
                        ? "Connected"
                        : "Not connected"}
                  </p>
                </div>
              </div>
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={loading || actionLoading === "google"}
              size="sm"
              variant={connections.google ? "outline" : "default"}
              onClick={() =>
                connections.google
                  ? handleDisconnect("google")
                  : handleConnect("google")
              }
            >
              {actionLoading === "google"
                ? "Loading..."
                : connections.google
                  ? "Disconnect"
                  : "Connect"}
            </Button>
          </div>

          {/* Dropbox */}
          <div className="bg-bg-card rounded-[12px] p-6 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bg-card border border-border flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7" fill="#0061FF" viewBox="0 0 24 24">
                    <path d="M6 2L0 6L6 10L12 6L6 2Z" />
                    <path d="M18 2L12 6L18 10L24 6L18 2Z" />
                    <path d="M0 14L6 18L12 14L6 10L0 14Z" />
                    <path d="M12 14L18 18L24 14L18 10L12 14Z" />
                    <path d="M6 19.5L12 15.5L18 19.5L12 23.5L6 19.5Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Dropbox</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loading
                      ? "Checking..."
                      : connections.dropbox
                        ? "Connected"
                        : "Not connected"}
                  </p>
                </div>
              </div>
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={loading || actionLoading === "dropbox"}
              size="sm"
              variant={connections.dropbox ? "outline" : "default"}
              onClick={() =>
                connections.dropbox
                  ? handleDisconnect("dropbox")
                  : handleConnect("dropbox")
              }
            >
              {actionLoading === "dropbox"
                ? "Loading..."
                : connections.dropbox
                  ? "Disconnect"
                  : "Connect"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
