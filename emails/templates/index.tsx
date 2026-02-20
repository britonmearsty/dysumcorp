import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dysumcorp.pro";

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded-lg bg-white p-8">
            <Section className="mt-4">
              <Img
                src={`${baseUrl}/logo.svg`}
                width="40"
                height="40"
                alt="DysumCorp"
                className="mx-auto"
              />
            </Section>
            {children}
            <Hr className="my-6 border-gray-200" />
            <Section>
              <Text className="text-xs text-gray-500">
                DysumCorp Portal - Secure file sharing made simple
              </Text>
              <Text className="text-xs text-gray-400">
                This email was sent to you because you have an account on
                DysumCorp. If you did not expect this email, please ignore it.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  const previewText = "Welcome to DysumCorp Portal!";

  return (
    <EmailLayout previewText={previewText}>
      <Heading className="text-center text-2xl font-bold text-gray-800">
        Welcome to DysumCorp! 🎉
      </Heading>
      <Text className="text-base text-gray-600">Hi {userName},</Text>
      <Text className="text-base text-gray-600">
        Thank you for joining DysumCorp Portal! We're excited to have you on
        board. Our platform makes it easy to create beautiful file upload
        portals for your clients.
      </Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded bg-blue-600 px-5 py-3 text-base font-semibold text-white no-underline"
          href={`${baseUrl}/dashboard`}
        >
          Get Started
        </Button>
      </Section>
      <Text className="text-base text-gray-600">
        Here's what you can do with DysumCorp:
      </Text>
      <ul className="list-disc pl-5 text-base text-gray-600">
        <li>Create customizable upload portals for your clients</li>
        <li>Connect to Google Drive, Dropbox, or other storage providers</li>
        <li>Track file uploads and downloads in real-time</li>
        <li>Set up custom branding and white-label options</li>
        <li>Manage storage limits and user access</li>
      </ul>
      <Text className="text-base text-gray-600">
        If you have any questions, feel free to reach out to our support team.
      </Text>
      <Text className="text-base text-gray-600">
        Best regards,
        <br />
        The DysumCorp Team
      </Text>
    </EmailLayout>
  );
}

interface SignInEmailProps {
  userName: string;
  ipAddress?: string;
  location?: string;
  time: string;
}

export function SignInEmail({
  userName,
  ipAddress,
  location,
  time,
}: SignInEmailProps) {
  const previewText = "New sign-in to your DysumCorp account";

  return (
    <EmailLayout previewText={previewText}>
      <Heading className="text-center text-2xl font-bold text-gray-800">
        New Sign-In Detected 🔐
      </Heading>
      <Text className="text-base text-gray-600">Hi {userName},</Text>
      <Text className="text-base text-gray-600">
        We noticed a new sign-in to your DysumCorp account.
      </Text>
      <Container className="my-4 rounded bg-gray-50 p-4">
        <Text className="my-1 text-sm font-semibold text-gray-700">
          Sign-in details:
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Time:</strong> {time}
        </Text>
        {ipAddress && (
          <Text className="my-1 text-sm text-gray-600">
            <strong>IP Address:</strong> {ipAddress}
          </Text>
        )}
        {location && (
          <Text className="my-1 text-sm text-gray-600">
            <strong>Location:</strong> {location}
          </Text>
        )}
      </Container>
      <Text className="text-base text-gray-600">
        If this was you, you can safely ignore this email. If you didn't sign
        in, please secure your account immediately by changing your password.
      </Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded bg-red-600 px-5 py-3 text-base font-semibold text-white no-underline"
          href={`${baseUrl}/settings/security`}
        >
          Secure Account
        </Button>
      </Section>
      <Text className="text-base text-gray-600">
        Best regards,
        <br />
        The DysumCorp Team
      </Text>
    </EmailLayout>
  );
}

