import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";
import Startup from "./startup";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  ),
  title: {
    default: `${siteConfig.name} - Secure Client File Collection Portal | No Login Required`,
    template: `%s - ${siteConfig.name}`,
  },
  description:
    "Professional branded file collection portals for CPAs, lawyers, and consultants. Secure client document uploads with no account required. Bank-level encryption, custom branding, instant notifications.",
  keywords: [
    "client file collection",
    "secure file upload portal",
    "branded file sharing",
    "document collection software",
    "client portal",
    "secure file transfer",
    "professional file sharing",
    "CPA document collection",
    "lawyer file portal",
    "consultant file sharing",
    "no login file upload",
    "white label file portal",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dysumcorp.pro",
    title: `${siteConfig.name} - Secure Client File Collection Portal`,
    description:
      "Professional branded file collection portals with bank-level security. Clients upload files in seconds—no account required.",
    siteName: siteConfig.name,
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Client File Collection Portal`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - Secure Client File Collection Portal`,
    description:
      "Professional branded file collection portals with bank-level security. Clients upload files in seconds—no account required.",
    images: ["/logo.svg"],
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
