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
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings().catch(() => null);
  const name = settings?.systemName || "Elitale Restro";
  const title = settings?.metaTitle || name;
  const description =
    settings?.metaDescription ||
    settings?.systemTagline ||
    "Restoranınızın sipariş, stok ve adisyon yönetimini tek bir noktadan yönetin.";
  const icons = settings?.faviconUrl
    ? [
        { rel: "icon", url: settings.faviconUrl },
        { rel: "apple-touch-icon", url: settings.faviconUrl },
      ]
    : undefined;

  return {
    title,
    description,
    manifest: "/manifest.webmanifest",
    applicationName: name,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: name,
    },
    keywords: settings?.metaKeywords ? settings.metaKeywords.split(",").map((s) => s.trim()) : undefined,
    icons,
    openGraph: {
      title,
      description,
      images: settings?.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings().catch(() => null);

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
        <PwaInstallPrompt
          appName={settings?.systemName}
          logoUrl={settings?.logoUrl}
          faviconUrl={settings?.faviconUrl}
        />
      </body>
    </html>
  );
}
