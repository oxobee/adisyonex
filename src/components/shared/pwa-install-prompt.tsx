"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DownloadIcon, ShareIcon, SparklesIcon, UtensilsIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt({
  appName = "Elitale Restro",
  logoUrl,
  faviconUrl,
}: {
  readonly appName?: string;
  readonly logoUrl?: string | null;
  readonly faviconUrl?: string | null;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 0. If user previously installed, never show again
    if (localStorage.getItem("pwa_installed") === "true") {
      return;
    }

    // 1. Check if already installed / running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      if (isStandaloneMode) {
        setIsStandalone(true);
        localStorage.setItem("pwa_installed", "true");
        return true;
      }
      return false;
    };

    if (checkStandalone()) {
      return;
    }

    // 2. Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("SW registration notice:", err));
    }

    // 3. Listen for appinstalled event (browser signals successful install)
    const handleAppInstalled = () => {
      localStorage.setItem("pwa_installed", "true");
      setIsVisible(false);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // 4. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 5. Check dismiss cooldown from localStorage (1 hour)
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const dismissedAt = localStorage.getItem("pwa_install_dismissed_at");
    if (dismissedAt) {
      const timeDiff = Date.now() - parseInt(dismissedAt, 10);
      if (timeDiff < ONE_HOUR_MS) {
        return () => {
          window.removeEventListener("appinstalled", handleAppInstalled);
        };
      }
    }

    // 6. Listen to beforeinstallprompt event (Android / Chromium / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If on iOS and not standalone, show prompt after a short pleasant delay
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        localStorage.setItem("pwa_installed", "true");
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setIsIosModalOpen(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_install_dismissed_at", Date.now().toString());
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Sweet Floating Bottom-Right Toast / Banner */}
      <aside aria-label="Uygulama Yükleme Bildirimi" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="relative flex flex-col gap-3 rounded-3xl border border-primary/30 bg-card/95 p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-primary/20">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Kapat"
            className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>

          {/* Banner Body */}
          <div className="flex items-start gap-3.5 pr-6">
            {/* App Icon */}
            <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-inner flex items-center justify-center">
              {faviconUrl ? (
                <Image
                  src={faviconUrl}
                  alt={appName}
                  width={40}
                  height={40}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <UtensilsIcon className="size-6 text-primary" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black tracking-tight text-foreground truncate">
                  {appName}
                </h4>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 px-2 py-0.2 text-[10px] font-black uppercase">
                  <SparklesIcon className="size-2.5" />
                  Hızlı Uygulama
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Tarayıcı çubuğu olmadan tam ekran ve yüksek hız için cihazınıza yükleyin.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl h-8 px-3 cursor-pointer"
            >
              Daha Sonra
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleInstallClick}
              className="text-xs font-black rounded-xl h-8 px-4 shadow-md cursor-pointer"
            >
              <DownloadIcon className="size-3.5 mr-1.5" />
              Uygulamayı Yükle
            </Button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Installation Guide Modal */}
      {isIosModalOpen && (
        <Dialog open={isIosModalOpen} onOpenChange={setIsIosModalOpen}>
          <DialogContent className="max-w-sm rounded-3xl p-6 shadow-2xl text-center">
            <DialogHeader className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                <ShareIcon className="size-7" />
              </div>
              <DialogTitle className="text-lg font-black text-foreground">
                iPhone / iPad&apos;e Yükleyin
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {appName} uygulamasını ana ekranınıza eklemek için aşağıdaki adımları izleyin:
              </DialogDescription>
            </DialogHeader>

            <div className="my-3 space-y-2.5 text-left text-xs bg-muted/50 p-4 rounded-2xl border border-border/80">
              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-[10px]">
                  1
                </span>
                <p className="text-foreground font-medium">
                  Safari&apos;nin alt menüsündeki <strong>Paylaş</strong> (<ShareIcon className="inline size-3 text-primary mx-0.5" />) simgesine dokunun.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-[10px]">
                  2
                </span>
                <p className="text-foreground font-medium">
                  Aşağı kaydırıp <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine tıklayın.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-[10px]">
                  3
                </span>
                <p className="text-foreground font-medium">
                  Sağ üstteki <strong>&quot;Ekle&quot;</strong> butonuna basarak kurulumu tamamlayın.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsIosModalOpen(false)}
              className="w-full rounded-xl font-bold cursor-pointer"
            >
              Anladım
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
