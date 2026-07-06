import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  output: 'standalone',
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos"
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  },
  async rewrites() {
    const apiBaseUrl = "https://genz.runasp.net";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: "/hubs/:path*",
        destination: `${apiBaseUrl}/hubs/:path*`,
      },
      {
        source: "/signin-google",
        destination: `${apiBaseUrl}/signin-google`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiBaseUrl}/uploads/:path*`,
      },
      {
        source: "/content/:path*",
        destination: `${apiBaseUrl}/content/:path*`,
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  // Your Sentry organization & project
  org: "edu-0e",
  project: "javascript-nextjs",

  // Suppresses source map upload logs during CI — set to false to see them
  silent: !process.env.CI,

  // Upload source maps so Sentry shows readable stack traces
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically instrument Next.js API routes and server components
  webpack: {
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
    autoInstrumentAppDirectory: true,
    treeshake: {
      removeDebugLogging: true,
    }
  },

  // Tunnel requests through your own server to avoid ad-blockers
  tunnelRoute: "/monitoring-tunnel",
});

