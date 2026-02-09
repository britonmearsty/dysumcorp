import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Email templates
export const emailTemplates = {
  fileUploaded: {
    subject: "New files uploaded to your portal",
    html: (data: {
      portalName: string;
      files: Array<{ name: string; size: string }>;
      uploaderName?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">📁 New Files Uploaded</h2>
          <p style="color: #666; margin-bottom: 20px;">
            ${data.uploaderName ? `${data.uploaderName} has` : "Someone has"} uploaded new files to your portal "<strong>${data.portalName}</strong>".
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Files uploaded:</h3>
            <ul style="list-style: none; padding: 0;">
              ${data.files
                .map(
                  (file) => `
                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                  <strong>${file.name}</strong> 
                  <span style="color: #999; font-size: 0.9em;">(${file.size})</span>
                </li>
              `,
                )
                .join("")}
            </ul>
          </div>
          
          <p style="color: #666; font-size: 0.9em;">
            You can view and download these files from your dashboard.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 0.8em;">
            This is an automated notification from DysumCorp Portal.
          </p>
        </div>
      </div>
    `,
  },

  portalCreated: {
    subject: "Your new portal is ready",
    html: (data: { portalName: string; portalSlug: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">🎉 Portal Created Successfully</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Your portal "<strong>${data.portalName}</strong>" has been created and is ready to use.
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Portal Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${data.portalName}</p>
            <p style="margin: 5px 0;"><strong>URL:</strong> ${process.env.NEXT_PUBLIC_APP_URL}/portal/${data.portalSlug}</p>
          </div>
          
          <p style="color: #666; font-size: 0.9em;">
            Share this URL with your clients to start collecting files.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 0.8em;">
            This is an automated notification from DysumCorp Portal.
          </p>
        </div>
      </div>
    `,
  },

  fileDownloaded: {
    subject: "File downloaded from your portal",
    html: (data: {
      fileName: string;
      portalName: string;
      downloaderName?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">📥 File Downloaded</h2>
          <p style="color: #666; margin-bottom: 20px;">
            ${data.downloaderName ? `${data.downloaderName} has` : "Someone has"} downloaded a file from your portal "<strong>${data.portalName}</strong>".
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Downloaded file:</h3>
            <p style="margin: 5px 0;"><strong>${data.fileName}</strong></p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 0.8em;">
            This is an automated notification from DysumCorp Portal.
          </p>
        </div>
      </div>
    `,
  },

  storageWarning: {
    subject: "Storage limit warning",
    html: (data: {
      usedStorage: string;
      totalStorage: string;
      percentage: number;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7;">
          <h2 style="color: #856404; margin-bottom: 20px;">⚠️ Storage Limit Warning</h2>
          <p style="color: #856404; margin-bottom: 20px;">
            You have used ${data.percentage}% of your storage limit.
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Storage Usage:</h3>
            <p style="margin: 5px 0;"><strong>Used:</strong> ${data.usedStorage}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> ${data.totalStorage}</p>
            <p style="margin: 5px 0;"><strong>Available:</strong> ${data.percentage > 90 ? "Very low" : data.percentage > 75 ? "Low" : "Good"}</p>
          </div>
          
          <p style="color: #856404; font-size: 0.9em;">
            Consider upgrading your plan or deleting old files to avoid upload restrictions.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 0.8em;">
            This is an automated notification from DysumCorp Portal.
          </p>
        </div>
      </div>
    `,
  },
};

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.RESEND_FROM_EMAIL || "noreply@dysumcorp.com",
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
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

// Helper functions for specific email types
export async function sendFileUploadNotification({
  userEmail,
  portalName,
  files,
  uploaderName,
}: {
  userEmail: string;
  portalName: string;
  files: Array<{ name: string; size: string }>;
  uploaderName?: string;
}) {
  const template = emailTemplates.fileUploaded;

  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html({ portalName, files, uploaderName }),
  });
}

export async function sendPortalCreatedNotification({
  userEmail,
  portalName,
  portalSlug,
}: {
  userEmail: string;
  portalName: string;
  portalSlug: string;
}) {
  const template = emailTemplates.portalCreated;

  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html({ portalName, portalSlug }),
  });
}

export async function sendFileDownloadNotification({
  userEmail,
  fileName,
  portalName,
  downloaderName,
}: {
  userEmail: string;
  fileName: string;
  portalName: string;
  downloaderName?: string;
}) {
  const template = emailTemplates.fileDownloaded;

  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html({ fileName, portalName, downloaderName }),
  });
}

export async function sendStorageWarning({
  userEmail,
  usedStorage,
  totalStorage,
  percentage,
}: {
  userEmail: string;
  usedStorage: string;
  totalStorage: string;
  percentage: number;
}) {
  const template = emailTemplates.storageWarning;

  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html({ usedStorage, totalStorage, percentage }),
  });
}
