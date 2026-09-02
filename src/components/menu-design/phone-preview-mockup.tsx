"use client";

import React, { useState, useRef } from "react";
import {
  BatteryChargingIcon,
  GlobeIcon,
  RotateCwIcon,
  WifiIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuDTO } from "@/types/menu";

export interface PhonePreviewProps {
  readonly theme: string;
  readonly restaurantName: string;
  readonly restaurantUsername?: string;
  readonly previewTableId?: string;
  readonly logoUrl?: string | null;
  readonly menu?: MenuDTO | null;
  readonly tableLabel?: string;
}

export function PhonePreviewMockup({
  theme,
  restaurantName,
  restaurantUsername,
  previewTableId,
  tableLabel = "Masa 1",
}: PhonePreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewUrl = restaurantUsername
    ? `/order/${restaurantUsername}?table=${previewTableId || "preview"}&previewTheme=${theme}`
    : null;

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative mx-auto w-[330px] sm:w-[360px] h-[700px] rounded-[52px] bg-zinc-950 p-3.5 shadow-2xl border-4 border-zinc-800 ring-1 ring-zinc-700/60 select-none flex flex-col justify-between">
      {/* Smartphone Dynamic Island / Speaker Notch */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-900 rounded-full z-40 flex items-center justify-between px-3 border border-zinc-800/80 shadow-inner">
        <div className="size-2 rounded-full bg-zinc-800" />
        <div className="size-2.5 rounded-full bg-zinc-950 border border-zinc-800" />
      </div>

      {/* Screen Inner Viewport */}
      <div className="relative size-full rounded-[42px] overflow-hidden bg-background flex flex-col justify-between text-foreground border border-zinc-800/50">
        
        {/* Top Status Bar with Battery, Time, and Mini Browser URL Pill */}
        <div className="shrink-0 pt-2 pb-1.5 px-5 bg-card/90 backdrop-blur-md border-b border-border/60 z-30 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-foreground/80 px-1">
            <span>14:30</span>
            <div className="flex items-center gap-1.5">
              <WifiIcon className="size-3 text-foreground/70" />
              <BatteryChargingIcon className="size-3.5 text-foreground/70" />
            </div>
          </div>

          {/* Browser Address Bar */}
          <div className="flex items-center justify-between gap-1.5 bg-muted/80 rounded-xl px-2.5 py-1 text-[10px] font-medium border border-border/70 text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <GlobeIcon className="size-3 shrink-0 text-primary" />
              <span className="truncate font-mono text-[9px] text-foreground font-semibold">
                adisyonex.com/order/{restaurantUsername || "menu"}?{tableLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Yenile"
            >
              <RotateCwIcon className={cn("size-2.5", isLoading && "animate-spin text-primary")} />
            </button>
          </div>
        </div>

        {/* Live Interactive QR Menu Frame */}
        <div className="relative flex-1 w-full h-full bg-background overflow-hidden">
          {previewUrl ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                  <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-[11px] font-bold text-muted-foreground">Canlı Menü Yükleniyor...</span>
                </div>
              )}
              <iframe
                key={`${theme}-${iframeKey}`}
                ref={iframeRef}
                src={previewUrl}
                title="Canlı QR Menü Önizlemesi"
                className="w-full h-full border-0 overflow-y-auto"
                onLoad={() => setIsLoading(false)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <p className="text-xs text-muted-foreground">Restoran bağlantısı yükleniyor...</p>
            </div>
          )}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="h-4 pb-1 flex items-center justify-center bg-card/40 border-t border-border/40 shrink-0">
          <div className="w-24 h-1 rounded-full bg-foreground/20" />
        </div>

      </div>
    </div>
  );
}
