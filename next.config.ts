import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pärnu was merged into the Estland destination (slug changed tallinn -> estland, 2026-10-20).
  async redirects() {
    return [
      { source: "/destinations/tallinn", destination: "/destinations/estland", permanent: true },
      { source: "/destinations/parnu", destination: "/destinations/estland", permanent: true }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" }
    ]
  }
};

export default nextConfig;