interface UploadCompletionEmailProps {
  userName: string;
  portalName: string;
  portalSlug: string;
  files: Array<{
    name: string;
    size: string;
    uploadedAt: string;
  }>;
  uploaderName?: string;
  uploaderEmail?: string;
  totalSize: string;
  fileCount: number;
}

export function UploadCompletionEmail({
  userName,
  portalName,
  portalSlug,
  files,
  uploaderName,
  uploaderEmail,
  totalSize,
  fileCount,
}: UploadCompletionEmailProps) {
  const previewText = `New files uploaded to ${portalName}`;

  return (
    <EmailLayout previewText={previewText}>
      <Heading className="text-center text-2xl font-bold text-gray-800">
        📁 Files Uploaded to {portalName}
      </Heading>
      <Text className="text-base text-gray-600">Hi {userName},</Text>
      <Text className="text-base text-gray-600">
        {uploaderName ? (
          <>
            <strong>{uploaderName}</strong>
            {uploaderEmail && ` (${uploaderEmail})`} has uploaded{" "}
            <strong>
              {fileCount} file{fileCount > 1 ? "s" : ""}
            </strong>{" "}
            to your portal "<strong>{portalName}</strong>".
          </>
        ) : (
          <>
            Someone has uploaded{" "}
            <strong>
              {fileCount} file{fileCount > 1 ? "s" : ""}
            </strong>{" "}
            to your portal "<strong>{portalName}</strong>".
          </>
        )}
      </Text>
      <Container className="my-4 rounded bg-gray-50 p-4">
        <Text className="my-1 text-sm font-semibold text-gray-700">
          Upload Summary:
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Total Files:</strong> {fileCount}
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Total Size:</strong> {totalSize}
        </Text>
        <Text className="my-1 text-sm font-semibold text-gray-700 mt-3">
          Files:
        </Text>
        {files.map((file, index) => (
          <Text key={index} className="my-1 text-sm text-gray-600">
            • {file.name} ({file.size}) - {file.uploadedAt}
          </Text>
        ))}
      </Container>
      <Section className="my-6 text-center">
        <Button
          className="rounded bg-blue-600 px-5 py-3 text-base font-semibold text-white no-underline"
          href={`${baseUrl}/portal/${portalSlug}`}
        >
          View Portal
        </Button>
      </Section>
      <Text className="text-base text-gray-600">
        You can view and download these files from your dashboard.
      </Text>
      <Text className="text-base text-gray-600">
        Best regards,
        <br />
        The DysumCorp Team
      </Text>
    </EmailLayout>
  );
}

interface PortalCreatedEmailProps {
  userName: string;
  portalName: string;
  portalSlug: string;
}

export function PortalCreatedEmail({
  userName,
  portalName,
  portalSlug,
}: PortalCreatedEmailProps) {
  const previewText = `Your portal "${portalName}" is ready!`;

  return (
    <EmailLayout previewText={previewText}>
      <Heading className="text-center text-2xl font-bold text-gray-800">
        🎉 Portal Created Successfully!
      </Heading>
      <Text className="text-base text-gray-600">Hi {userName},</Text>
      <Text className="text-base text-gray-600">
        Your portal "<strong>{portalName}</strong>" has been created and is
        ready to use!
      </Text>
      <Container className="my-4 rounded bg-gray-50 p-4">
        <Text className="my-1 text-sm font-semibold text-gray-700">
          Portal Details:
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Name:</strong> {portalName}
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>URL:</strong>{" "}
          <Link href={`${baseUrl}/portal/${portalSlug}`}>
            {baseUrl}/portal/{portalSlug}
          </Link>
        </Text>
      </Container>
      <Section className="my-6 text-center">
        <Button
          className="rounded bg-blue-600 px-5 py-3 text-base font-semibold text-white no-underline"
          href={`${baseUrl}/portal/${portalSlug}`}
        >
          View Portal
        </Button>
      </Section>
      <Text className="text-base text-gray-600">
        Share this URL with your clients to start collecting files!
      </Text>
      <Text className="text-base text-gray-600">
        Best regards,
        <br />
        The DysumCorp Team
      </Text>
    </EmailLayout>
  );
}

