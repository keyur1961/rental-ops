import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
