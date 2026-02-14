/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  reactStrictMode: true,
  
  // Exclude reference folders and dysum subfolder from build
  webpack: (config, { isServer }) => {
    // Exclude reference folders from watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/dysum/**',
        '**/dashboard-pages-reference/**',
        '**/design-reference/**',
        '**/node_modules/**'
      ],
    };
    
    return config;
  },
  
  // Exclude reference folders from page compilation
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => `page.${ext}`).concat(['tsx', 'ts', 'jsx', 'js']),
  
  // Exclude specific directories from output file tracing
  outputFileTracingExcludes: {
    '*': [
      './dashboard-pages-reference/**/*',
      './design-reference/**/*',
      './dysum/**/*',
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
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
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
