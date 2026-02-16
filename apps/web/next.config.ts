import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@validatehome/shared", "@validatehome/calculator", "@validatehome/ui"],
  // typedRoutes will be enabled once all route segments are implemented
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
