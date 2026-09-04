import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["sharp"],
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
    formats: ["image/avif", "image/webp"],
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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/home", destination: "/dashboard/home", permanent: false },
      { source: "/orders", destination: "/dashboard/orders", permanent: false },
      { source: "/kitchen", destination: "/dashboard/kitchen", permanent: false },
      { source: "/pos", destination: "/dashboard/pos", permanent: false },
      { source: "/tables", destination: "/dashboard/tables", permanent: false },
      { source: "/menu", destination: "/dashboard/menu", permanent: false },
      { source: "/settings", destination: "/dashboard/settings", permanent: false },
      { source: "/inventory", destination: "/dashboard/inventory", permanent: false },
      { source: "/customers", destination: "/dashboard/customers", permanent: false },
      { source: "/system", destination: "/dashboard/system", permanent: false },
      { source: "/z-report", destination: "/dashboard/z-report", permanent: false },
      { source: "/ai-studio", destination: "/dashboard/ai-studio", permanent: false },
      { source: "/menu-design", destination: "/dashboard/menu-design", permanent: false },
      { source: "/staff", destination: "/dashboard/staff", permanent: false },
      { source: "/personel", destination: "/personelgiris", permanent: false },
      { source: "/personel-girisi", destination: "/personelgiris", permanent: false },
    ];
  },
};

export default nextConfig;
