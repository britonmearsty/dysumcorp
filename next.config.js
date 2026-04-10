/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker
  output: "standalone",

  // Optimize for production
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Enable HSTS (force HTTPS) - 1 year, include subdomains
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Basic CSP - restrict to same origin and Vercel for static assets
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://cdn.fontshare.com; connect-src 'self' https://*.vercel.app https://*.googleapis.com https://*.dropboxapi.com;",
          },
          // Referrer policy - don't leak referrer to external sites
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disable X-Powered-By (already set via poweredByHeader: false)
        ],
      },
    ];
  },

  // Increase body size limit for file uploads (10MB to accommodate 8MB chunks)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Include Prisma client in serverless functions
  outputFileTracingIncludes: {
    "/api/**/*": ["./lib/generated/prisma/**/*"],
  },

  // Exclude reference folders and dysum subfolder from build
  webpack: (config, { isServer }) => {
    // Exclude reference folders from watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/dysum/**",
        "**/dashboard-pages-reference/**",
        "**/design-reference/**",
        "**/node_modules/**",
      ],
    };

    return config;
  },

  // Exclude reference folders from page compilation
  pageExtensions: ["tsx", "ts", "jsx", "js"]
    .map((ext) => `page.${ext}`)
    .concat(["tsx", "ts", "jsx", "js"]),

  // Exclude specific directories from output file tracing
  outputFileTracingExcludes: {
    "*": [
      "./dashboard-pages-reference/**/*",
      "./design-reference/**/*",
      "./dysum/**/*",
    ],
  },

  // Disable ESLint during builds (warnings are treated as errors)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during builds for now
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Compression
  compress: true,
};

module.exports = nextConfig;
