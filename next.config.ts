import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Blog covers and admin-uploaded branding live in Supabase Storage; outlet
    // logos can point at any publisher's own domain. Optimization runs on
    // Vercel's edge, so it costs the app nothing at request time.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
