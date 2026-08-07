import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Guest photos and short host videos are uploaded through server actions.
      bodySizeLimit: "64mb",
    },
  },
};

export default nextConfig;
