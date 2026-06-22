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
  experimental: {
    staleTimes: {
      dynamic: 300, // Cache halaman dinamis selama 5 menit di browser memory (mengatasi issue loading berulang)
      static: 1800,
    },
  },
};

export default nextConfig;
