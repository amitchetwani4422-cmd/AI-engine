import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep FFmpeg packages out of webpack bundle — they use dynamic requires
  // and must run as native Node modules on the server
  serverExternalPackages: ["fluent-ffmpeg", "@ffmpeg-installer/ffmpeg", "cloudinary"],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: 'v3.fal.media' },
    ],
  },
};

export default nextConfig;
