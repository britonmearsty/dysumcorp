"use client";

import { useEffect, useState } from "react";
import {
  Type,
  Palette,
  Cloud,
  Lock,
  Settings2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  FolderOpen,
  Hash,
  XIcon,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePaywall } from "@/components/paywall-modal";
import { PlanType } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
import { validateSlug, sanitizeSlug } from "@/lib/slug-validation";
import { useStorageConnections } from "@/lib/hooks/useStorageConnections";

type Step = "identity" | "branding" | "storage" | "security" | "messaging";

interface ConnectedAccount {
  provider: "google" | "dropbox";
  providerAccountId?: string;
  email?: string;
  name?: string;
  isConnected: boolean;
  storageAccountId?: string;
  storageStatus?: "ACTIVE" | "INACTIVE" | "DISCONNECTED" | "ERROR";
  hasValidOAuth?: boolean;
}

interface StorageFolder {
  id: string;
  name: string;
  path: string;
  subfolders?: StorageFolder[];
}

interface FolderNodeProps {
  folder: StorageFolder;
  navigateToFolder: (folder: StorageFolder) => void;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  selectedFolderId?: string;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  navigateToFolder,
  expandedFolders,
  toggleFolder,
  selectedFolderId,
}) => {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const { subfolders = [] } = folder;

  return (
    <div className="pl-4">
      <div
        className={`flex items-center justify-between py-2 hover:bg-muted/50 transition-colors group rounded-lg pr-2 ${
          isSelected ? "bg-primary/10 border-l-2 border-primary" : ""
        }`}
      >
        <button
          className="flex items-center gap-2 text-left flex-1"
          type="button"
          onClick={() => navigateToFolder(folder)}
        >
          <FolderOpen
            className={`w-4 h-4 flex-shrink-0 ${
              isSelected ? "text-primary" : "text-warning"
            }`}
          />
          <span
            className={`text-sm font-medium truncate ${
              isSelected
                ? "text-primary font-semibold"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {folder.name}
          </span>
          {isSelected && (
            <CheckCircle2 className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
          )}
        </button>

        {subfolders.length > 0 && (
          <button
            className="p-1 hover:bg-muted rounded-md transition-colors"
            type="button"
            onClick={() => toggleFolder(folder.id)}
          >
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>

      {isExpanded && subfolders.length > 0 && (
        <div className="pl-4 border-l border-border ml-2">
          {subfolders.map((sub: StorageFolder) => (
            <FolderNode
              key={sub.id}
              expandedFolders={expandedFolders}
              folder={sub}
              navigateToFolder={navigateToFolder}
              selectedFolderId={selectedFolderId}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Storage Section Component
interface StorageSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  setCurrentStep: (step: Step) => void;
  folderPath: StorageFolder[];
  setFolderPath: (path: StorageFolder[]) => void;
  folders: StorageFolder[];
  setFolders: (folders: StorageFolder[]) => void;
  hasUserSelectedFolder: boolean;
  setHasUserSelectedFolder: (val: boolean) => void;
  expandedFolders: Set<string>;
  setExpandedFolders: (val: Set<string>) => void;
}

const StorageSection: React.FC<StorageSectionProps> = ({
  formData,
  updateFormData,
  setCurrentStep,
  folderPath,
  setFolderPath,
  folders,
  setFolders,
  hasUserSelectedFolder,
  setHasUserSelectedFolder,
  expandedFolders,
  setExpandedFolders,
}) => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);
  const [healthCheckResults, setHealthCheckResults] = useState<any>(null);

  // Use the custom hook for automatic token refresh
  const { connections: storageConnections, loading: loadingAccounts } =
    useStorageConnections({
      autoRefreshInterval: 4 * 60 * 1000, // Refresh every 4 minutes
    });

  // Update local accounts state when storage connections change
  useEffect(() => {
    setAccounts(storageConnections);
  }, [storageConnections]);

  // Auto-initialize storage when accounts are loaded - prefer connected accounts
  useEffect(() => {
    if (
      !loadingAccounts &&
      accounts.length > 0 &&
      !hasUserSelectedFolder &&
      (!formData.storageProvider ||
        (!loadingFolders && folders.length === 0 && folderPath.length === 0))
    ) {
      // Find first connected account, prefer Google Drive if available
      const connectedAccounts = accounts.filter(
        (a) => a.storageStatus === "ACTIVE" && a.isConnected,
      );

      if (connectedAccounts.length > 0) {
        // Prefer Google Drive if available, otherwise use first connected account
        const preferredAccount =
          connectedAccounts.find((a) => a.provider === "google") ||
          connectedAccounts[0];

        if (preferredAccount) {
          const storageProvider =
            preferredAccount.provider === "google" ? "google_drive" : "dropbox";

          selectStorageProvider(storageProvider);
        }
      }
    }
  }, [
    loadingAccounts,
    accounts,
    formData.storageProvider,
    folders.length,
    folderPath.length,
    hasUserSelectedFolder,
  ]);

  async function selectStorageProvider(provider: "google_drive" | "dropbox") {
    setHasUserSelectedFolder(true);
    updateFormData("storageProvider", provider);
    updateFormData("storageFolderId", "");
    updateFormData("storageFolderPath", "");
    setFolders([]);
    setFolderPath([]);
    setLoadingFolders(true);

    try {
      if (provider === "google_drive") {
        // Google Drive: start at Dysumcorp folder
        const rootRes = await fetch(
          `/api/storage/list?provider=${provider}&rootOnly=true`,
        );

        if (rootRes.ok) {
          const rootFolder = await rootRes.json();

          if (rootFolder && rootFolder.id) {
            // Now fetch Dysumcorp folder from root
            const dysumRes = await fetch(
              `/api/storage/list?provider=${provider}&parentFolderId=${rootFolder.id}`,
            );

            if (dysumRes.ok) {
              const subfolders = await dysumRes.json();
              // Find Dysumcorp folder (case-insensitive)
              let dysumFolder = subfolders.find(
                (f: StorageFolder) => f.name.toLowerCase() === "dysumcorp",
              );

              if (!dysumFolder) {
                // Dysumcorp doesn't exist, create it
                try {
                  const createRes = await fetch("/api/storage/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      provider: "google_drive",
                      parentFolderId: rootFolder.id,
                      folderName: "Dysumcorp",
                    }),
                  });

                  if (createRes.ok) {
                    dysumFolder = await createRes.json();
                  }
                } catch (error) {
                  logger.error("Error creating Dysumcorp folder:", error);
                }
              }

              if (dysumFolder) {
                // Set breadcrumb to show: My Drive > Dysumcorp
                setFolderPath([rootFolder, dysumFolder]);
                updateFormData("storageFolderId", dysumFolder.id);
                updateFormData(
                  "storageFolderPath",
                  `${rootFolder.path}/${dysumFolder.name}`,
                );
                // Load subfolders of Dysumcorp
                await fetchFolders(provider, dysumFolder.id);
              } else {
                // Fallback to root if creation failed
                setFolderPath([rootFolder]);
                updateFormData("storageFolderId", rootFolder.id);
                updateFormData("storageFolderPath", rootFolder.path);
                await fetchFolders(provider, rootFolder.id);
              }
            } else {
              // Fallback to root
              setFolderPath([rootFolder]);
              updateFormData("storageFolderId", rootFolder.id);
              updateFormData("storageFolderPath", rootFolder.path);
              await fetchFolders(provider, rootFolder.id);
            }
          }
        }
      } else {
        // Dropbox: list root folders, find/create dysumcorp
        const rootRes = await fetch(
          `/api/storage/list?provider=${provider}&rootOnly=true`,
        );

        if (rootRes.ok) {
          const rootFolder = await rootRes.json();

          // Dropbox root has id: "" (empty string) which is falsy, so check for name instead
          if (rootFolder && rootFolder.name) {
            // List root-level folders to find dysumcorp
            const rootListRes = await fetch(
              `/api/storage/list?provider=${provider}`,
            );

            let dysumFolder: StorageFolder | undefined;

            if (rootListRes.ok) {
              const rootFolders = await rootListRes.json();

              // Find dysumcorp folder (case-insensitive)
              dysumFolder = rootFolders.find(
                (f: StorageFolder) => f.name.toLowerCase() === "dysumcorp",
              );
            }

            if (!dysumFolder) {
              // dysumcorp doesn't exist, create it at root
              try {
                const createRes = await fetch("/api/storage/upload", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    provider: "dropbox",
                    parentFolderId: "",
                    folderName: "dysumcorp",
                  }),
                });

                if (createRes.ok) {
                  dysumFolder = await createRes.json();
                }
              } catch (error) {
                logger.error("Error creating dysumcorp folder:", error);
              }
            }

            if (dysumFolder && dysumFolder.id) {
              // Set breadcrumb to show: Dropbox > dysumcorp
              setFolderPath([rootFolder, dysumFolder]);
              updateFormData("storageFolderId", dysumFolder.id);
              updateFormData(
                "storageFolderPath",
                dysumFolder.path || "/dysumcorp",
              );
              // Load subfolders of dysumcorp
              await fetchFolders(provider, dysumFolder.id);
            } else {
              // Fallback to root if creation failed
              setFolderPath([rootFolder]);
              updateFormData("storageFolderId", rootFolder.id);
              updateFormData("storageFolderPath", rootFolder.path);
              await fetchFolders(provider, rootFolder.id);
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error initializing storage:", error);
    } finally {
      setLoadingFolders(false);
    }
  }

  async function fetchFolders(provider: string, parentFolderId?: string) {
    setLoadingFolders(true);
    try {
      const params = new URLSearchParams({ provider });

      if (parentFolderId) {
        params.set("parentFolderId", parentFolderId);
      }
      const res = await fetch(`/api/storage/list?${params}`);

      if (res.ok) {
        const data = await res.json();

        setFolders(data);
      }
    } catch (error) {
      logger.error("Error fetching folders:", error);
    } finally {
      setLoadingFolders(false);
    }
  }

  const [folderError, setFolderError] = useState<string | null>(null);

  async function handleCreateFolder() {
    if (!newFolderName.trim() || !formData.storageProvider) return;

    setFolderError(null);
    setLoadingFolders(true);
    try {
      const parentId =
        folderPath.length > 0
          ? folderPath[folderPath.length - 1].id
          : undefined;
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formData.storageProvider,
          folderName: newFolderName,
          parentFolderId: parentId,
        }),
      });

      if (res.ok) {
        const newFolder = await res.json();

        setNewFolderName("");
        setIsCreatingFolder(false);
        await fetchFolders(formData.storageProvider, parentId);
        navigateToFolder(newFolder);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to create folder";

        if (errorMessage.includes("token expired") || res.status === 403) {
          setFolderError(
            "Storage connection expired. Please refresh the page and try again.",
          );
          // Token will be refreshed automatically by the hook
        } else {
          setFolderError(errorMessage);
        }
      }
    } catch (error) {
      logger.error("Error creating folder:", error);
      setFolderError("An unexpected error occurred");
    } finally {
      setLoadingFolders(false);
    }
  }

  function navigateToBreadcrumb(index: number) {
    const newPath = folderPath.slice(0, index + 1);
    const currentFolder = newPath[newPath.length - 1];

    setFolderPath(newPath);
    updateFormData("storageFolderId", currentFolder.id);
    updateFormData("storageFolderPath", currentFolder.path);
    fetchFolders(formData.storageProvider, currentFolder.id);
  }

  function navigateToFolder(folder: StorageFolder) {
    const newPath = [...folderPath, folder];

    setFolderPath(newPath);
    updateFormData("storageFolderId", folder.id);
    updateFormData("storageFolderPath", newPath.map((f) => f.name).join("/"));
    fetchFolders(formData.storageProvider, folder.id);
  }

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);

    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedFolders(newSet);
  };

  async function runStorageHealthCheck() {
    setIsRunningHealthCheck(true);
    setHealthCheckResults(null);

    try {
      const response = await fetch("/api/storage/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setHealthCheckResults(data);

      if (data.success && data.createdAccounts > 0) {
        // Accounts will be refreshed automatically by the hook
      }
    } catch (error) {
      setHealthCheckResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRunningHealthCheck(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Storage Account Status Warning - only show when BOTH storage accounts are disconnected */}
      {accounts.length >= 2 &&
        accounts.every((a) => a.storageStatus === "DISCONNECTED") && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">
                  Storage Accounts Disconnected
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Both your storage accounts (Google Drive and Dropbox) are
                  disconnected. Please reconnect at least one to continue.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    className="inline-flex items-center gap-2 px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors"
                    href="/dashboard/storage"
                  >
                    Reconnect Storage
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Go to Storage page to reconnect your accounts
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Storage Provider Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[
          {
            id: "google_drive",
            name: "Google Drive",
            icon: Cloud,
            disabled: !accounts.find(
              (a) => a.provider === "google" && a.storageStatus === "ACTIVE",
            ),
          },
          {
            id: "dropbox",
            name: "Dropbox",
            icon: Cloud,
            disabled: !accounts.find(
              (a) => a.provider === "dropbox" && a.storageStatus === "ACTIVE",
            ),
          },
        ].map((provider) => {
          const Icon = provider.icon;
          const isActive = formData.storageProvider === provider.id;
          const account = accounts.find(
            (a) =>
              (a.provider === "google" ? "google_drive" : "dropbox") ===
              provider.id,
          );
          const hasAccount = !!account;

          return (
            <button
              key={provider.id}
              className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                isActive
                  ? "border-primary bg-muted"
                  : "border-border bg-card hover:border-muted-foreground hover:bg-muted"
              } ${provider.disabled ? "opacity-40 grayscale cursor-not-allowed" : ""}`}
              disabled={provider.disabled}
              type="button"
              onClick={() =>
                selectStorageProvider(provider.id as "google_drive" | "dropbox")
              }
            >
              <div
                className={`p-3 rounded-xl ${isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-foreground block">
                  {provider.name}
                </span>
                {hasAccount && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        account.storageStatus === "ACTIVE"
                          ? "bg-green-500"
                          : account.storageStatus === "DISCONNECTED"
                            ? "bg-red-500"
                            : account.storageStatus === "ERROR"
                              ? "bg-orange-500 animate-pulse"
                              : "bg-yellow-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        account.storageStatus === "ACTIVE"
                          ? "text-green-600"
                          : account.storageStatus === "DISCONNECTED"
                            ? "text-red-600"
                            : account.storageStatus === "ERROR"
                              ? "text-orange-600"
                              : "text-yellow-600"
                      }`}
                    >
                      {account.storageStatus === "ACTIVE"
                        ? "Ready"
                        : account.storageStatus === "DISCONNECTED"
                          ? "Disconnected"
                          : account.storageStatus === "ERROR"
                            ? "Error"
                            : "Inactive"}
                    </span>
                  </div>
                )}
                {!hasAccount && (
                  <span className="text-xs text-muted-foreground mt-1 block">
                    Not connected
                  </span>
                )}
              </div>
              {isActive && (
                <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {/* Health Check Results */}
      {healthCheckResults && (
        <div
          className={`rounded-xl p-4 border ${
            healthCheckResults.success
              ? "bg-success/10 border-success/20"
              : "bg-destructive/10 border-destructive/20"
          }`}
        >
          <div className="flex items-start gap-3">
            {healthCheckResults.success ? (
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                {healthCheckResults.success
                  ? "Health Check Complete"
                  : "Health Check Failed"}
              </h4>
              {healthCheckResults.success ? (
                <p className="text-sm text-muted-foreground">
                  Checked {healthCheckResults.checkedAccounts || 0} accounts,
                  created {healthCheckResults.createdAccounts || 0} new
                  accounts.
                  {healthCheckResults.createdAccounts > 0 &&
                    " Storage accounts have been automatically created."}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {healthCheckResults.error ||
                    "Unknown error occurred during health check."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Folder Navigation Tree */}
      <div className="bg-muted border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Navigation Tree
            </span>
            <button
              className="flex items-center gap-1.5 px-3 py-1 bg-card border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all shadow-sm"
              type="button"
              onClick={() => {
                setIsCreatingFolder(true);
                setNewFolderName(formData.portalName || "New Portal Folder");
              }}
            >
              <FolderOpen className="w-3 h-3 text-warning" />
              New Folder
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              className="p-1.5 hover:bg-card rounded-md transition-colors"
              type="button"
              onClick={() => selectStorageProvider(formData.storageProvider)}
            >
              <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {folderPath.map((folder, idx) => (
              <div key={folder.id} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="w-3 h-3 text-muted" />
                <button
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    idx === folderPath.length - 1
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => navigateToBreadcrumb(idx)}
                >
                  {folder.name}
                </button>
              </div>
            ))}
            {formData.useClientFolders && (
              <>
                <ChevronRight className="w-3 h-3 text-muted" />
                <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-primary/20 text-primary">
                  [client name]
                </span>
              </>
            )}
          </div>
        </div>

        <div>
          <Dialog
            open={isCreatingFolder}
            onOpenChange={(open) => {
              if (!open) {
                setIsCreatingFolder(false);
                setFolderError(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Enter a name for the new folder in your storage.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <input
                  autoFocus
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-ring outline-none text-foreground"
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                {folderError && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>{folderError}</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setFolderError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!newFolderName.trim() || loadingFolders}
                  onClick={handleCreateFolder}
                >
                  {loadingFolders ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Folder"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="max-h-72 overflow-y-auto p-2 bg-card">
            {loadingFolders ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Syncing Directory...
                </p>
              </div>
            ) : folders.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-muted rounded-full">
                  <FolderOpen className="w-5 h-5 text-muted" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">
                  Sector is empty
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {folders.map((folder) => (
                  <FolderNode
                    key={folder.id}
                    expandedFolders={expandedFolders}
                    folder={folder}
                    navigateToFolder={navigateToFolder}
                    selectedFolderId={formData.storageFolderId}
                    toggleFolder={toggleFolder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/50">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                checked={formData.useClientFolders}
                className="peer sr-only"
                type="checkbox"
                onChange={(e) =>
                  updateFormData("useClientFolders", e.target.checked)
                }
              />
              <div className="w-10 h-5 bg-muted-foreground/20 rounded-full peer peer-checked:bg-primary transition-colors" />
              <div className="absolute left-1 top-1 w-3 h-3 bg-card rounded-full peer-checked:translate-x-5 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                Client Isolation Mode
              </span>
              <span className="text-[9px] text-muted-foreground font-medium">
                Automatic sub-directory generation for each transmission
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
        <div />
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
            type="button"
            onClick={() => setCurrentStep("messaging")}
          >
            Jump to Finish
          </button>
          <button
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
            type="button"
            onClick={() => setCurrentStep("security")}
          >
            Next: Security
          </button>
        </div>
      </div>
    </div>
  );
};

// Security Section Component
interface SecuritySectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  setCurrentStep: (step: Step) => void;
  error: string;
  setError: (error: string) => void;
  showPassword?: boolean;
  setShowPassword?: (show: boolean) => void;
}

const FILE_TYPE_OPTIONS = [
  { label: "Images (JPG, PNG, GIF)", value: "image/*" },
  {
    label: "Documents (PDF, DOC)",
    value:
      "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    label: "Spreadsheets (XLS, CSV)",
    value:
      "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
  },
  {
    label: "Archives (ZIP, RAR, 7Z, TAR, GZ)",
    value:
      "application/zip,application/x-rar-compressed,application/x-7z-compressed,application/x-tar,application/gzip,application/x-gzip,application/x-bzip2,application/x-xz,application/force-download,archive/*",
  },
  { label: "Videos (MP4, MOV)", value: "video/*" },
  { label: "Audio (MP3, WAV)", value: "audio/*" },
  { label: "Text/Code Files (TXT, MD, JS)", value: "text/*" },
];

const SecuritySection: React.FC<SecuritySectionProps> = ({
  formData,
  updateFormData,
  setCurrentStep,
  error,
  setError,
  showPassword = false,
  setShowPassword = () => {},
}) => {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Max Payload (MB)
          </label>

          {/* File Size Templates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {[
              {
                size: 10,
                label: "Small",
                description: "Documents & images",
              },
              {
                size: 50,
                label: "Medium",
                description: "Presentations & videos",
              },
              {
                size: 200,
                label: "Large",
                description: "High-res media & archives",
              },
            ].map((template) => (
              <button
                key={template.size}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.maxFileSize === template.size
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                }`}
                type="button"
                onClick={() => {
                  updateFormData("maxFileSize", template.size);
                  if (error.includes("Maximum file size must be specified")) {
                    setError("");
                  }
                }}
              >
                <div className="font-bold text-lg">{template.size}MB</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                  {template.label}
                </div>
                <div className="text-[9px] opacity-60 mt-1">
                  {template.description}
                </div>
              </button>
            ))}
          </div>

          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className={`w-full pl-10 pr-4 py-3 bg-card border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground ${!formData.maxFileSize ? "border-warning" : "border-border"}`}
              placeholder="Custom size..."
              type="number"
              value={formData.maxFileSize}
              onChange={(e) => {
                const newSize =
                  e.target.value === "" ? 0 : parseInt(e.target.value) || 0;

                updateFormData("maxFileSize", newSize);
                if (
                  newSize > 0 &&
                  error.includes("Maximum file size must be specified")
                ) {
                  setError("");
                }
              }}
            />
          </div>
          {!formData.maxFileSize && (
            <p className="text-[10px] text-warning font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Please specify a capacity limit
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Access Passkey
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-12 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground"
              placeholder="Set new key..."
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
            />
            {formData.password && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Recommendation: Use a strong password with uppercase, numbers, and
            special characters for better security.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Client Data Requirements
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {[
            {
              id: "name",
              label: "Identity (Name)",
              key: "requireClientName",
            },
            {
              id: "email",
              label: "Contact (Email)",
              key: "requireClientEmail",
            },
          ].map((req) => (
            <button
              key={req.id}
              className={`flex-1 px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                formData[req.key as keyof typeof formData]
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
              }`}
              type="button"
              onClick={() =>
                updateFormData(
                  req.key,
                  !formData[req.key as keyof typeof formData],
                )
              }
            >
              {req.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-foreground">
            Allowed File Types
          </label>
          <button
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            type="button"
            onClick={() => {
              const allTypes = FILE_TYPE_OPTIONS.map((opt) => opt.value);
              const allSelected = allTypes.every((type) =>
                formData.allowedFileTypes.includes(type),
              );

              if (allSelected) {
                updateFormData("allowedFileTypes", []);
              } else {
                updateFormData("allowedFileTypes", allTypes);
              }
            }}
          >
            {FILE_TYPE_OPTIONS.every((opt) =>
              formData.allowedFileTypes.includes(opt.value),
            )
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted p-4 rounded-xl border border-border">
          {FILE_TYPE_OPTIONS.map((opt) => {
            const isSelected = formData.allowedFileTypes.includes(opt.value);

            return (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-card cursor-pointer transition-colors"
              >
                <input
                  checked={isSelected}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  type="checkbox"
                  onChange={() =>
                    updateFormData(
                      "allowedFileTypes",
                      isSelected
                        ? formData.allowedFileTypes.filter(
                            (v: string) => v !== opt.value,
                          )
                        : [...formData.allowedFileTypes, opt.value],
                    )
                  }
                />
                <span
                  className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {opt.label.split(" (")[0]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
        <div />
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
            type="button"
            onClick={() => setCurrentStep("messaging")}
          >
            Jump to Finish
          </button>
          <button
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
            type="button"
            onClick={() => setCurrentStep("messaging")}
          >
            Next: Messaging
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CreatePortalPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showPaywall, PaywallModal } = usePaywall();
  const [currentStep, setCurrentStep] = useState<Step>("identity");
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Storage section state lifted here to survive step navigation
  const [storageFolderPath, setStorageFolderPath] = useState<StorageFolder[]>(
    [],
  );
  const [storageFolders, setStorageFolders] = useState<StorageFolder[]>([]);
  const [storageHasUserSelected, setStorageHasUserSelected] = useState(false);
  const [storageExpandedFolders, setStorageExpandedFolders] = useState<
    Set<string>
  >(new Set());
  const [expandedSections, setExpandedSections] = useState<{
    welcomeMessage: boolean;
    welcomeToast: boolean;
    textboxSection: boolean;
  }>({
    welcomeMessage: false,
    welcomeToast: false,
    textboxSection: false,
  });

  // Constants for default messages
  const DEFAULT_WELCOME_MESSAGE =
    "Send us your files securely — we'll take it from here.\nFill in your details and attach the files you'd like to share with our team. All uploads are encrypted and handled with care.";
  const DEFAULT_WELCOME_TOAST =
    "👋 Welcome! Please fill in your details and upload your files.";

  // Slug validation state
  const [slugValidation, setSlugValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    error?: string;
    isAvailable?: boolean;
  }>({
    isValid: false,
    isChecking: false,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Identity
    portalName: "",
    portalUrl: "",

    // Branding
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    textColor: "#1e293b",
    backgroundColor: "#f1f5f9",
    cardBackgroundColor: "#ffffff",
    gradientEnabled: true,
    logo: null as File | null,
    companyWebsite: "",
    companyEmail: "",

    // Storage
    storageProvider: "google_drive" as "google_drive" | "dropbox",
    storageFolderId: "",
    storageFolderPath: "",
    useClientFolders: false,

    // Security
    password: "",
    requireClientName: true,
    requireClientEmail: false,
    maxFileSize: 50,
    allowedFileTypes: [
      "image/*",
      "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
      "application/zip,application/x-rar-compressed,application/x-7z-compressed",
      "video/*",
      "audio/*",
      "text/*",
    ] as string[], // Default: All file types

    // Messaging
    welcomeMessage: "",
    welcomeToastMessage: "",
    welcomeToastDelay: 1000,
    welcomeToastDuration: 3000,
    submitButtonText: "Initialize Transfer",
    successMessage: "Transmission Verified",
    textboxSectionEnabled: false,
    textboxSectionTitle: "",
    textboxSectionPlaceholder: "",
    textboxSectionRequired: false,
  });

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: "identity", label: "Identity", icon: Type },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "storage", label: "Storage", icon: Cloud },
    { id: "security", label: "Security", icon: Lock },
    { id: "messaging", label: "Messaging", icon: Settings2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const [hasCreatedTrialPortal, setHasCreatedTrialPortal] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    if (!session?.user?.id) {
      setIsLoadingPlan(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/plan-limits?userId=${session.user.id}`,
      );
      const data = await response.json();

      if (response.ok) {
        setUserPlan(data.planType);
        // REVERSIBILITY: Remove this check to revert trial feature
        if (data.planType === "free" && data.hasCreatedTrialPortal) {
          setHasCreatedTrialPortal(true);
        }
      } else {
        logger.error("Failed to fetch user plan:", data.error);
      }
    } catch (error) {
      logger.error("Failed to fetch user plan:", error);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle logo file selection and validation
  const handleLogoSelect = (file: File | null) => {
    if (!file) {
      updateFormData("logo", null);
      setLogoPreview(null);

      return;
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      setError(
        "Invalid file type. Please upload an image (JPG, PNG, GIF, SVG, or WebP)",
      );

      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    if (file.size > maxSize) {
      setError("File too large. Maximum size is 5MB");

      return;
    }

    // Update form data and preview
    updateFormData("logo", file);
    const reader = new FileReader();

    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload logo to Cloudinary
  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("folder", "portals");

      const response = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to upload logo");
      }

      const data = await response.json();

      if (data.url) {
        return data.url;
      }

      throw new Error("No file URL returned from upload");
    } catch (error) {
      logger.error("Logo upload error:", error);
      throw error;
    }
  };

  // Debounced slug validation
  useEffect(() => {
    const checkSlug = async () => {
      const slug = formData.portalUrl;

      if (!slug) {
        setSlugValidation({ isValid: false, isChecking: false });

        return;
      }

      // First, validate format
      const formatValidation = validateSlug(slug);

      if (!formatValidation.isValid) {
        setSlugValidation({
          isValid: false,
          isChecking: false,
          error: formatValidation.error,
        });

        return;
      }

      // Then check availability
      setSlugValidation({ isValid: false, isChecking: true });

      try {
        const response = await fetch(
          `/api/portals/check-slug?slug=${encodeURIComponent(slug)}`,
        );
        const data = await response.json();

        if (data.available && data.valid) {
          setSlugValidation({
            isValid: true,
            isChecking: false,
            isAvailable: true,
          });
        } else {
          setSlugValidation({
            isValid: false,
            isChecking: false,
            error: data.error,
            isAvailable: false,
          });
        }
      } catch (error) {
        logger.error("Error checking slug:", error);
        setSlugValidation({
          isValid: false,
          isChecking: false,
          error: "Failed to check slug availability",
        });
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkSlug, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.portalUrl]);

  // Auto-generate slug from portal name
  const handleNameChange = (name: string) => {
    updateFormData("portalName", name);

    // Auto-generate slug if it's empty or matches the previous name
    if (
      !formData.portalUrl ||
      formData.portalUrl === sanitizeSlug(formData.portalName)
    ) {
      const newSlug = sanitizeSlug(name);

      updateFormData("portalUrl", newSlug);
    }
  };

  // Section validation functions
  const validateIdentitySection = (): boolean => {
    return !!(
      formData.portalName.trim() &&
      formData.portalUrl.trim() &&
      slugValidation.isValid
    );
  };

  const validateBrandingSection = (): boolean => {
    // Branding is optional, so always valid
    return true;
  };

  const validateStorageSection = (): boolean => {
    return !!(
      formData.storageProvider &&
      formData.storageFolderId &&
      formData.storageFolderPath
    );
  };

  const validateSecuritySection = (): boolean => {
    return !!(
      formData.maxFileSize &&
      formData.maxFileSize > 0 &&
      formData.allowedFileTypes.length > 0
    );
  };

  const validateMessagingSection = (): boolean => {
    // Messaging has defaults, so always valid
    return true;
  };

  // Get section completion status
  const getSectionStatus = (
    sectionId: Step,
  ): "complete" | "incomplete" | "current" => {
    if (sectionId === currentStep) return "current";

    switch (sectionId) {
      case "identity":
        return validateIdentitySection() ? "complete" : "incomplete";
      case "branding":
        return validateBrandingSection() ? "complete" : "incomplete";
      case "storage":
        return validateStorageSection() ? "complete" : "incomplete";
      case "security":
        return validateSecuritySection() ? "complete" : "incomplete";
      case "messaging":
        return validateMessagingSection() ? "complete" : "incomplete";
      default:
        return "incomplete";
    }
  };

  // Check if can proceed to next section
  const canProceedToSection = (targetSection: Step): boolean => {
    const sections: Step[] = [
      "identity",
      "branding",
      "storage",
      "security",
      "messaging",
    ];
    const currentIndex = sections.indexOf(currentStep);
    const targetIndex = sections.indexOf(targetSection);

    // Can always go back
    if (targetIndex < currentIndex) return true;

    // Can go forward if current section is valid
    switch (currentStep) {
      case "identity":
        return validateIdentitySection();
      case "branding":
        return validateBrandingSection();
      case "storage":
        return validateStorageSection();
      case "security":
        return validateSecuritySection();
      case "messaging":
        return validateMessagingSection();
      default:
        return false;
    }
  };

  // Navigate to section with validation
  const navigateToSection = (targetSection: Step) => {
    if (!canProceedToSection(targetSection)) {
      // Show error for current section
      switch (currentStep) {
        case "identity":
          setError("Please complete the Identity section before proceeding");
          break;
        case "storage":
          setError(
            "Please select a storage provider and folder before proceeding",
          );
          break;
        case "security":
          setError(
            "Please set a maximum file size and select allowed file types",
          );
          break;
        default:
          setError("Please complete the current section before proceeding");
      }

      return;
    }

    setError("");
    setCurrentStep(targetSection);
  };

  const handleSubmit = async () => {
    setError("");

    // REVERSIBILITY: Remove this check to revert trial feature
    // Check if free user has already used their trial portal
    if (userPlan === "free" && hasCreatedTrialPortal) {
      showPaywall(
        userPlan,
        "Create Portal",
        "You've already created your free trial portal. Upgrade to Pro to create unlimited portals.",
      );

      return;
    }

    // Validate required fields
    if (!formData.portalName.trim()) {
      setError("Portal name is required");
      setCurrentStep("identity");

      return;
    }

    if (!formData.portalUrl.trim()) {
      setError("Portal URL slug is required");
      setCurrentStep("identity");

      return;
    }

    // Validate slug
    if (!slugValidation.isValid) {
      setError(slugValidation.error || "Invalid portal URL slug");
      setCurrentStep("identity");

      return;
    }

    // Validate storage configuration - make it optional
    // If storage is provided, folder must be selected
    if (formData.storageProvider && !formData.storageFolderId) {
      setError(
        "Storage folder must be selected when storage provider is specified",
      );
      setCurrentStep("storage");

      return;
    }

    // Max file size is optional, will default to 50MB on server
    const finalMaxFileSize =
      formData.maxFileSize && formData.maxFileSize > 0
        ? formData.maxFileSize
        : 50; // Default 50MB

    setLoading(true);

    try {
      // Upload logo file if present
      let logoUrl = null;

      if (formData.logo) {
        try {
          logoUrl = await uploadLogo(formData.logo);
        } catch (uploadError) {
          setError(
            "Failed to upload logo. Please try again or remove the logo to continue.",
          );
          setCurrentStep("branding");

          return;
        }
      }

      const response = await fetch("/api/portals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Identity
          name: formData.portalName,
          slug: formData.portalUrl,

          // Branding
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          textColor: formData.textColor,
          backgroundColor: formData.backgroundColor,
          cardBackgroundColor: formData.cardBackgroundColor,
          gradientEnabled: formData.gradientEnabled,
          logoUrl: logoUrl,
          companyWebsite: formData.companyWebsite || null,
          companyEmail: formData.companyEmail || null,

          // Storage
          storageProvider: formData.storageProvider,
          storageFolderId: formData.storageFolderId,
          storageFolderPath: formData.storageFolderPath,
          useClientFolders: formData.useClientFolders,

          // Security
          password: formData.password || null,
          requireClientName: formData.requireClientName,
          requireClientEmail: formData.requireClientEmail,
          maxFileSize: finalMaxFileSize * 1024 * 1024, // Convert MB to bytes
          allowedFileTypes: formData.allowedFileTypes,

          // Messaging
          welcomeMessage: expandedSections.welcomeMessage
            ? formData.welcomeMessage || DEFAULT_WELCOME_MESSAGE
            : null,
          welcomeToastMessage: expandedSections.welcomeToast
            ? formData.welcomeToastMessage || DEFAULT_WELCOME_TOAST
            : null,
          welcomeToastDelay: formData.welcomeToastDelay,
          welcomeToastDuration: formData.welcomeToastDuration,
          submitButtonText: formData.submitButtonText,
          successMessage: formData.successMessage,
          textboxSectionEnabled: formData.textboxSectionEnabled,
          textboxSectionTitle: formData.textboxSectionTitle || null,
          textboxSectionPlaceholder: formData.textboxSectionPlaceholder || null,
          textboxSectionRequired: formData.textboxSectionRequired,

          whiteLabeled: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // No subscription - show upgrade modal
        if (
          data.code === "CHECKOUT_REQUIRED"
        ) {
          showPaywall(
            userPlan,
            "Create Portal",
            "A subscription is required to create portals.",
          );
          setCurrentStep("identity");

          return;
        }

        setError(data.error || "Failed to create portal");

        return;
      }

      router.push("/dashboard/portals");
      router.refresh();
    } catch (error) {
      logger.error("Failed to create portal:", error);
      setError("Failed to create portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm mb-6 lg:mb-10"
        href="/dashboard/portals"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Portals
      </Link>

      {/* Show loading state while fetching plan */}
      {isLoadingPlan && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* REVERSIBILITY: Remove this block to revert trial feature */}
      {/* Show trial limitations for free users creating their first portal - only after loading completes */}
      {!isLoadingPlan && userPlan === "free" && !hasCreatedTrialPortal && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100">
                  Free Trial Portal
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full">
                  Trial
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed mb-2">
                You're creating your free trial portal with these limitations:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 mb-3">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
                  <span>1 trial portal allowed</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
                  <span>10 file uploads maximum</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
                  <span>Expires after 7 days</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
                  <span>No white-labeling or custom branding</span>
                </li>
              </ul>
              <Link
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                href="/dashboard/billing"
              >
                Upgrade to Pro for unlimited portals →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Only show form after plan check completes - prevents UI flash */}
      {!isLoadingPlan && (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <div className="mb-4 lg:mb-6 px-1 lg:px-2">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
              New Portal
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create a secure space for your clients.
            </p>
          </div>
          <nav className="space-y-1 overflow-x-auto pb-2 -mx-2 px-2 lg:overflow-visible lg:mx-0 lg:px-0">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const status = getSectionStatus(step.id);

              return (
                <button
                  key={step.id}
                  className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all duration-200 group whitespace-nowrap ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => navigateToSection(step.id)}
                >
                  <Icon
                    className={`w-4 lg:w-5 h-4 lg:h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm flex-1 text-left">
                    {step.label}
                  </span>

                  {status === "complete" && !isActive && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  {status === "incomplete" && !isActive && (
                    <AlertCircle className="w-4 h-4 text-muted-foreground/40" />
                  )}

                  {isActive && (
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto"
                      initial={{ opacity: 0, x: -5 }}
                      layoutId="new-portal-active-indicator"
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-card rounded-xl lg:rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 lg:p-6 border-b border-border bg-muted/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg lg:text-xl font-semibold text-foreground">
                        {steps.find((s) => s.id === currentStep)?.label}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure settings for this section.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {loading && (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      )}
                      {currentStep !== "identity" && (
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Return to Previous Section"
                          type="button"
                          onClick={() => {
                            const stepIds: Step[] = [
                              "identity",
                              "branding",
                              "storage",
                              "security",
                              "messaging",
                            ];
                            const currentIndex = stepIds.indexOf(currentStep);

                            if (currentIndex > 0) {
                              setCurrentStep(stepIds[currentIndex - 1]);
                            }
                          }}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
                    {/* Identity Section */}
                    {currentStep === "identity" && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Portal Name
                          </label>
                          <input
                            required
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            placeholder="e.g. Project Delivery Materials"
                            type="text"
                            value={formData.portalName}
                            onChange={(e) => handleNameChange(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Portal URL Slug
                          </label>
                          <div className="flex items-stretch shadow-sm rounded-xl">
                            <div className="px-4 flex items-center bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm font-medium">
                              /portal/
                            </div>
                            <input
                              required
                              className={`flex-1 px-4 py-3 bg-card border border-border rounded-r-xl focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground ${
                                formData.portalUrl &&
                                !slugValidation.isValid &&
                                !slugValidation.isChecking
                                  ? "border-red-300 focus:ring-red-500"
                                  : formData.portalUrl && slugValidation.isValid
                                    ? "border-green-300 focus:ring-green-500"
                                    : ""
                              }`}
                              placeholder="custom-address"
                              type="text"
                              value={formData.portalUrl}
                              onChange={(e) => {
                                const sanitized = sanitizeSlug(e.target.value);

                                updateFormData("portalUrl", sanitized);
                              }}
                            />
                          </div>

                          {/* Validation Feedback */}
                          {formData.portalUrl && (
                            <div className="mt-2">
                              {slugValidation.isChecking ? (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Checking availability...
                                </p>
                              ) : slugValidation.isValid ? (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Available! Your portal will be at /portal/
                                  {formData.portalUrl}
                                </p>
                              ) : slugValidation.error ? (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {slugValidation.error}
                                </p>
                              ) : null}
                            </div>
                          )}

                          {!formData.portalUrl && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Enter a portal name above to auto-generate a URL
                              slug
                            </p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-foreground">
                            Company Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Company Website */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Website
                              </label>
                              <input
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                placeholder="mycompany.studio"
                                type="text"
                                value={formData.companyWebsite}
                                onChange={(e) =>
                                  updateFormData(
                                    "companyWebsite",
                                    e.target.value,
                                  )
                                }
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Displayed in portal header
                              </p>
                            </div>

                            {/* Company Email */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Contact Email
                              </label>
                              <input
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                placeholder="hello@mycompany.studio"
                                type="email"
                                value={formData.companyEmail}
                                onChange={(e) =>
                                  updateFormData("companyEmail", e.target.value)
                                }
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Displayed in portal header
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
                          <div />
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                              className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
                              type="button"
                              onClick={() => navigateToSection("messaging")}
                            >
                              Jump to Finish
                            </button>
                            <button
                              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!validateIdentitySection()}
                              type="button"
                              onClick={() => navigateToSection("branding")}
                            >
                              Next: Branding
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Branding Section */}
                    {currentStep === "branding" && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-4">
                            Portal Logo
                          </label>
                          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-muted-foreground/50 transition-colors bg-muted/20">
                            {logoPreview ||
                            (session?.user as any)?.portalLogo ? (
                              <div className="relative w-48 h-24 mx-auto mb-4 group">
                                <img
                                  alt="Logo Preview"
                                  className="w-full h-full object-contain p-2 bg-card rounded-lg border border-border"
                                  src={
                                    logoPreview ||
                                    (session?.user as any)?.portalLogo
                                  }
                                />
                                <button
                                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  type="button"
                                  onClick={() => handleLogoSelect(null)}
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                                {!logoPreview &&
                                  (session?.user as any)?.portalLogo && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md">
                                      <p className="text-[8px] font-bold text-primary uppercase tracking-tighter">
                                        Default Active
                                      </p>
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            )}
                            <p className="text-sm text-muted-foreground mb-4 font-medium">
                              {logoPreview || (session?.user as any)?.portalLogo
                                ? "Replace current branding asset"
                                : "Click to upload or drag and drop"}
                            </p>
                            <input
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
                              className="hidden"
                              id="logo"
                              type="file"
                              onChange={(e) =>
                                handleLogoSelect(e.target.files?.[0] || null)
                              }
                            />
                            <div className="flex flex-col items-center gap-2">
                              <Button
                                className="rounded-xl px-6 h-10 font-bold text-xs uppercase tracking-widest"
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  document.getElementById("logo")?.click()
                                }
                              >
                                {logoPreview ||
                                (session?.user as any)?.portalLogo
                                  ? "CHANGE FILE"
                                  : "SELECT LOGO"}
                              </Button>
                              <p className="text-[10px] text-muted-foreground font-medium italic">
                                Translucent PNG or SVG recommended (5MB Limit)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-foreground">
                            Colors
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Primary Color */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Primary Color
                              </label>
                              <div className="flex gap-2">
                                <div className="relative group">
                                  <div
                                    className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer transition-all hover:scale-105"
                                    style={{
                                      backgroundColor: formData.primaryColor,
                                    }}
                                    onClick={() =>
                                      document
                                        .getElementById("primaryColorInput")
                                        ?.click()
                                    }
                                  />
                                  <input
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    id="primaryColorInput"
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) =>
                                      updateFormData(
                                        "primaryColor",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.primaryColor}
                                  onChange={(e) =>
                                    updateFormData(
                                      "primaryColor",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* Text Color */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Text Color
                              </label>
                              <div className="flex gap-2">
                                <div className="relative group">
                                  <div
                                    className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer transition-all hover:scale-105"
                                    style={{
                                      backgroundColor: formData.textColor,
                                    }}
                                    onClick={() =>
                                      document
                                        .getElementById("textColorInput")
                                        ?.click()
                                    }
                                  />
                                  <input
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    id="textColorInput"
                                    type="color"
                                    value={formData.textColor}
                                    onChange={(e) =>
                                      updateFormData(
                                        "textColor",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.textColor}
                                  onChange={(e) =>
                                    updateFormData("textColor", e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* Background Color */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Background
                              </label>
                              <div className="flex gap-2">
                                <div className="relative group">
                                  <div
                                    className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer transition-all hover:scale-105"
                                    style={{
                                      backgroundColor: formData.backgroundColor,
                                    }}
                                    onClick={() =>
                                      document
                                        .getElementById("backgroundColorInput")
                                        ?.click()
                                    }
                                  />
                                  <input
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    id="backgroundColorInput"
                                    type="color"
                                    value={formData.backgroundColor}
                                    onChange={(e) =>
                                      updateFormData(
                                        "backgroundColor",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.backgroundColor}
                                  onChange={(e) =>
                                    updateFormData(
                                      "backgroundColor",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* Card Background Color */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Card Background
                              </label>
                              <div className="flex gap-2">
                                <div className="relative group">
                                  <div
                                    className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer transition-all hover:scale-105"
                                    style={{
                                      backgroundColor:
                                        formData.cardBackgroundColor,
                                    }}
                                    onClick={() =>
                                      document
                                        .getElementById(
                                          "cardBackgroundColorInput",
                                        )
                                        ?.click()
                                    }
                                  />
                                  <input
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    id="cardBackgroundColorInput"
                                    type="color"
                                    value={formData.cardBackgroundColor}
                                    onChange={(e) =>
                                      updateFormData(
                                        "cardBackgroundColor",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.cardBackgroundColor}
                                  onChange={(e) =>
                                    updateFormData(
                                      "cardBackgroundColor",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* Secondary Color */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Secondary Color
                              </label>
                              <div className="flex gap-2">
                                <div className="relative group">
                                  <div
                                    className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer transition-all hover:scale-105"
                                    style={{
                                      backgroundColor: formData.secondaryColor,
                                    }}
                                    onClick={() =>
                                      document
                                        .getElementById("secondaryColorInput")
                                        ?.click()
                                    }
                                  />
                                  <input
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    id="secondaryColorInput"
                                    type="color"
                                    value={formData.secondaryColor}
                                    onChange={(e) =>
                                      updateFormData(
                                        "secondaryColor",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.secondaryColor}
                                  onChange={(e) =>
                                    updateFormData(
                                      "secondaryColor",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {/* Gradient Toggle */}
                          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                checked={formData.gradientEnabled}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                type="checkbox"
                                onChange={(e) =>
                                  updateFormData(
                                    "gradientEnabled",
                                    e.target.checked,
                                  )
                                }
                              />
                              <div>
                                <span className="block text-sm font-semibold text-foreground">
                                  Enable Gradient Buttons
                                </span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Use gradient from primary to secondary color
                                  for buttons
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
                          <div />
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                              className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
                              type="button"
                              onClick={() => navigateToSection("messaging")}
                            >
                              Jump to Finish
                            </button>
                            <button
                              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                              type="button"
                              onClick={() => navigateToSection("storage")}
                            >
                              Next: Storage
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Storage Section */}
                    {currentStep === "storage" && (
                      <StorageSection
                        expandedFolders={storageExpandedFolders}
                        folderPath={storageFolderPath}
                        folders={storageFolders}
                        formData={formData}
                        hasUserSelectedFolder={storageHasUserSelected}
                        setCurrentStep={setCurrentStep}
                        setExpandedFolders={setStorageExpandedFolders}
                        setFolderPath={setStorageFolderPath}
                        setFolders={setStorageFolders}
                        setHasUserSelectedFolder={setStorageHasUserSelected}
                        updateFormData={updateFormData}
                      />
                    )}

                    {/* Security Section */}
                    {currentStep === "security" && (
                      <SecuritySection
                        error={error}
                        formData={formData}
                        setCurrentStep={setCurrentStep}
                        setError={setError}
                        setShowPassword={setShowPassword}
                        showPassword={showPassword}
                        updateFormData={updateFormData}
                      />
                    )}

                    {/* Messaging Section */}
                    {currentStep === "messaging" && (
                      <div className="space-y-4">
                        {/* Welcome Message Section */}
                        <button
                          className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted transition-all text-left group"
                          type="button"
                          onClick={() => {
                            const newState = !expandedSections.welcomeMessage;

                            setExpandedSections((prev) => ({
                              ...prev,
                              welcomeMessage: newState,
                            }));
                            if (!newState) {
                              updateFormData("welcomeMessage", "");
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 border-primary flex items-center justify-center transition-all ${
                                expandedSections.welcomeMessage
                                  ? "bg-primary"
                                  : "bg-transparent"
                              }`}
                            >
                              {expandedSections.welcomeMessage && (
                                <svg
                                  className="w-3 h-3 text-primary-foreground"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    clipRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    fillRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                Welcome Message
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Displayed in the portal header
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              expandedSections.welcomeMessage ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {/* Welcome Message Content */}
                        <AnimatePresence>
                          {expandedSections.welcomeMessage && (
                            <motion.div
                              animate={{ opacity: 1, height: "auto" }}
                              className="overflow-hidden"
                              exit={{ opacity: 0, height: 0 }}
                              initial={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-3">
                                <textarea
                                  className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground resize-none"
                                  placeholder={DEFAULT_WELCOME_MESSAGE}
                                  rows={3}
                                  value={formData.welcomeMessage}
                                  onChange={(e) =>
                                    updateFormData(
                                      "welcomeMessage",
                                      e.target.value,
                                    )
                                  }
                                />
                                <p className="text-xs text-muted-foreground">
                                  Use line breaks for title and description.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Welcome Toast Notification Section */}
                        <button
                          className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted transition-all text-left group"
                          type="button"
                          onClick={() => {
                            const newState = !expandedSections.welcomeToast;

                            setExpandedSections((prev) => ({
                              ...prev,
                              welcomeToast: newState,
                            }));
                            if (!newState) {
                              updateFormData("welcomeToastMessage", "");
                              updateFormData("welcomeToastDelay", 1000);
                              updateFormData("welcomeToastDuration", 3000);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 border-primary flex items-center justify-center transition-all ${
                                expandedSections.welcomeToast
                                  ? "bg-primary"
                                  : "bg-transparent"
                              }`}
                            >
                              {expandedSections.welcomeToast && (
                                <svg
                                  className="w-3 h-3 text-primary-foreground"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    clipRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    fillRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                Welcome Toast Notification
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Popup shown when visitors enter
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              expandedSections.welcomeToast ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {/* Welcome Toast Content */}
                        <AnimatePresence>
                          {expandedSections.welcomeToast && (
                            <motion.div
                              animate={{ opacity: 1, height: "auto" }}
                              className="overflow-hidden"
                              exit={{ opacity: 0, height: 0 }}
                              initial={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-4">
                                <div>
                                  <label className="block text-sm font-semibold text-foreground mb-2">
                                    Toast Message
                                  </label>
                                  <input
                                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                    placeholder={DEFAULT_WELCOME_TOAST}
                                    type="text"
                                    value={formData.welcomeToastMessage}
                                    onChange={(e) =>
                                      updateFormData(
                                        "welcomeToastMessage",
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Popup notification shown when visitors enter
                                    the portal
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                      Delay (ms)
                                    </label>
                                    <input
                                      className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                      min="0"
                                      step="100"
                                      type="number"
                                      value={formData.welcomeToastDelay}
                                      onChange={(e) =>
                                        updateFormData(
                                          "welcomeToastDelay",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Time before toast appears (1000ms = 1
                                      second)
                                    </p>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                      Duration (ms)
                                    </label>
                                    <input
                                      className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                      min="1000"
                                      step="100"
                                      type="number"
                                      value={formData.welcomeToastDuration}
                                      onChange={(e) =>
                                        updateFormData(
                                          "welcomeToastDuration",
                                          parseInt(e.target.value) || 3000,
                                        )
                                      }
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      How long toast stays visible
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="border-t border-border pt-6">
                          <button
                            className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted transition-all text-left group"
                            type="button"
                            onClick={() => {
                              const newState = !expandedSections.textboxSection;

                              setExpandedSections((prev) => ({
                                ...prev,
                                textboxSection: newState,
                              }));
                              if (!newState) {
                                updateFormData("textboxSectionEnabled", false);
                                updateFormData("textboxSectionTitle", "");
                                updateFormData("textboxSectionRequired", false);
                              } else {
                                updateFormData("textboxSectionEnabled", true);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded border-2 border-primary flex items-center justify-center transition-all ${
                                  expandedSections.textboxSection
                                    ? "bg-primary"
                                    : "bg-transparent"
                                }`}
                              >
                                {expandedSections.textboxSection && (
                                  <svg
                                    className="w-3 h-3 text-primary-foreground"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      clipRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      fillRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  Textbox Section
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Add a text input field for clients to fill out
                                </p>
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-5 h-5 text-muted-foreground transition-transform ${
                                expandedSections.textboxSection
                                  ? "rotate-90"
                                  : ""
                              }`}
                            />
                          </button>

                          {/* Textbox Section Content */}
                          <AnimatePresence>
                            {expandedSections.textboxSection && (
                              <motion.div
                                animate={{ opacity: 1, height: "auto" }}
                                className="overflow-hidden"
                                exit={{ opacity: 0, height: 0 }}
                                initial={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <label className="block text-sm font-semibold text-foreground mb-2">
                                        Textbox Placeholder
                                      </label>
                                      <input
                                        className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none text-muted-foreground"
                                        placeholder="e.g., Enter any notes or comments..."
                                        type="text"
                                        value={
                                          formData.textboxSectionPlaceholder
                                        }
                                        onChange={(e) =>
                                          updateFormData(
                                            "textboxSectionPlaceholder",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="flex items-end">
                                      <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                          checked={
                                            formData.textboxSectionRequired
                                          }
                                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                          type="checkbox"
                                          onChange={(e) =>
                                            updateFormData(
                                              "textboxSectionRequired",
                                              e.target.checked,
                                            )
                                          }
                                        />
                                        <span className="text-sm font-medium text-foreground">
                                          Required field
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Submit Button Label
                            </label>
                            <input
                              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground"
                              type="text"
                              value={formData.submitButtonText}
                              onChange={(e) =>
                                updateFormData(
                                  "submitButtonText",
                                  e.target.value,
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Success Message
                            </label>
                            <input
                              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground"
                              type="text"
                              value={formData.successMessage}
                              onChange={(e) =>
                                updateFormData("successMessage", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="bg-primary rounded-xl p-6 text-primary-foreground shadow-lg">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary-foreground/10 rounded-lg">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">
                                Ready to Create?
                              </h4>
                              <p className="text-primary-foreground/80 text-sm mt-1 leading-relaxed">
                                Your new portal will be accessible at{" "}
                                <strong className="text-primary-foreground">
                                  /portal/{formData.portalUrl || "..."}
                                </strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-border flex justify-end gap-3">
                          <Link
                            className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-bold text-sm"
                            href="/dashboard/portals"
                          >
                            Cancel
                          </Link>
                          <button
                            className="flex items-center justify-center gap-2 px-6 lg:px-8 py-2.5 lg:py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 font-bold text-sm"
                            disabled={loading}
                            type="submit"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                Create Portal{" "}
                                <ChevronRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Error Toast */}
            {error && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm"
                initial={{ opacity: 0, y: 10 }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-destructive font-bold">{error}</p>
                    <button
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      type="button"
                      onClick={() => {
                        setError("");
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </form>
        </main>
      </div>
      )}

      {/* Paywall Modal - shown when user needs to subscribe */}
      <PaywallModal />
    </div>
  );
}
