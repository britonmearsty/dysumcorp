import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Dysumcorp | File Collection Tips & Best Practices",
  description:
    "Learn how to collect files from clients efficiently. Tips, best practices, and guides for freelancers, agencies, accountants, and lawyers.",
  keywords: [
    "file collection tips",
    "client file management",
    "freelancer productivity",
    "document collection guide",
  ],
  openGraph: {
    title: "Blog - Dysumcorp | File Collection Tips & Best Practices",
    description: "Learn how to collect files from clients efficiently.",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
