import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  devIndicators: {
    // @ts-ignore - Hides the Next.js dev indicator (N icon)
    appIsrStatus: false,
  },
};

export default nextConfig;
