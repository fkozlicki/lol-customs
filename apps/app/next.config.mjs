import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  transpilePackages: ["@v1/supabase"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "raw.communitydragon.org",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  redirects:
    process.env.NODE_ENV === "production"
      ? undefined
      : async () => {
          return [
            {
              source: "/_db",
              destination: "http://localhost:54323",
              basePath: false,
              permanent: false,
            },
            {
              source: "/_email",
              destination: "http://localhost:54324",
              basePath: false,
              permanent: false,
            },
          ];
        },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
});
