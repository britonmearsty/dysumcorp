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

              return (
                <button
                  key={step.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm">{step.label}</span>
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
                <div className="bg-bg-card rounded-[14px] border border-border overflow-hidden">
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
                            required
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            placeholder="e.g. Project Delivery Materials"
                            type="text"
                            value={formData.portalName}
                            onChange={(e) =>
                              updateFormData("portalName", e.target.value)
                            }
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
                              required
                              className="flex-1 px-4 py-3 bg-card border border-border rounded-r-xl focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              placeholder="custom-address"
                              type="text"
                              value={formData.portalUrl}
                              onChange={(e) =>
                                updateFormData("portalUrl", e.target.value)
                              }
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
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            placeholder="e.g., John Doe"
                            type="text"
                            value={formData.clientName}
                            onChange={(e) =>
                              updateFormData("clientName", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Client Email
                          </label>
                          <input
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                            placeholder="e.g., john@acmecorp.com"
                            type="email"
                            value={formData.clientEmail}
                            onChange={(e) =>
                              updateFormData("clientEmail", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Description
                          </label>
                          <textarea
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground resize-none"
                            placeholder="Brief description of this portal..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) =>
                              updateFormData("description", e.target.value)
                            }
                          />
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div />
                          <div className="flex gap-3">
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
                              onClick={() => setCurrentStep("branding")}
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
                                className="w-20 h-10 rounded-xl border border-border cursor-pointer"
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) =>
                                  updateFormData("primaryColor", e.target.value)
                                }
                              />
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

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Secondary Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                className="w-20 h-10 rounded-xl border border-border cursor-pointer"
                                type="color"
                                value={formData.secondaryColor}
                                onChange={(e) =>
                                  updateFormData(
                                    "secondaryColor",
                                    e.target.value,
                                  )
                                }
                              />
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
                              accept="image/*"
                              className="hidden"
                              id="logo"
                              type="file"
                              onChange={(e) =>
                                updateFormData("logo", e.target.files?.[0])
                              }
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
                              onClick={() => setCurrentStep("messaging")}
                            >
                              Jump to Finish
                            </button>
                            <button
                              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                              type="button"
                              onClick={() => setCurrentStep("storage")}
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
                            <Select
                              className="w-full"
                              label="Storage Provider"
                              selectedKeys={[formData.storageProvider]}
                              onChange={(e) =>
                                updateFormData(
                                  "storageProvider",
                                  e.target.value,
                                )
                              }
                            >
                              <SelectItem key="local">Local Storage</SelectItem>
                              <SelectItem key="s3">Amazon S3</SelectItem>
                              <SelectItem key="azure">
                                Azure Blob Storage
                              </SelectItem>
                              <SelectItem key="gcs">
                                Google Cloud Storage
                              </SelectItem>
                              <SelectItem key="dropbox">Dropbox</SelectItem>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Storage Limit (GB)
                            </label>
                            <input
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              type="number"
                              value={formData.storageLimit}
                              onChange={(e) =>
                                updateFormData("storageLimit", e.target.value)
                              }
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Allowed File Types
                            </label>
                            <input
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              placeholder="e.g., pdf,doc,docx,jpg,png"
                              type="text"
                              value={formData.allowedFileTypes}
                              onChange={(e) =>
                                updateFormData(
                                  "allowedFileTypes",
                                  e.target.value,
                                )
                              }
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
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              type="number"
                              value={formData.maxFileSize}
                              onChange={(e) =>
                                updateFormData("maxFileSize", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              File Retention (Days)
                            </label>
                            <input
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground disabled:opacity-50"
                              disabled={!formData.autoDelete}
                              type="number"
                              value={formData.retentionDays}
                              onChange={(e) =>
                                updateFormData("retentionDays", e.target.value)
                              }
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                checked={formData.autoDelete}
                                className="w-4 h-4 rounded border-border"
                                type="checkbox"
                                onChange={(e) =>
                                  updateFormData("autoDelete", e.target.checked)
                                }
                              />
                              <span className="text-sm font-medium text-foreground">
                                Enable automatic file deletion after retention
                                period
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div />
                          <div className="flex gap-3">
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
                    )}

                    {/* Security Section */}
                    {currentStep === "security" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Access Type
                            </label>
                            <Select
                              className="w-full"
                              label="Access Type"
                              selectedKeys={[formData.accessType]}
                              onChange={(e) =>
                                updateFormData("accessType", e.target.value)
                              }
                            >
                              <SelectItem key="password">
                                Password Protected
                              </SelectItem>
                              <SelectItem key="link">
                                Secure Link Only
                              </SelectItem>
                              <SelectItem key="sso">
                                Single Sign-On (SSO)
                              </SelectItem>
                              <SelectItem key="oauth">OAuth 2.0</SelectItem>
                            </Select>
                          </div>

                          {formData.accessType === "password" && (
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Portal Password
                              </label>
                              <div className="relative">
                                <input
                                  className="w-full px-4 py-3 pr-10 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                                  type={showPassword ? "text" : "password"}
                                  value={formData.password}
                                  onChange={(e) =>
                                    updateFormData("password", e.target.value)
                                  }
                                />
                                <button
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
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
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              type="number"
                              value={formData.sessionTimeout}
                              onChange={(e) =>
                                updateFormData("sessionTimeout", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              IP Whitelist (Optional)
                            </label>
                            <input
                              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                              placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                              type="text"
                              value={formData.ipWhitelist}
                              onChange={(e) =>
                                updateFormData("ipWhitelist", e.target.value)
                              }
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Comma-separated IP addresses or CIDR ranges
                            </p>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <Checkbox
                              isSelected={formData.twoFactorAuth}
                              onValueChange={(val) =>
                                updateFormData("twoFactorAuth", val)
                              }
                            >
                              <span className="text-sm font-medium text-foreground">
                                Enable Two-Factor Authentication (2FA)
                              </span>
                            </Checkbox>

                            <Checkbox
                              isSelected={formData.encryptFiles}
                              onValueChange={(val) =>
                                updateFormData("encryptFiles", val)
                              }
                            >
                              <span className="text-sm font-medium text-foreground">
                                Encrypt files at rest (AES-256)
                              </span>
                            </Checkbox>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between">
                          <div />
                          <div className="flex gap-3">
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
                    )}

                    {/* Messaging Section */}
                    {currentStep === "messaging" && (
                      <div className="space-y-6">
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
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground resize-none"
                            placeholder="Automatic reply when files are uploaded..."
                            rows={3}
                            value={formData.autoReplyMessage}
                            onChange={(e) =>
                              updateFormData("autoReplyMessage", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-4">
                          <Checkbox
                            isSelected={formData.emailNotifications}
                            onValueChange={(val) =>
                              updateFormData("emailNotifications", val)
                            }
                          >
                            <span className="text-sm font-medium text-foreground">
                              Enable email notifications
                            </span>
                          </Checkbox>

                          <Checkbox
                            isSelected={formData.uploadNotifications}
                            onValueChange={(val) =>
                              updateFormData("uploadNotifications", val)
                            }
                          >
                            <span className="text-sm font-medium text-foreground">
                              Notify on file uploads
                            </span>
                          </Checkbox>

                          <Checkbox
                            isSelected={formData.customEmailTemplate}
                            onValueChange={(val) =>
                              updateFormData("customEmailTemplate", val)
                            }
                          >
                            <span className="text-sm font-medium text-foreground">
                              Use custom email template
                            </span>
                          </Checkbox>
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
