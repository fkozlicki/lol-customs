import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  transpilePackages: ["@v1/supabase"],
  images: {
    // Game art comes from Data Dragon only; crests and icons are self-hosted in public/game/.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
    ],
    // Data Dragon URLs carry the patch, so what they point at never changes: keep the optimised
    // copies for a month rather than re-fetching and re-encoding them.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
  // public/ is served with max-age=0, so every page view revalidated each crest and icon. They are
  // not immutable — the generator rewrites them in place — but they change once in years.
  headers: async () => [
    {
      source: "/game/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
  ],
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
