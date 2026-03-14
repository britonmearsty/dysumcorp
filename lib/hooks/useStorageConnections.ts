"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface ConnectedAccount {
  provider: "google" | "dropbox";
  providerAccountId?: string;
  email?: string;
  name?: string;
  isConnected: boolean;
  storageStatus?: "ACTIVE" | "INACTIVE" | "DISCONNECTED" | "ERROR";
  hasValidOAuth?: boolean;
}

interface UseStorageConnectionsOptions {
  autoRefreshInterval?: number; // in milliseconds, default 5 minutes
  onConnectionsChange?: (connections: ConnectedAccount[]) => void;
}

/**
 * Custom hook for managing storage connections with automatic token refresh
 * Periodically checks and refreshes storage tokens to prevent disconnections
 */
export function useStorageConnections(
  options: UseStorageConnectionsOptions = {},
) {
  const {
    autoRefreshInterval = 5 * 60 * 1000, // 5 minutes default
    onConnectionsChange,
  } = options;

  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const fetchConnections = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/storage/connections");

      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }

      const data = await response.json();
      const accounts = data.accounts || [];

      setConnections(accounts);
      lastRefreshRef.current = Date.now();

      if (onConnectionsChange) {
        onConnectionsChange(accounts);
      }
    } catch (err) {
      console.error("Failed to check storage connections:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load storage connections",
      );
    } finally {
      setLoading(false);
    }
  }, [onConnectionsChange]);

  // Initial fetch
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Set up periodic refresh
  useEffect(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval for periodic refresh
    refreshIntervalRef.current = setInterval(() => {
      fetchConnections();
    }, autoRefreshInterval);

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshInterval, fetchConnections]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Debounce: don't refresh more than once per 10 seconds
    const now = Date.now();
    if (now - lastRefreshRef.current < 10000) {
      return;
    }

    await fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    loading,
    error,
    refresh,
  };
}
