import type { Metadata } from "next";
import { Geist_Mono, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

import { getSystemSettings } from "@/services/system-setting.service";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings().catch(() => null);
  const title = settings?.metaTitle || settings?.systemName || "Elitale Restro";
  const description =
    settings?.metaDescription ||
    settings?.systemTagline ||
    "Restoranınızın sipariş, stok ve adisyon yönetimini tek bir noktadan yönetin.";
  const icons = settings?.faviconUrl
    ? [{ rel: "icon", url: settings.faviconUrl }]
    : undefined;

  return {
    title,
    description,
    keywords: settings?.metaKeywords ? settings.metaKeywords.split(",").map((s) => s.trim()) : undefined,
    icons,
    openGraph: {
      title,
      description,
      images: settings?.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={cn(
        "h-full",
        "antialiased",
        fontSans.variable,
        fontHeading.variable,
        fontMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
