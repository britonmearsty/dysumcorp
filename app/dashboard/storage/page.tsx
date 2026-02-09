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

        setConnections(data);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Storage</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your storage usage and manage connections
        </p>
      </div>

      {/* Storage Connections */}
      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">
          Storage Connections
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Google Drive */}
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <path d="M8 16L12 22L16 16H8Z" fill="#0066DA" />
                  <path d="M2 12L6 18H18L22 12L12 2L2 12Z" fill="#00AC47" />
                  <path d="M12 2L2 12H8L12 6L16 12H22L12 2Z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <h3 className="font-mono font-semibold">Google Drive</h3>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? "Checking..."
                    : connections.google
                      ? "Connected"
                      : "Not connected"}
                </p>
              </div>
            </div>
            <Button
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
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="#0061FF" viewBox="0 0 24 24">
                  <path d="M6 2L0 6L6 10L12 6L6 2Z" />
                  <path d="M18 2L12 6L18 10L24 6L18 2Z" />
                  <path d="M0 14L6 18L12 14L6 10L0 14Z" />
                  <path d="M12 14L18 18L24 14L18 10L12 14Z" />
                  <path d="M6 19.5L12 15.5L18 19.5L12 23.5L6 19.5Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-mono font-semibold">Dropbox</h3>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? "Checking..."
                    : connections.dropbox
                      ? "Connected"
                      : "Not connected"}
                </p>
              </div>
            </div>
            <Button
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
