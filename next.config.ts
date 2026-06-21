import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Google Drive direct file view URL
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        // Google Drive thumbnail/cached image URL (kadang digunakan oleh Drive)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
