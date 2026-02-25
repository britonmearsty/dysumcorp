import { Resend } from "resend";
import { render } from "@react-email/render";

import { prisma } from "@/lib/prisma";
import {
  WelcomeEmail,
  SignInEmail,
  UploadCompletionEmail,
  PortalCreatedEmail,
  FileDownloadedEmail,
  StorageWarningEmail,
  SupportRequestEmail,
  WeeklyReportEmail,
} from "@/emails/templates";

let resend: Resend | null = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "DysumCorp <noreply@dysumcorp.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dysumcorp.com";

export interface EmailResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

async function sendEmailInternal({
  to,
  subject,
  html,
  from = FROM_EMAIL,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email send");

      return { success: false, error: "Email service not configured" };
    }

    const resendClient = getResendClient();

    if (!resendClient) {
      console.warn("Failed to initialize Resend client");

      return { success: false, error: "Email service not configured" };
    }

    const { data, error } = await resendClient.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);

      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);

    return { success: false, error };
  }
}

interface UserNotificationSettings {
  notifyOnUpload: boolean;
  notifyOnDownload: boolean;
  notifyOnSignIn: boolean;
  notifyOnPortalCreate: boolean;
  notifyOnStorageWarning: boolean;
  weeklyReports: boolean;
}

export async function getUserNotificationSettings(
  email: string,
): Promise<UserNotificationSettings | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        notifyOnUpload: true,
        notifyOnDownload: true,
        notifyOnSignIn: true,
        notifyOnPortalCreate: true,
        notifyOnStorageWarning: true,
        weeklyReports: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching user notification settings:", error);

    return null;
  }
}

export async function sendWelcomeEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}): Promise<EmailResult> {
  const email = WelcomeEmail({ userName });
  const html = await render(email);

  return sendEmailInternal({
    to,
    subject: "Welcome to DysumCorp Portal! 🎉",
    html,
  });
}

export async function sendSignInNotification({
  to,
  userName,
  ipAddress,
  location,
  time,
}: {
  to: string;
  userName: string;
  ipAddress?: string;
  location?: string;
  time?: string;
}): Promise<EmailResult> {
  const settings = await getUserNotificationSettings(to);

  if (settings && !settings.notifyOnSignIn) {
    console.log(`Sign-in notifications disabled for user: ${to}`);

    return { success: true, data: "Notifications disabled" };
  }

  const email = SignInEmail({
    userName,
    ipAddress,
    location,
    time: time || new Date().toLocaleString(),
  });
  const html = await render(email);

  return sendEmailInternal({
    to,
    subject: "New sign-in to your DysumCorp account 🔐",
    html,
  });
}

export async function sendUploadCompletionNotification({
  to,
  userName,
  portalName,
  portalSlug,
  files,
  uploaderName,
  uploaderEmail,
  totalSize,
  fileCount,
}: {
  to: string;
  userName: string;
  portalName: string;
  portalSlug: string;
  files: Array<{ name: string; size: string; uploadedAt: string }>;
  uploaderName?: string;
  uploaderEmail?: string;
  totalSize: string;
  fileCount: number;
}): Promise<EmailResult> {
  const settings = await getUserNotificationSettings(to);

  if (settings && !settings.notifyOnUpload) {
    console.log(`Upload notifications disabled for user: ${to}`);

    return { success: true, data: "Notifications disabled" };
  }

  const email = UploadCompletionEmail({
    userName,
    portalName,
    portalSlug,
    files,
    uploaderName,
    uploaderEmail,
    totalSize,
    fileCount,
  });
  const html = await render(email);

  return sendEmailInternal({
    to,
    subject: `📁 New files uploaded to ${portalName}`,
    html,
  });
}

export async function sendPortalCreatedNotification({
  to,
  userName,
  portalName,
  portalSlug,
}: {
  to: string;
  userName: string;
  portalName: string;
  portalSlug: string;
}): Promise<EmailResult> {
  const settings = await getUserNotificationSettings(to);

  if (settings && !settings.notifyOnPortalCreate) {
    console.log(`Portal created notifications disabled for user: ${to}`);

    return { success: true, data: "Notifications disabled" };
  }

  const email = PortalCreatedEmail({ userName, portalName, portalSlug });
  const html = await render(email);

  return sendEmailInternal({
    to,
    subject: `Your portal "${portalName}" is ready! 🎉`,
    html,
  });
}

