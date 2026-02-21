import { Metadata } from "next";
import { FreelancersClient } from "./freelancers-client";

export const metadata: Metadata = {
  title: "Collect Client Files Without the Email Chase | For Freelancers",
  description:
    "Designers, developers, writers & consultants use Dysumcorp to collect files from clients directly to Google Drive or Dropbox. No client account required.",
  alternates: {
    canonical: "https://dysumcorp.pro/use-cases/freelancers",
  },
};

export default function FreelancersPage() {
  return <FreelancersClient />;
}
