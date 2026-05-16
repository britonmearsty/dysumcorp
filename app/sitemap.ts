import { MetadataRoute } from "next";

const baseUrl = "https://dysumcorp.pro";

const pages = [
  { url: baseUrl, changeFrequency: "monthly" as const, priority: 1.0 },
  { url: `${baseUrl}/pricing`, changeFrequency: "monthly" as const, priority: 0.9 },
  { url: `${baseUrl}/features`, changeFrequency: "monthly" as const, priority: 0.8 },
  { url: `${baseUrl}/integrations/google-drive`, changeFrequency: "monthly" as const, priority: 0.8 },
  { url: `${baseUrl}/integrations/dropbox`, changeFrequency: "monthly" as const, priority: 0.8 },
  { url: `${baseUrl}/use-cases`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/use-cases/freelancers`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/use-cases/marketing-agencies`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/use-cases/photographers`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/use-cases/accountants`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/use-cases/lawyers`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/use-cases/wealth-advisors`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/use-cases/real-estate`, changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${baseUrl}/terms`, changeFrequency: "yearly" as const, priority: 0.3 },
  { url: `${baseUrl}/privacy`, changeFrequency: "yearly" as const, priority: 0.3 },
  { url: `${baseUrl}/security`, changeFrequency: "yearly" as const, priority: 0.5 },
  { url: `${baseUrl}/blog`, changeFrequency: "weekly" as const, priority: 0.6 },
  { url: `${baseUrl}/blog/secure-file-transfer-best-practices`, changeFrequency: "monthly" as const, priority: 0.5 },
  { url: `${baseUrl}/blog/collect-files-clients`, changeFrequency: "monthly" as const, priority: 0.5 },
  { url: `${baseUrl}/blog/dropbox-google-drive-integration`, changeFrequency: "monthly" as const, priority: 0.5 },
  { url: `${baseUrl}/blog/automate-client-onboarding`, changeFrequency: "monthly" as const, priority: 0.5 },
  { url: `${baseUrl}/blog/file-organization-tips`, changeFrequency: "monthly" as const, priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({ ...page, lastModified: new Date() }));
}
