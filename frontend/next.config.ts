import type { NextConfig } from "next";

const backendInternalUrl = process.env.BACKEND_INTERNAL_URL;

if (!backendInternalUrl) {
  throw new Error("BACKEND_INTERNAL_URL is required for API rewrites");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendInternalUrl}/api/:path*` }];
  },
};

export default nextConfig;