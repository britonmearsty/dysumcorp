export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Dysumcorp",
  description:
    "Professional secure file collection portal for CPAs, lawyers, and consultants. Branded client document upload with bank-level encryption. No client login required. Start free.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Features",
      href: "#features",
    },
    {
      label: "How It Works",
      href: "#how-it-works",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Features",
      href: "#features",
    },
    {
      label: "How It Works",
      href: "#how-it-works",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Login",
      href: "/login",
    },
    {
      label: "Sign Up",
      href: "/signup",
    },
  ],
  links: {
    login: "/auth",
    signup: "/auth",
    dashboard: "/dashboard",
  },
};
