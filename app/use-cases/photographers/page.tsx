import { Metadata } from "next";
import { PhotographersClient } from "./photographers-client";

export const metadata: Metadata = {
  title: "Receive Client Photos & Videos Directly to Cloud | For Photographers",
  description:
    "Collect high-resolution photos and videos from clients without large email attachments. Clients upload directly to Google Drive or Dropbox.",
  alternates: {
    canonical: "https://dysumcorp.pro/use-cases/photographers",
  },
};

export default function PhotographersPage() {
  return <PhotographersClient />;
}
