"use client";

import { useEffect, useState } from "react";
import {
  User,
  Palette,
  HardDrive,
  Shield,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [formData, setFormData] = useState({
    // Identity
    portalName: "",
    portalUrl: "",
    clientName: "",
    clientEmail: "",
    description: "",

    // Branding
    primaryColor: "#FF6B2C",
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

  const [showPassword, setShowPassword] = useState(false);

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: "identity", label: "Identity", icon: User },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "security", label: "Security", icon: Shield },
    { id: "messaging", label: "Messaging", icon: MessageSquare },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/portals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.portalName,
          slug: formData.portalUrl,
          customDomain: formData.customDomain || null,
          whiteLabeled: false, // Can be extended based on plan
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgrade) {
          alert(`${data.error}\n\nPlease upgrade your plan to continue.`);
          router.push("/dashboard/billing");
        } else {
          alert(data.error || "Failed to create portal");
        }

        return;
      }

      alert("Portal created successfully!");
      router.push("/dashboard/portals");
    } catch (error) {
      console.error("Failed to create portal:", error);
      alert("Failed to create portal. Please try again.");
    }
  };

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

    // Check if user has access to custom domains
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-mono font-bold">CREATE NEW PORTAL</h1>
        <p className="text-muted-foreground font-mono mt-2">
          Set up a new client portal with custom configuration
        </p>
      </div>

      {/* Progress Steps */}
      <div className="border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? "border-[#FF6B2C] bg-[#FF6B2C]/10"
                        : isCompleted
                          ? "border-[#FF6B2C] bg-[#FF6B2C]"
                          : "border-border bg-background"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Icon
                        className={`w-6 h-6 ${
                          isActive ? "text-[#FF6B2C]" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </div>
                  <p
                    className={`text-sm font-mono mt-2 ${
                      isActive
                        ? "text-foreground font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      isCompleted ? "bg-[#FF6B2C]" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="border border-border bg-background p-8">
        {/* Identity Section */}
        {currentStep === "identity" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-mono font-bold mb-2">
                PORTAL IDENTITY
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                Define the basic information for your portal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-mono" htmlFor="portalName">
                  Portal Name *
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="portalName"
                  placeholder="e.g., Acme Corp Portal"
                  value={formData.portalName}
                  onChange={(e) => updateFormData("portalName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="portalUrl">
                  Portal URL Slug *
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="portalUrl"
                  placeholder="e.g., acme-corp"
                  value={formData.portalUrl}
                  onChange={(e) => updateFormData("portalUrl", e.target.value)}
                />
                <p className="text-xs text-muted-foreground font-mono">
                  yoursite.com/portal/{formData.portalUrl || "slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="clientName">
                  Client Name *
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="clientName"
                  placeholder="e.g., John Doe"
                  value={formData.clientName}
                  onChange={(e) => updateFormData("clientName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="clientEmail">
                  Client Email *
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="clientEmail"
                  placeholder="e.g., john@acmecorp.com"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    updateFormData("clientEmail", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="font-mono" htmlFor="description">
                  Description
                </Label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border-2 border-border bg-muted/30 font-mono text-sm rounded-md focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 hover:border-muted-foreground/50 transition-colors"
                  id="description"
                  placeholder="Brief description of this portal..."
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Branding Section */}
        {currentStep === "branding" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-mono font-bold mb-2">
                PORTAL BRANDING
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                Customize the look and feel of your portal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-mono" htmlFor="primaryColor">
                  Primary Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    className="w-20 h-10 rounded-none"
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      updateFormData("primaryColor", e.target.value)
                    }
                  />
                  <Input
                    className="rounded-none font-mono flex-1"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      updateFormData("primaryColor", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="secondaryColor">
                  Secondary Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    className="w-20 h-10 rounded-none"
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      updateFormData("secondaryColor", e.target.value)
                    }
                  />
                  <Input
                    className="rounded-none font-mono flex-1"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      updateFormData("secondaryColor", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="logo">
                  Portal Logo
                </Label>
                <div className="border-2 border-dashed border-border p-6 text-center hover:border-[#FF6B2C]/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-mono text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <Input
                    accept="image/*"
                    className="hidden"
                    id="logo"
                    type="file"
                    onChange={(e) =>
                      updateFormData("logo", e.target.files?.[0])
                    }
                  />
                  <Button
                    className="rounded-none font-mono"
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById("logo")?.click()}
                  >
                    SELECT FILE
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="favicon">
                  Favicon
                </Label>
                <div className="border-2 border-dashed border-border p-6 text-center hover:border-[#FF6B2C]/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-mono text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <Input
                    accept="image/*"
                    className="hidden"
                    id="favicon"
                    type="file"
                    onChange={(e) =>
                      updateFormData("favicon", e.target.files?.[0])
                    }
                  />
                  <Button
                    className="rounded-none font-mono"
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById("favicon")?.click()}
                  >
                    SELECT FILE
                  </Button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="font-mono" htmlFor="customDomain">
                  Custom Domain (Optional)
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="customDomain"
                  placeholder="e.g., portal.acmecorp.com"
                  value={formData.customDomain}
                  onChange={(e) => handleCustomDomainChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Configure DNS settings to point to your portal
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Storage Section */}
        {currentStep === "storage" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-mono font-bold mb-2">
                STORAGE CONFIGURATION
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                Configure storage settings and file management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-mono" htmlFor="storageProvider">
                  Storage Provider
                </Label>
                <select
                  className="w-full px-3 py-2 border-2 border-border bg-muted/30 font-mono text-sm rounded-md focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 hover:border-muted-foreground/50 transition-colors"
                  id="storageProvider"
                  value={formData.storageProvider}
                  onChange={(e) =>
                    updateFormData("storageProvider", e.target.value)
                  }
                >
                  <option value="local">Local Storage</option>
                  <option value="s3">Amazon S3</option>
                  <option value="azure">Azure Blob Storage</option>
                  <option value="gcs">Google Cloud Storage</option>
                  <option value="dropbox">Dropbox</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="storageLimit">
                  Storage Limit (GB)
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="storageLimit"
                  type="number"
                  value={formData.storageLimit}
                  onChange={(e) =>
                    updateFormData("storageLimit", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="font-mono" htmlFor="allowedFileTypes">
                  Allowed File Types
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="allowedFileTypes"
                  placeholder="e.g., pdf,doc,docx,jpg,png"
                  value={formData.allowedFileTypes}
                  onChange={(e) =>
                    updateFormData("allowedFileTypes", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Comma-separated list of file extensions
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="maxFileSize">
                  Max File Size (MB)
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="maxFileSize"
                  type="number"
                  value={formData.maxFileSize}
                  onChange={(e) =>
                    updateFormData("maxFileSize", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="retentionDays">
                  File Retention (Days)
                </Label>
                <Input
                  className="rounded-none font-mono"
                  disabled={!formData.autoDelete}
                  id="retentionDays"
                  type="number"
                  value={formData.retentionDays}
                  onChange={(e) =>
                    updateFormData("retentionDays", e.target.value)
                  }
                />
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    checked={formData.autoDelete}
                    className="w-4 h-4"
                    id="autoDelete"
                    type="checkbox"
                    onChange={(e) =>
                      updateFormData("autoDelete", e.target.checked)
                    }
                  />
                  <Label
                    className="font-mono cursor-pointer"
                    htmlFor="autoDelete"
                  >
                    Enable automatic file deletion after retention period
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Section */}
        {currentStep === "security" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-mono font-bold mb-2">
                SECURITY SETTINGS
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                Configure access control and security features
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-mono" htmlFor="accessType">
                  Access Type
                </Label>
                <select
                  className="w-full px-3 py-2 border-2 border-border bg-muted/30 font-mono text-sm rounded-md focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 hover:border-muted-foreground/50 transition-colors"
                  id="accessType"
                  value={formData.accessType}
                  onChange={(e) => updateFormData("accessType", e.target.value)}
                >
                  <option value="password">Password Protected</option>
                  <option value="link">Secure Link Only</option>
                  <option value="sso">Single Sign-On (SSO)</option>
                  <option value="oauth">OAuth 2.0</option>
                </select>
              </div>

              {formData.accessType === "password" && (
                <div className="space-y-2">
                  <Label className="font-mono" htmlFor="password">
                    Portal Password
                  </Label>
                  <div className="relative">
                    <Input
                      className="rounded-none font-mono pr-10"
                      id="password"
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

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="sessionTimeout">
                  Session Timeout (minutes)
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="sessionTimeout"
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={(e) =>
                    updateFormData("sessionTimeout", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="ipWhitelist">
                  IP Whitelist (Optional)
                </Label>
                <Input
                  className="rounded-none font-mono"
                  id="ipWhitelist"
                  placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                  value={formData.ipWhitelist}
                  onChange={(e) =>
                    updateFormData("ipWhitelist", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Comma-separated IP addresses or CIDR ranges
                </p>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    checked={formData.twoFactorAuth}
                    className="w-4 h-4"
                    id="twoFactorAuth"
                    type="checkbox"
                    onChange={(e) =>
                      updateFormData("twoFactorAuth", e.target.checked)
                    }
                  />
                  <Label
                    className="font-mono cursor-pointer"
                    htmlFor="twoFactorAuth"
                  >
                    Enable Two-Factor Authentication (2FA)
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    checked={formData.encryptFiles}
                    className="w-4 h-4"
                    id="encryptFiles"
                    type="checkbox"
                    onChange={(e) =>
                      updateFormData("encryptFiles", e.target.checked)
                    }
                  />
                  <Label
                    className="font-mono cursor-pointer"
                    htmlFor="encryptFiles"
                  >
                    Encrypt files at rest (AES-256)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messaging Section */}
        {currentStep === "messaging" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-mono font-bold mb-2">
                MESSAGING & NOTIFICATIONS
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                Configure communication and notification settings
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-mono" htmlFor="welcomeMessage">
                  Welcome Message
                </Label>
                <textarea
                  className="w-full min-h-[120px] px-3 py-2 border-2 border-border bg-muted/30 font-mono text-sm rounded-md focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 hover:border-muted-foreground/50 transition-colors"
                  id="welcomeMessage"
                  placeholder="Enter a welcome message for your clients..."
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    updateFormData("welcomeMessage", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground font-mono">
                  This message will be displayed when clients first access the
                  portal
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-mono" htmlFor="autoReplyMessage">
                  Auto-Reply Message (Optional)
                </Label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border-2 border-border bg-muted/30 font-mono text-sm rounded-md focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 hover:border-muted-foreground/50 transition-colors"
                  id="autoReplyMessage"
                  placeholder="Automatic reply when files are uploaded..."
                  value={formData.autoReplyMessage}
                  onChange={(e) =>
                    updateFormData("autoReplyMessage", e.target.value)
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    checked={formData.emailNotifications}
                    className="w-4 h-4"
                    id="emailNotifications"
                    type="checkbox"
                    onChange={(e) =>
                      updateFormData("emailNotifications", e.target.checked)
                    }
                  />
                  <Label
                    className="font-mono cursor-pointer"
                    htmlFor="emailNotifications"
                  >
                    Enable email notifications
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    checked={formData.uploadNotifications}
                    className="w-4 h-4"
                    id="uploadNotifications"
                    type="checkbox"
                    onChange={(e) =>
                      updateFormData("uploadNotifications", e.target.checked)
                    }
                  />
                  <Label
                    className="font-mono cursor-pointer"
                    htmlFor="uploadNotifications"
                  >
                    Notify on file uploads
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    checked={formData.customEmailTemplate}
                    className="w-4 h-4"
                    id="customEmailTemplate"
                    type="checkbox"
                    onChange={(e) =>
                      updateFormData("customEmailTemplate", e.target.checked)
                    }
                  />
                  <Label
                    className="font-mono cursor-pointer"
                    htmlFor="customEmailTemplate"
                  >
                    Use custom email template
                  </Label>
                </div>
              </div>

              {formData.customEmailTemplate && (
                <div className="border border-border p-4 bg-muted/30">
                  <p className="text-sm font-mono text-muted-foreground mb-2">
                    Custom email templates can be configured after portal
                    creation
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border border-border bg-background p-6">
        <Button
          className="rounded-none font-mono border-2"
          disabled={currentStepIndex === 0}
          variant="outline"
          onClick={handlePrevious}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          PREVIOUS
        </Button>

        <div className="text-sm font-mono text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length}
        </div>

        {currentStepIndex === steps.length - 1 ? (
          <Button
            className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
            onClick={handleSubmit}
          >
            CREATE PORTAL
            <Check className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
            onClick={handleNext}
          >
            NEXT
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Paywall Modal */}
      <PaywallModal />
    </div>
  );
}
