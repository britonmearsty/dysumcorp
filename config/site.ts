export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Dysumcorp",
  description:
    "The simplest way for solo professionals and small teams to receive client files — straight to their Google Drive or Dropbox. No client account needed.",
  storageRootFolder: process.env.STORAGE_ROOT_FOLDER || "dysumcorp",
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
