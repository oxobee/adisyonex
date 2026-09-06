"use client";

import { useEffect, useState } from "react";
import {
  CameraIcon,
  HelpCircleIcon,
  Loader2Icon,
  MessageSquareQuoteIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

import { FeedbackModal, type FeedbackCategoryType } from "./feedback-modal";
import { cn } from "@/lib/utils";

export function GlobalFeedbackTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategoryType>("SUGGESTION");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  // Listen to custom global event to open feedback modal from anywhere (e.g. home card)
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{
        category?: FeedbackCategoryType;
        captureScreen?: boolean;
      }>;
      if (customEvent.detail?.category) {
        setCategory(customEvent.detail.category);
      }
      if (customEvent.detail?.captureScreen) {
        void handleDirectCapture(customEvent.detail.category || "BUG");
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener("open-feedback-modal", handleOpen);
    return () => window.removeEventListener("open-feedback-modal", handleOpen);
  }, []);

  const handleDirectCapture = async (targetCategory: FeedbackCategoryType = "BUG") => {
    setIsCapturing(true);
    const triggerEl = document.querySelector(".global-feedback-trigger") as HTMLElement;
    if (triggerEl) triggerEl.style.opacity = "0";

    // Shutter flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    await new Promise((r) => setTimeout(r, 180));

    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 1,
        ignoreElements: (el) => {
          return (
            el.classList.contains("global-feedback-trigger") ||
            el.classList.contains("feedback-dialog-content") ||
            el.classList.contains("esc-modal-open")
          );
        },
      });

      const dataUrl = canvas.toDataURL("image/png");
      setScreenshot(dataUrl);
      setCategory(targetCategory);
      setIsOpen(true);
      toast.success("Ekran görüntüsü alındı ve forma eklendi! 📸");
    } catch (err) {
      console.error("Screenshot capture error:", err);
      toast.error("Ekran görüntüsü alınamadı, geri bildirim formu açılıyor.");
      setCategory(targetCategory);
      setIsOpen(true);
    } finally {
      if (triggerEl) triggerEl.style.opacity = "1";
      setIsCapturing(false);
    }
  };

  return (
    <>
      {/* CAMERA SHUTTER FLASH OVERLAY */}
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-[9999] bg-white/70 animate-in fade-in duration-75" />
      )}

      {/* FIXED FLOATING ACTION PILL (SABİT GERİ BİLDİRİM VE EKRAN GÖRÜNTÜSÜ BUTONLARI) */}
      <aside
        aria-label="Geri Bildirim Menüsü"
        className="global-feedback-trigger fixed bottom-4 left-4 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all hover:shadow-lg active:scale-98"
      >
        {/* Ekran Görüntüsü Çek Butonu */}
        <button
          type="button"
          onClick={() => handleDirectCapture("BUG")}
          disabled={isCapturing}
          title="Mevcut sayfanın ekran görüntüsünü al ve hatayı bildir"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer group shrink-0 active:scale-95"
        >
          {isCapturing ? (
            <Loader2Icon className="size-3.5 animate-spin text-slate-600" />
          ) : (
            <CameraIcon className="size-3.5 text-indigo-600 transition-transform group-hover:scale-110" />
          )}
          <span className="hidden sm:inline">Ekran Görüntüsü Çek</span>
          <span className="sm:hidden text-[11px]">Fotoğraf</span>
        </button>

        <div className="h-4 w-px bg-gray-200" />

        {/* Geri Bildirim Gönder Butonu */}
        <button
          type="button"
          onClick={() => {
            setScreenshot(null);
            setCategory("SUGGESTION");
            setIsOpen(true);
          }}
          title="Öneri, istek, şikayet veya hata bildirin"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 group shrink-0"
        >
          <MessageSquareQuoteIcon className="size-3.5 transition-transform group-hover:scale-110" />
          <span>Geri Bildirim</span>
        </button>
      </aside>

      {/* FEEDBACK MODAL */}
      <FeedbackModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setScreenshot(null);
        }}
        initialCategory={category}
        initialScreenshot={screenshot}
      />
    </>
  );
}
