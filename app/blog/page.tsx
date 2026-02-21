import { Metadata } from "next";
import { BlogClient } from "./blog-client";

export const metadata: Metadata = {
  title: "Blog - Tips for Collecting Client Files | Dysumcorp",
  description:
    "Guides and best practices for collecting files from clients securely and efficiently. Improve your workflow with Dysumcorp.",
  alternates: {
    canonical: "https://dysumcorp.pro/blog",
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
