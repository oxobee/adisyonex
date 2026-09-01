import type { MetadataRoute } from "next";
import { getSystemSettings } from "@/services/system-setting.service";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSystemSettings().catch(() => null);

  const name = settings?.systemName || "AdisyonEx";
  const shortName = settings?.systemName || "AdisyonEx";
  const description =
    settings?.metaDescription ||
    settings?.systemTagline ||
    "Yeni nesil restoran adisyon, sipariş, mutfak ve QR menü yönetim platformu.";
  const iconUrl = settings?.faviconUrl || "/favicon.ico";

  return {
    name,
    short_name: shortName,
    description,
    start_url: "/dashboard/orders",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay", "minimal-ui"],
    background_color: "#09090b",
    theme_color: "#f97316",
    orientation: "any",
    prefer_related_applications: false,
    categories: ["food", "business", "productivity"],
    icons: [
      {
        src: iconUrl,
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