export async function sendFileDownloadNotification({
  userEmail,
  userName,
  portalName,
  fileName,
  downloaderName,
  downloaderEmail,
  ipAddress,
  time,
}: {
  userEmail: string;
  userName?: string;
  portalName: string;
  fileName: string;
  downloaderName?: string;
  downloaderEmail?: string;
  ipAddress?: string;
  time?: string;
}): Promise<EmailResult> {
  const settings = await getUserNotificationSettings(userEmail);

  if (settings && !settings.notifyOnDownload) {
    console.log(`Download notifications disabled for user: ${userEmail}`);

    return { success: true, data: "Notifications disabled" };
  }

  const email = FileDownloadedEmail({
    userName: userName || userEmail.split("@")[0],
    portalName,
    fileName,
    downloaderName,
    downloaderEmail,
    ipAddress,
    time: time || new Date().toLocaleString(),
  });
  const html = await render(email);

  return sendEmailInternal({
    to: userEmail,
    subject: `📥 File downloaded from ${portalName}`,
    html,
  });
}

export async function sendStorageWarning({
  userEmail,
  userName,
  usedStorage,
  totalStorage,
  percentage,
}: {
  userEmail: string;
  userName?: string;
  usedStorage: string;
  totalStorage: string;
  percentage: number;
}): Promise<EmailResult> {
  const settings = await getUserNotificationSettings(userEmail);

  if (settings && !settings.notifyOnStorageWarning) {
    console.log(
      `Storage warning notifications disabled for user: ${userEmail}`,
    );

    return { success: true, data: "Notifications disabled" };
  }

  const email = StorageWarningEmail({
    userName: userName || userEmail.split("@")[0],
    usedStorage,
    totalStorage,
    percentage,
  });
  const html = await render(email);

  return sendEmailInternal({
    to: userEmail,
    subject: "Storage limit warning ⚠️",
    html,
  });
}

export async function sendFileUploadNotification({
  userEmail,
  portalName,
  portalSlug,
  files,
  uploaderName,
  uploaderEmail,
}: {
  userEmail: string;
  portalName: string;
  portalSlug?: string;
  files: Array<{ name: string; size: string }>;
  uploaderName?: string;
  uploaderEmail?: string;
}): Promise<EmailResult> {
  const settings = await getUserNotificationSettings(userEmail);

  if (settings && !settings.notifyOnUpload) {
    console.log(`Upload notifications disabled for user: ${userEmail}`);

    return { success: true, data: "Notifications disabled" };
  }

  const email = UploadCompletionEmail({
    userName: userEmail.split("@")[0],
    portalName,
    portalSlug: portalSlug || "",
    files: files.map((f) => ({
      name: f.name,
      size: f.size,
      uploadedAt: new Date().toLocaleString(),
    })),
    uploaderName,
    uploaderEmail,
    totalSize: files
      .reduce((acc, f) => acc + parseFileSize(f.size), 0)
      .toString(),
    fileCount: files.length,
  });
  const html = await render(email);

  return sendEmailInternal({
    to: userEmail,
    subject: `📁 New file uploaded to ${portalName}`,
    html,
  });
}

function parseFileSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);

  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  return value * (units[unit] || 1);
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<EmailResult> {
  return sendEmailInternal({ to, subject, html, from });
}

export async function sendSupportRequestEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<EmailResult> {
  const supportEmail = SupportRequestEmail({ name, email, subject, message });
  const html = await render(supportEmail);

  return sendEmailInternal({
    to: "support@dysumcorp.pro",
    subject: `Support Request: ${subject}`,
    html,
    from: `Support Form <noreply@dysumcorp.pro>`,
  });
}

export async function sendWeeklyReport({
  to,
  userName,
  weekStart,
  weekEnd,
  totalFiles,
  totalSize,
  newFiles,
  newPortals,
  totalDownloads,
  storageUsed,
  storageLimit,
  storagePercentage,
  topPortals,
}: {
  to: string;
  userName: string;
  weekStart: string;
  weekEnd: string;
  totalFiles: number;
  totalSize: string;
  newFiles: number;
  newPortals: number;
  totalDownloads: number;
  storageUsed: string;
  storageLimit: string;
  storagePercentage: number;
  topPortals: Array<{ name: string; files: number; downloads: number }>;
}): Promise<EmailResult> {
  const settings = await getUserNotificationSettings(to);

  if (settings && !settings.weeklyReports) {
    console.log(`Weekly reports disabled for user: ${to}`);
    return { success: true, data: "Weekly reports disabled" };
  }

  const email = WeeklyReportEmail({
    userName,
    weekStart,
    weekEnd,
    totalFiles,
    totalSize,
    newFiles,
    newPortals,
    totalDownloads,
    storageUsed,
    storageLimit,
    storagePercentage,
    topPortals,
  });
  const html = await render(email);

  return sendEmailInternal({
    to,
    subject: `📊 Your Weekly Activity Report - ${weekStart} to ${weekEnd}`,
    html,
  });
}
