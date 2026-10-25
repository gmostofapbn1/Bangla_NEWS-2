import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./lib/image-hosts";

const nextConfig: NextConfig = {
  images: {
    // Only blog covers go through the optimiser; outlet logos are plain <img>.
    //
    // Every distinct width x format x source is a separate transformation and a
    // separate cache write, and each expires and is redone when its TTL lapses -
    // so all four settings below exist to keep that count small:
    //
    // - hosts: "**" let anyone point /_next/image at any image on the internet
    //   and spend this site's quota optimising it. Covers come from Supabase
    //   Storage; any other host is served as-is (lib/image-src.ts) instead.
    // - minimumCacheTTL: Next 16 defaults to 4 hours. Uploaded files get a new
    //   timestamped name when replaced, so a month is safe.
    // - sizes: 7 widths instead of 15 still cover every `sizes` prop in use at
    //   1x-3x density.
    // - formats/qualities: one of each, so no image is stored twice.
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [96, 256, 384],
    formats: ["image/webp"],
    qualities: [75],
  },
};

export default nextConfig;
