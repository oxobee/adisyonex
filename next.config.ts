import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['192.168.1.*'],
  experimental: {
    // Allow logo/cover/gallery image (≤5 MB) and short promo video uploads
    // through Server Actions (default is 1 MB).
    serverActions: {
      bodySizeLimit: "30mb",
      allowedOrigins: ["adisyonex.vercel.app", "*.vercel.app", "localhost:3000", "localhost:3001"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.storage.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
