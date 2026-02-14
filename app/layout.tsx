import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";
import Startup from "./startup";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://dysumcorp.pro"),
  title: {
    default: `${siteConfig.name} - Collect Files from Clients | No Account Required`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Dysumcorp lets professionals collect files from clients directly to Google Drive or Dropbox. No client account needed. Secure, branded portals for CPAs, lawyers, consultants & agencies.",
  keywords: [
    "collect files from clients",
    "client file upload",
    "file collection portal",
    "receive files from clients",
    "google drive file collection",
    "dropbox file collection",
    "client document collection software",
    "professional file request tool",
    "no client account required",
    "secure file upload portal",
    "branded client portal",
    "CPA document collection",
    "lawyer file portal",
    "freelancer file management",
    "client upload link",
  ],
  authors: [{ name: "Dysumcorp" }],
  creator: "Dysumcorp",
  publisher: "Dysumcorp",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dysumcorp.pro",
    title: `${siteConfig.name} - Collect Files from Clients Directly to Google Drive or Dropbox`,
    description:
      "Professional file collection portal for freelancers, agencies & consultants. Clients upload directly to your cloud storage—no account required. Try it free.",
    siteName: siteConfig.name,
    images: [
      {
        url: "/og/homepage.png",
        width: 1200,
        height: 630,
        alt: "Dysumcorp - Collect client files directly to Google Drive or Dropbox",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - Collect Files from Clients`,
    description:
      "Collect files from clients directly to Google Drive or Dropbox. No client account needed.",
    images: ["/og/homepage.png"],
    creator: "@dysumcorp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://dysumcorp.pro",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Startup />
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