interface FileDownloadedEmailProps {
  userName: string;
  portalName: string;
  fileName: string;
  downloaderName?: string;
  downloaderEmail?: string;
  ipAddress?: string;
  time: string;
}

export function FileDownloadedEmail({
  userName,
  portalName,
  fileName,
  downloaderName,
  downloaderEmail,
  ipAddress,
  time,
}: FileDownloadedEmailProps) {
  const previewText = `File downloaded from ${portalName}`;

  return (
    <EmailLayout previewText={previewText}>
      <Heading className="text-center text-2xl font-bold text-gray-800">
        📥 File Downloaded from {portalName}
      </Heading>
      <Text className="text-base text-gray-600">Hi {userName},</Text>
      <Text className="text-base text-gray-600">
        {downloaderName ? (
          <>
            <strong>{downloaderName}</strong>
            {downloaderEmail && ` (${downloaderEmail})`} has downloaded a file
            from your portal "<strong>{portalName}</strong>".
          </>
        ) : (
          <>
            Someone has downloaded a file from your portal "
            <strong>{portalName}</strong>".
          </>
        )}
      </Text>
      <Container className="my-4 rounded bg-gray-50 p-4">
        <Text className="my-1 text-sm font-semibold text-gray-700">
          Download details:
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>File:</strong> {fileName}
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Time:</strong> {time}
        </Text>
        {downloaderName && (
          <Text className="my-1 text-sm text-gray-600">
            <strong>Downloaded by:</strong> {downloaderName}
            {downloaderEmail && ` (${downloaderEmail})`}
          </Text>
        )}
        {ipAddress && (
          <Text className="my-1 text-sm text-gray-600">
            <strong>IP Address:</strong> {ipAddress}
          </Text>
        )}
      </Container>
      <Text className="text-base text-gray-600">
        Best regards,
        <br />
        The DysumCorp Team
      </Text>
    </EmailLayout>
  );
}

interface StorageWarningEmailProps {
  userName: string;
  usedStorage: string;
  totalStorage: string;
  percentage: number;
}

export function StorageWarningEmail({
  userName,
  usedStorage,
  totalStorage,
  percentage,
}: StorageWarningEmailProps) {
  const previewText = "Storage limit warning - Action required";

  return (
    <EmailLayout previewText={previewText}>
      <Heading className="text-center text-2xl font-bold text-gray-800">
        ⚠️ Storage Limit Warning
      </Heading>
      <Text className="text-base text-gray-600">Hi {userName},</Text>
      <Text className="text-base text-gray-600">
        You have used <strong>{percentage}%</strong> of your storage limit.
        {percentage > 90
          ? " Your storage is critically low!"
          : " Consider upgrading soon to avoid interruption."}
      </Text>
      <Container className="my-4 rounded bg-yellow-50 p-4">
        <Text className="my-1 text-sm font-semibold text-gray-700">
          Storage Usage:
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Used:</strong> {usedStorage}
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Total:</strong> {totalStorage}
        </Text>
        <Text className="my-1 text-sm text-gray-600">
          <strong>Available:</strong>{" "}
          {percentage > 90
            ? "🔴 Very low"
            : percentage > 75
              ? "🟡 Low"
              : "🟢 Good"}
        </Text>
      </Container>
      <Text className="text-base text-gray-600">
        Consider upgrading your plan or deleting old files to avoid upload
        restrictions.
      </Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded bg-blue-600 px-5 py-3 text-base font-semibold text-white no-underline"
          href={`${baseUrl}/dashboard/billing`}
        >
          Upgrade Plan
        </Button>
      </Section>
      <Text className="text-base text-gray-600">
        Best regards,
        <br />
        The DysumCorp Team
      </Text>
    </EmailLayout>
  );
}
