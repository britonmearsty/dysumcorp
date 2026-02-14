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
  Eye,
  EyeOff,
  Upload,
  FolderOpen,
  RefreshCw,
  Hash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectItem } from "@heroui/react";
import { Checkbox } from "@heroui/react";

import { Button } from "@/components/ui/button";
import { usePaywall } from "@/components/paywall-modal";
import { PlanType } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";
import { validateSlug, sanitizeSlug } from "@/lib/slug-validation";

type Step = "identity" | "branding" | "storage" | "security" | "messaging";

interface ConnectedAccount {
  provider: "google" | "dropbox";
  providerAccountId: string;
  email?: string;
  name?: string;
  isConnected: boolean;
  storageAccountId?: string;
  storageStatus?: "ACTIVE" | "INACTIVE" | "DISCONNECTED" | "ERROR";
  hasValidOAuth: boolean;
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
      <div className={`flex items-center justify-between py-2 hover:bg-muted/50 transition-colors group rounded-lg pr-2 ${
        isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
      }`}>
        <button
          type="button"
          onClick={() => navigateToFolder(folder)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <FolderOpen className={`w-4 h-4 flex-shrink-0 ${
            isSelected ? 'text-primary' : 'text-warning'
          }`} />
          <span className={`text-sm font-medium truncate ${
            isSelected ? 'text-primary font-semibold' : 'text-muted-foreground group-hover:text-foreground'
          }`}>
            {folder.name}
          </span>
          {isSelected && (
            <CheckCircle2 className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
          )}
        </button>

        {subfolders.length > 0 && (
          <button
            type="button"
            onClick={() => toggleFolder(folder.id)}
            className="p-1 hover:bg-muted rounded-md transition-colors"
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
              folder={sub}
              navigateToFolder={navigateToFolder}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              selectedFolderId={selectedFolderId}
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
}

const StorageSection: React.FC<StorageSectionProps> = ({
  formData,
  updateFormData,
  setCurrentStep,
}) => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderPath, setFolderPath] = useState<StorageFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);
  const [healthCheckResults, setHealthCheckResults] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Auto-initialize storage when accounts are loaded
  useEffect(() => {
    if (
      !loadingAccounts &&
      accounts.length > 0 &&
      (!formData.storageProvider ||
        (!loadingFolders &&
          folders.length === 0 &&
          folderPath.length === 0))
    ) {
      const firstAccount = accounts[0];
      if (firstAccount) {
        const storageProvider =
          firstAccount.provider === "google" ? "google_drive" : "dropbox";
        selectStorageProvider(storageProvider);
      }
    }
  }, [
    loadingAccounts,
    accounts,
    formData.storageProvider,
    folders.length,
    folderPath.length,
  ]);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/storage/connections");
      if (res.ok) {
        const data = await res.json();
        console.log("Storage connections response:", data);
        const connectedAccounts = data.accounts?.filter(
          (a: ConnectedAccount) => a.isConnected
        ) || [];
        console.log("Connected accounts:", connectedAccounts);
        setAccounts(connectedAccounts);
      } else {
        console.error("Failed to fetch storage connections:", res.status, await res.text());
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function selectStorageProvider(provider: "google_drive" | "dropbox") {
    updateFormData("storageProvider", provider);
    updateFormData("storageFolderId", "");
    updateFormData("storageFolderPath", "");
    setFolders([]);
    setFolderPath([]);
    setLoadingFolders(true);

    try {
      const rootRes = await fetch(
        `/api/storage/list?provider=${provider}&rootOnly=true`
      );
      if (rootRes.ok) {
        const rootFolder = await rootRes.json();
        if (rootFolder && rootFolder.id) {
          setFolderPath([rootFolder]);
          updateFormData("storageFolderId", rootFolder.id);
          updateFormData("storageFolderPath", rootFolder.path);
          await fetchFolders(provider, rootFolder.id);
        }
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
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
      console.error("Error fetching folders:", error);
    } finally {
      setLoadingFolders(false);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim() || !formData.storageProvider) return;

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
      }
    } catch (error) {
      console.error("Error creating folder:", error);
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
    updateFormData(
      "storageFolderPath",
      newPath.map((f) => f.name).join("/")
    );
    fetchFolders(formData.storageProvider, folder.id);
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
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
        await fetchAccounts();
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
      {/* Storage Account Status Warning */}
      {accounts.length > 0 &&
        accounts.some((a) => a.storageStatus !== "ACTIVE") && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Storage Account Issues Detected
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Some of your storage accounts have connection issues. This
                  may affect portal functionality.
                </p>
                <div className="space-y-2">
                  {accounts
                    .filter((a) => a.storageStatus !== "ACTIVE")
                    .map((account) => (
                      <div
                        key={account.provider}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            account.storageStatus === "DISCONNECTED"
                              ? "bg-red-500"
                              : account.storageStatus === "ERROR"
                                ? "bg-orange-500 animate-pulse"
                                : "bg-yellow-500"
                          }`}
                        />
                        <span className="font-medium">
                          {account.provider === "google"
                            ? "Google Drive"
                            : "Dropbox"}
                          :
                        </span>
                        <span className="text-muted-foreground">
                          {account.storageStatus === "DISCONNECTED"
                            ? "Disconnected - needs reconnection"
                            : account.storageStatus === "ERROR"
                              ? "Connection error - may resolve automatically"
                              : "Inactive - not available for new uploads"}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t border-warning/20">
                  <button
                    type="button"
                    onClick={runStorageHealthCheck}
                    disabled={isRunningHealthCheck}
                    className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 hover:bg-warning/20 border border-warning/30 rounded-lg text-xs font-medium text-warning-foreground transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isRunningHealthCheck ? "animate-spin" : ""}`}
                    />
                    {isRunningHealthCheck
                      ? "Running Health Check..."
                      : "Run Storage Health Check"}
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Visit <strong>Settings → Connected Accounts</strong> to fix
                    these issues manually.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Storage Provider Selection */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            id: "google_drive",
            name: "Google Drive",
            icon: Cloud,
            disabled: !accounts.find(
              (a) => a.provider === "google" && a.storageStatus === "ACTIVE"
            ),
          },
          {
            id: "dropbox",
            name: "Dropbox",
            icon: Cloud,
            disabled: !accounts.find(
              (a) => a.provider === "dropbox" && a.storageStatus === "ACTIVE"
            ),
          },
        ].map((provider) => {
          const Icon = provider.icon;
          const isActive = formData.storageProvider === provider.id;
          const account = accounts.find(
            (a) =>
              (a.provider === "google" ? "google_drive" : "dropbox") ===
              provider.id
          );
          const hasAccount = !!account;

          return (
            <button
              key={provider.id}
              type="button"
              disabled={provider.disabled}
              onClick={() =>
                selectStorageProvider(provider.id as "google_drive" | "dropbox")
              }
              className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                isActive
                  ? "border-primary bg-muted"
                  : "border-border bg-card hover:border-muted-foreground hover:bg-muted"
              } ${provider.disabled ? "opacity-40 grayscale cursor-not-allowed" : ""}`}
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
              type="button"
              onClick={() => {
                setIsCreatingFolder(true);
                setNewFolderName(formData.portalName || "New Portal Folder");
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-card border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all shadow-sm"
            >
              <FolderOpen className="w-3 h-3 text-warning" />
              New Folder
            </button>
          </div>

          {/* Currently Selected Folder Display */}
          {formData.storageFolderId && folderPath.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                    Selected Folder
                  </p>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {folderPath[folderPath.length - 1].name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formData.storageFolderPath}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => selectStorageProvider(formData.storageProvider)}
              className="p-1.5 hover:bg-card rounded-md transition-colors"
            >
              <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {folderPath.map((folder, idx) => (
              <div
                key={folder.id}
                className="flex items-center gap-1 shrink-0"
              >
                <ChevronRight className="w-3 h-3 text-muted" />
                <button
                  type="button"
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    idx === folderPath.length - 1
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <AnimatePresence>
            {isCreatingFolder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-x-0 top-0 z-10 p-4 bg-card border-b border-border shadow-xl"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Creation Module
                    </h4>
                    <button
                      onClick={() => setIsCreatingFolder(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder identifier..."
                      className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-ring outline-none text-foreground"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateFolder()
                      }
                    />
                    <button
                      type="button"
                      onClick={handleCreateFolder}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                    folder={folder}
                    navigateToFolder={navigateToFolder}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    selectedFolderId={formData.storageFolderId}
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
                type="checkbox"
                checked={formData.useClientFolders}
                onChange={(e) =>
                  updateFormData("useClientFolders", e.target.checked)
                }
                className="peer sr-only"
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

      <div className="pt-4 flex justify-between">
        <div />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep("messaging")}
            className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
          >
            Jump to Finish
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep("security")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
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
    label: "Archives (ZIP, RAR)",
    value:
      "application/zip,application/x-rar-compressed,application/x-7z-compressed",
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
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Max Payload (MB)
          </label>

          {/* File Size Templates */}
          <div className="grid grid-cols-3 gap-2 mb-4">
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
                type="button"
                onClick={() => {
                  updateFormData("maxFileSize", template.size);
                  if (error.includes("Maximum file size must be specified")) {
                    setError("");
                  }
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.maxFileSize === template.size
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                }`}
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
              placeholder="Custom size..."
              className={`w-full pl-10 pr-4 py-3 bg-card border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground ${!formData.maxFileSize ? "border-warning" : "border-border"}`}
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
              type="password"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              placeholder="Set new key..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Client Data Requirements
        </label>
        <div className="flex gap-4">
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
              type="button"
              onClick={() =>
                updateFormData(
                  req.key,
                  !formData[req.key as keyof typeof formData]
                )
              }
              className={`flex-1 px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                formData[req.key as keyof typeof formData]
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {req.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Allowed File Types
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted p-4 rounded-xl border border-border">
          {FILE_TYPE_OPTIONS.map((opt) => {
            const isSelected = formData.allowedFileTypes.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-card cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    updateFormData(
                      "allowedFileTypes",
                      isSelected
                        ? formData.allowedFileTypes.filter(
                            (v: string) => v !== opt.value
                          )
                        : [...formData.allowedFileTypes, opt.value]
                    )
                  }
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
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

      <div className="pt-4 flex justify-between">
        <div />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep("messaging")}
            className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
          >
            Jump to Finish
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep("messaging")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
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

  const [formData, setFormData] = useState({
    // Identity
    portalName: "",
    portalUrl: "",

    // Branding
    primaryColor: "#3b82f6",
    textColor: "#0f172a",
    backgroundColor: "#ffffff",
    cardBackgroundColor: "#ffffff",
    logo: null as File | null,
    customDomain: "",

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
    ] as string[], // Default: Images, Documents, Spreadsheets

    // Messaging
    welcomeMessage: "",
    submitButtonText: "Initialize Transfer",
    successMessage: "Transmission Verified",
  });

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: "identity", label: "Identity", icon: Type },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "storage", label: "Storage", icon: Cloud },
    { id: "security", label: "Security", icon: Lock },
    { id: "messaging", label: "Messaging", icon: Settings2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `/api/plan-limits?userId=${session.user.id}`,
      );
      const data = await response.json();

      if (response.ok) {
        setUserPlan(data.planType);
      } else {
        console.error("Failed to fetch user plan:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch user plan:", error);
    }
  };

  const handleCustomDomainChange = async (value: string) => {
    if (!session?.user?.id) return;

    const response = await fetch("/api/plan-limits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        planType: userPlan,
        checkType: "customDomain",
      }),
    });

    const limitCheck = await response.json();

    if (!limitCheck.allowed && value) {
      showPaywall(
        userPlan,
        "Custom Domains",
        limitCheck.reason ||
          "Custom domains are not available on your current plan.",
        "pro",
      );

      return;
    }

    updateFormData("customDomain", value);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle logo file selection and validation
  const handleLogoSelect = (file: File | null) => {
    if (!file) {
      updateFormData("logo", null);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image (JPG, PNG, GIF, SVG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB');
      return;
    }

    // Update form data
    updateFormData("logo", file);
  };

  // Upload logo to storage
  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', 'google'); // Default to Google Drive

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const data = await response.json();
      
      // Return the file URL or ID from the response
      if (data.file?.webViewLink) {
        return data.file.webViewLink; // Google Drive
      } else if (data.file?.id) {
        return data.file.id; // Fallback to ID
      }
      
      throw new Error('No file URL returned from upload');
    } catch (error) {
      console.error('Logo upload error:', error);
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
        const response = await fetch(`/api/portals/check-slug?slug=${encodeURIComponent(slug)}`);
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
        console.error("Error checking slug:", error);
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
    if (!formData.portalUrl || formData.portalUrl === sanitizeSlug(formData.portalName)) {
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
  const getSectionStatus = (sectionId: Step): 'complete' | 'incomplete' | 'current' => {
    if (sectionId === currentStep) return 'current';
    
    switch (sectionId) {
      case 'identity':
        return validateIdentitySection() ? 'complete' : 'incomplete';
      case 'branding':
        return validateBrandingSection() ? 'complete' : 'incomplete';
      case 'storage':
        return validateStorageSection() ? 'complete' : 'incomplete';
      case 'security':
        return validateSecuritySection() ? 'complete' : 'incomplete';
      case 'messaging':
        return validateMessagingSection() ? 'complete' : 'incomplete';
      default:
        return 'incomplete';
    }
  };

  // Check if can proceed to next section
  const canProceedToSection = (targetSection: Step): boolean => {
    const sections: Step[] = ['identity', 'branding', 'storage', 'security', 'messaging'];
    const currentIndex = sections.indexOf(currentStep);
    const targetIndex = sections.indexOf(targetSection);
    
    // Can always go back
    if (targetIndex < currentIndex) return true;
    
    // Can go forward if current section is valid
    switch (currentStep) {
      case 'identity':
        return validateIdentitySection();
      case 'branding':
        return validateBrandingSection();
      case 'storage':
        return validateStorageSection();
      case 'security':
        return validateSecuritySection();
      case 'messaging':
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
        case 'identity':
          setError('Please complete the Identity section before proceeding');
          break;
        case 'storage':
          setError('Please select a storage provider and folder before proceeding');
          break;
        case 'security':
          setError('Please set a maximum file size and select allowed file types');
          break;
        default:
          setError('Please complete the current section before proceeding');
      }
      return;
    }
    
    setError('');
    setCurrentStep(targetSection);
  };

  const handleSubmit = async () => {
    setError("");

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

    // Validate storage configuration
    if (!formData.storageProvider || !formData.storageFolderId) {
      setError("Storage provider and folder must be selected");
      setCurrentStep("storage");
      return;
    }

    // Validate max file size
    if (!formData.maxFileSize || formData.maxFileSize <= 0) {
      setError("Maximum file size must be specified");
      setCurrentStep("security");
      return;
    }

    setLoading(true);

    try {
      // Upload logo file if present
      let logoUrl = null;
      if (formData.logo) {
        try {
          logoUrl = await uploadLogo(formData.logo);
        } catch (uploadError) {
          setError("Failed to upload logo. Please try again or remove the logo to continue.");
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
          textColor: formData.textColor,
          backgroundColor: formData.backgroundColor,
          cardBackgroundColor: formData.cardBackgroundColor,
          logoUrl: logoUrl,
          customDomain: formData.customDomain || null,
          
          // Storage
          storageProvider: formData.storageProvider,
          storageFolderId: formData.storageFolderId,
          storageFolderPath: formData.storageFolderPath,
          useClientFolders: formData.useClientFolders,
          
          // Security
          password: formData.password || null,
          requireClientName: formData.requireClientName,
          requireClientEmail: formData.requireClientEmail,
          maxFileSize: formData.maxFileSize * 1024 * 1024, // Convert MB to bytes
          allowedFileTypes: formData.allowedFileTypes,
          
          // Messaging
          welcomeMessage: formData.welcomeMessage || null,
          submitButtonText: formData.submitButtonText,
          successMessage: formData.successMessage,
          
          whiteLabeled: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgrade) {
          setError(`${data.error}\n\nPlease upgrade your plan to continue.`);
          router.push("/dashboard/billing");
        } else {
          setError(data.error || "Failed to create portal");
        }

        return;
      }

      router.push("/dashboard/portals");
      router.refresh();
    } catch (error) {
      console.error("Failed to create portal:", error);
      setError("Failed to create portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm mb-10"
        href="/dashboard/portals"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Portals
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="mb-6 px-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              New Portal
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create a secure space for your clients.
            </p>
          </div>
          <nav className="space-y-1">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const status = getSectionStatus(step.id);

              return (
                <button
                  key={step.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => navigateToSection(step.id)}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm flex-1 text-left">{step.label}</span>
                  
                  {/* Completion Indicator */}
                  {status === 'complete' && !isActive && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  {status === 'incomplete' && !isActive && (
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
        <main className="flex-1 min-w-0">
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
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {steps.find((s) => s.id === currentStep)?.label}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure settings for this section.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {loading && (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      )}
                      {currentStep !== "identity" && (
                        <button
                          type="button"
                          onClick={() => {
                            const stepIds: Step[] = ["identity", "branding", "storage", "security", "messaging"];
                            const currentIndex = stepIds.indexOf(currentStep);
                            if (currentIndex > 0) {
                              setCurrentStep(stepIds[currentIndex - 1]);
                            }
                          }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Return to Previous Section"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
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
                                formData.portalUrl && !slugValidation.isValid && !slugValidation.isChecking
                                  ? 'border-red-300 focus:ring-red-500'
                                  : formData.portalUrl && slugValidation.isValid
                                    ? 'border-green-300 focus:ring-green-500'
                                    : ''
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
                                  Available! Your portal will be at /portal/{formData.portalUrl}
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
                              Enter a portal name above to auto-generate a URL slug
                            </p>
                          )}
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div />
                          <div className="flex gap-3">
                            <button
                              className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
                              type="button"
                              onClick={() => navigateToSection("messaging")}
                            >
                              Jump to Finish
                            </button>
                            <button
                              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              type="button"
                              disabled={!validateIdentitySection()}
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
                          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-muted-foreground/50 transition-colors">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Click to upload or drag and drop
                            </p>
                            <input
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
                              className="hidden"
                              id="logo"
                              type="file"
                              onChange={(e) => handleLogoSelect(e.target.files?.[0] || null)}
                            />
                            <Button
                              className="rounded-xl"
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() =>
                                document.getElementById("logo")?.click()
                              }
                            >
                              SELECT FILE
                            </Button>
                            {formData.logo && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Selected: {formData.logo.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-foreground">Colors</h3>
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
                                    style={{ backgroundColor: formData.primaryColor }}
                                    onClick={() => document.getElementById("primaryColorInput")?.click()}
                                  />
                                  <input
                                    id="primaryColorInput"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) =>
                                      updateFormData("primaryColor", e.target.value)
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.primaryColor}
                                  onChange={(e) =>
                                    updateFormData("primaryColor", e.target.value)
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
                                    style={{ backgroundColor: formData.textColor }}
                                    onClick={() => document.getElementById("textColorInput")?.click()}
                                  />
                                  <input
                                    id="textColorInput"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    type="color"
                                    value={formData.textColor}
                                    onChange={(e) =>
                                      updateFormData("textColor", e.target.value)
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
                                    style={{ backgroundColor: formData.backgroundColor }}
                                    onClick={() => document.getElementById("backgroundColorInput")?.click()}
                                  />
                                  <input
                                    id="backgroundColorInput"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    type="color"
                                    value={formData.backgroundColor}
                                    onChange={(e) =>
                                      updateFormData("backgroundColor", e.target.value)
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.backgroundColor}
                                  onChange={(e) =>
                                    updateFormData("backgroundColor", e.target.value)
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
                                    style={{ backgroundColor: formData.cardBackgroundColor }}
                                    onClick={() => document.getElementById("cardBackgroundColorInput")?.click()}
                                  />
                                  <input
                                    id="cardBackgroundColorInput"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    type="color"
                                    value={formData.cardBackgroundColor}
                                    onChange={(e) =>
                                      updateFormData("cardBackgroundColor", e.target.value)
                                    }
                                  />
                                </div>
                                <input
                                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type="text"
                                  value={formData.cardBackgroundColor}
                                  onChange={(e) =>
                                    updateFormData("cardBackgroundColor", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Custom Domain (Optional)
                          </label>
                          <input
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            placeholder="e.g., portal.acmecorp.com"
                            type="text"
                            value={formData.customDomain}
                            onChange={(e) =>
                              handleCustomDomainChange(e.target.value)
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Configure DNS settings to point to your portal
                          </p>
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div />
                          <div className="flex gap-3">
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
                        formData={formData}
                        updateFormData={updateFormData}
                        setCurrentStep={setCurrentStep}
                      />
                    )}

                    {/* Security Section */}
                    {currentStep === "security" && (
                      <SecuritySection
                        formData={formData}
                        updateFormData={updateFormData}
                        setCurrentStep={setCurrentStep}
                        error={error}
                        setError={setError}
                      />
                    )}

                    {/* Messaging Section */}
                    {currentStep === "messaging" && (
                      <div className="space-y-8">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Welcome Message
                          </label>
                          <textarea
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground resize-none"
                            placeholder="Welcome! Please upload your documents for review."
                            rows={3}
                            value={formData.welcomeMessage}
                            onChange={(e) =>
                              updateFormData("welcomeMessage", e.target.value)
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Submit Button Label
                            </label>
                            <input
                              type="text"
                              value={formData.submitButtonText}
                              onChange={(e) =>
                                updateFormData(
                                  "submitButtonText",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Success Message
                            </label>
                            <input
                              type="text"
                              value={formData.successMessage}
                              onChange={(e) =>
                                updateFormData("successMessage", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none font-semibold text-foreground"
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
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 font-bold text-sm"
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
                className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm font-bold"
                initial={{ opacity: 0, y: 10 }}
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </form>
        </main>
      </div>

      {/* Paywall Modal */}
      <PaywallModal />
    </div>
  );
}
