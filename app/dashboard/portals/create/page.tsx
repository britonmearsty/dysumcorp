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
  Hash,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePaywall } from "@/components/paywall-modal";
import { PlanType } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";

type Step = "identity" | "branding" | "storage" | "security" | "messaging";

export default function CreatePortalPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showPaywall, PaywallModal } = usePaywall();
  const [currentStep, setCurrentStep] = useState<Step>("identity");
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Identity
    portalName: "",
    portalUrl: "",
    clientName: "",
    clientEmail: "",
    description: "",

    // Branding
    primaryColor: "#334155",
    secondaryColor: "#1a1a1a",
    logo: null as File | null,
    favicon: null as File | null,
    customDomain: "",

    // Storage
    storageProvider: "local",
    storageLimit: "10",
    allowedFileTypes: "pdf,doc,docx,xls,xlsx,jpg,png",
    maxFileSize: "50",
    autoDelete: false,
    retentionDays: "30",

    // Security
    accessType: "password",
    password: "",
    twoFactorAuth: false,
    ipWhitelist: "",
    sessionTimeout: "30",
    encryptFiles: true,

    // Messaging
    welcomeMessage: "",
    emailNotifications: true,
    uploadNotifications: true,
    customEmailTemplate: false,
    autoReplyMessage: "",
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

  const handleSubmit = async () => {
    setError("");

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

    setLoading(true);

    try {
      const response = await fetch("/api/portals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.portalName,
          slug: formData.portalUrl,
          customDomain: formData.customDomain || null,
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
        href="/dashboard/portals"
        className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm mb-10"
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
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm">{step.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="new-portal-active-indicator"
                      className="ml-auto"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
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
                            type="text"
                            value={formData.portalName}
                            onChange={(e) =>
                              updateFormData("portalName", e.target.value)
                            }
                            placeholder="e.g. Project Delivery Materials"
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Portal URL Slug
                          </label>
                          <div className="flex items-stretch shadow-sm rounded-xl">
                            <div className="px-4 flex items-center bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm font-medium">
                              /p/
                            </div>
                            <input
                              type="text"
                              value={formData.portalUrl}
                              onChange={(e) =>
                                updateFormData("portalUrl", e.target.value)
                              }
                              placeholder="custom-address"
                              className="flex-1 px-4 py-3 bg-card border border-border rounded-r-xl focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Your portal will be accessible at /p/
                            {formData.portalUrl || "slug"}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Client Name
                          </label>
                          <input
                            type="text"
                            value={formData.clientName}
                            onChange={(e) =>
                              updateFormData("clientName", e.target.value)
                            }
                            placeholder="e.g., John Doe"
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Client Email
                          </label>
                          <input
                            type="email"
                            value={formData.clientEmail}
                            onChange={(e) =>
                              updateFormData("clientEmail", e.target.value)
                            }
                            placeholder="e.g., john@acmecorp.com"
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) =>
                              updateFormData("description", e.target.value)
                            }
                            placeholder="Brief description of this portal..."
                            rows={3}
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground resize-none"
                          />
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div></div>
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
                              onClick={() => setCurrentStep("branding")}
                              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Primary Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) =>
                                  updateFormData("primaryColor", e.target.value)
                                }
                                className="w-20 h-10 rounded-xl border border-border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={formData.primaryColor}
                                onChange={(e) =>
                                  updateFormData("primaryColor", e.target.value)
                                }
                                className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Secondary Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.secondaryColor}
                                onChange={(e) =>
                                  updateFormData(
                                    "secondaryColor",
                                    e.target.value,
                                  )
                                }
                                className="w-20 h-10 rounded-xl border border-border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={formData.secondaryColor}
                                onChange={(e) =>
                                  updateFormData(
                                    "secondaryColor",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Portal Logo
                          </label>
                          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-muted-foreground/50 transition-colors">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Click to upload or drag and drop
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="logo"
                              onChange={(e) =>
                                updateFormData("logo", e.target.files?.[0])
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() =>
                                document.getElementById("logo")?.click()
                              }
                            >
                              SELECT FILE
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Custom Domain (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.customDomain}
                            onChange={(e) =>
                              handleCustomDomainChange(e.target.value)
                            }
                            placeholder="e.g., portal.acmecorp.com"
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Configure DNS settings to point to your portal
                          </p>
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div></div>
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
                              onClick={() => setCurrentStep("storage")}
                              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                            >
                              Next: Storage
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Storage Section */}
                    {currentStep === "storage" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Storage Provider
                            </label>
                            <select
                              value={formData.storageProvider}
                              onChange={(e) =>
                                updateFormData(
                                  "storageProvider",
                                  e.target.value,
                                )
                              }
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            >
                              <option value="local">Local Storage</option>
                              <option value="s3">Amazon S3</option>
                              <option value="azure">Azure Blob Storage</option>
                              <option value="gcs">Google Cloud Storage</option>
                              <option value="dropbox">Dropbox</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Storage Limit (GB)
                            </label>
                            <input
                              type="number"
                              value={formData.storageLimit}
                              onChange={(e) =>
                                updateFormData("storageLimit", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Allowed File Types
                            </label>
                            <input
                              type="text"
                              value={formData.allowedFileTypes}
                              onChange={(e) =>
                                updateFormData(
                                  "allowedFileTypes",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., pdf,doc,docx,jpg,png"
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Comma-separated list of file extensions
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Max File Size (MB)
                            </label>
                            <input
                              type="number"
                              value={formData.maxFileSize}
                              onChange={(e) =>
                                updateFormData("maxFileSize", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              File Retention (Days)
                            </label>
                            <input
                              type="number"
                              value={formData.retentionDays}
                              onChange={(e) =>
                                updateFormData("retentionDays", e.target.value)
                              }
                              disabled={!formData.autoDelete}
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground disabled:opacity-50"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.autoDelete}
                                onChange={(e) =>
                                  updateFormData("autoDelete", e.target.checked)
                                }
                                className="w-4 h-4 rounded border-border"
                              />
                              <span className="text-sm font-medium text-foreground">
                                Enable automatic file deletion after retention
                                period
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div></div>
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
                    )}

                    {/* Security Section */}
                    {currentStep === "security" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Access Type
                            </label>
                            <select
                              value={formData.accessType}
                              onChange={(e) =>
                                updateFormData("accessType", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            >
                              <option value="password">
                                Password Protected
                              </option>
                              <option value="link">Secure Link Only</option>
                              <option value="sso">Single Sign-On (SSO)</option>
                              <option value="oauth">OAuth 2.0</option>
                            </select>
                          </div>

                          {formData.accessType === "password" && (
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Portal Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={formData.password}
                                  onChange={(e) =>
                                    updateFormData("password", e.target.value)
                                  }
                                  className="w-full px-4 py-3 pr-10 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Session Timeout (minutes)
                            </label>
                            <input
                              type="number"
                              value={formData.sessionTimeout}
                              onChange={(e) =>
                                updateFormData("sessionTimeout", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              IP Whitelist (Optional)
                            </label>
                            <input
                              type="text"
                              value={formData.ipWhitelist}
                              onChange={(e) =>
                                updateFormData("ipWhitelist", e.target.value)
                              }
                              placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Comma-separated IP addresses or CIDR ranges
                            </p>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.twoFactorAuth}
                                onChange={(e) =>
                                  updateFormData(
                                    "twoFactorAuth",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded border-border"
                              />
                              <span className="text-sm font-medium text-foreground">
                                Enable Two-Factor Authentication (2FA)
                              </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.encryptFiles}
                                onChange={(e) =>
                                  updateFormData(
                                    "encryptFiles",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded border-border"
                              />
                              <span className="text-sm font-medium text-foreground">
                                Encrypt files at rest (AES-256)
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div></div>
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
                    )}

                    {/* Messaging Section */}
                    {currentStep === "messaging" && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Welcome Message
                          </label>
                          <textarea
                            value={formData.welcomeMessage}
                            onChange={(e) =>
                              updateFormData("welcomeMessage", e.target.value)
                            }
                            placeholder="Welcome! Please upload your documents for review."
                            rows={3}
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground resize-none"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            This message will be displayed when clients first
                            access the portal
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Auto-Reply Message (Optional)
                          </label>
                          <textarea
                            value={formData.autoReplyMessage}
                            onChange={(e) =>
                              updateFormData("autoReplyMessage", e.target.value)
                            }
                            placeholder="Automatic reply when files are uploaded..."
                            rows={3}
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground resize-none"
                          />
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.emailNotifications}
                              onChange={(e) =>
                                updateFormData(
                                  "emailNotifications",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm font-medium text-foreground">
                              Enable email notifications
                            </span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.uploadNotifications}
                              onChange={(e) =>
                                updateFormData(
                                  "uploadNotifications",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm font-medium text-foreground">
                              Notify on file uploads
                            </span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.customEmailTemplate}
                              onChange={(e) =>
                                updateFormData(
                                  "customEmailTemplate",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm font-medium text-foreground">
                              Use custom email template
                            </span>
                          </label>
                        </div>

                        {formData.customEmailTemplate && (
                          <div className="bg-muted/50 border border-border rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">
                              Custom email templates can be configured after
                              portal creation
                            </p>
                          </div>
                        )}

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
                                  /p/{formData.portalUrl || "..."}
                                </strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-border flex justify-end gap-3">
                          <Link
                            href="/dashboard/portals"
                            className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-bold text-sm"
                          >
                            Cancel
                          </Link>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 font-bold text-sm"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm font-bold"
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
