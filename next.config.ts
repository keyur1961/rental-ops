import type { NextConfig } from "next";

function originHost(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.includes("://")) return new URL(trimmed).host;
  } catch {
    // Fall through and treat the value as a hostname or wildcard.
  }
  return trimmed.replace(/\/$/, "");
}

function serverActionOrigins(): string[] {
  const origins = new Set<string>([
    "*.trycloudflare.com",
    "*.up.railway.app",
    "*.railway.app",
  ]);

  const railwayPublic = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayPublic) {
    const host = originHost(railwayPublic);
    if (host) origins.add(host);
  }

  const extra = process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.split(",") ?? [];
  for (const origin of extra) {
    const host = originHost(origin);
    if (host) origins.add(host);
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: serverActionOrigins(),
    },
  },
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
