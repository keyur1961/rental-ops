import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: ["*.trycloudflare.com"],
    },
  },
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
