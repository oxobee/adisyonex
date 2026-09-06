"use client";

import { useEffect, useState } from "react";
import {
  CameraIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MessageSquareQuoteIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

import { FeedbackModal, type FeedbackCategoryType } from "./feedback-modal";
import { cn } from "@/lib/utils";

export function GlobalFeedbackTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategoryType>("SUGGESTION");
  const [isCaptureBarVisible, setIsCaptureBarVisible] = useState(false);
  const [capturedScreenshots, setCapturedScreenshots] = useState<string[]>([]);
  const [attachmentsForModal, setAttachmentsForModal] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  // Listen to custom global event to open feedback modal or capture bar from anywhere
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
        // Activate capture bar mode
        setIsCaptureBarVisible(true);
        setIsOpen(false);
        toast.info("Ekran görüntüsü çekme modu aktif. Çekmek istediğiniz ekranda 'Ekran Görüntüsü Çek' butonuna basınız.");
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener("open-feedback-modal", handleOpen);
    return () => window.removeEventListener("open-feedback-modal", handleOpen);
  }, []);

  // Direct screen capture function using html2canvas with proper CORS & non-tainting settings
  const handleDirectCapture = async () => {
    setIsCapturing(true);
    const triggerEl = document.querySelector(".global-feedback-trigger") as HTMLElement;
    if (triggerEl) triggerEl.style.opacity = "0";

    // Camera shutter flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    await new Promise((r) => setTimeout(r, 200));

    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false, // Prevents tainted canvas SecurityError on toDataURL()
        foreignObjectRendering: false,
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

      let dataUrl = "";
      try {
        dataUrl = canvas.toDataURL("image/png");
      } catch {
        // Fallback to JPEG if PNG export encounters any tainted sub-elements
        dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      }

      if (!dataUrl || dataUrl.length < 100) {
        throw new Error("Görüntü verisi boş döndü");
      }

      setCapturedScreenshots((prev) => [...prev, dataUrl]);
      toast.success(
        `Ekran görüntüsü alındı! (${capturedScreenshots.length + 1}) — Göndermek için 'Gönder' butonuna basabilirsiniz.`
      );
    } catch (err) {
      console.error("Screenshot capture error:", err);
      toast.error(
        "Ekran görüntüsü alınırken bir kısıtlama oluştu. Geri bildirim formundan cihazınızdan görsel seçebilirsiniz."
      );
    } finally {
      if (triggerEl) triggerEl.style.opacity = "1";
      setIsCapturing(false);
    }
  };

  // When user clicks the "Gönder" button on the capture bar
  const handleOpenModalWithScreenshots = () => {
    if (capturedScreenshots.length > 0) {
      setAttachmentsForModal((prev) => [...prev, ...capturedScreenshots]);
      setCapturedScreenshots([]);
    }
    setIsCaptureBarVisible(false);
    setIsOpen(true);
  };

  return (
    <>
      {/* CAMERA SHUTTER FLASH OVERLAY */}
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-[9999] bg-white/75 animate-in fade-in duration-75" />
      )}

      {/* FLOATING ACTION BAR */}
      <aside
        aria-label="Geri Bildirim ve Ekran Yakalama"
        className="global-feedback-trigger fixed bottom-4 left-4 z-40 flex items-center gap-1.5 transition-all"
      >
        {isCaptureBarVisible ? (
          /* 1. SCREENSHOT CAPTURE BAR (Yalnızca tıklandığında görünür) */
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Ekran Görüntüsü Çek Butonu */}
            <button
              type="button"
              onClick={handleDirectCapture}
              disabled={isCapturing}
              title="Bu ekranın görüntüsünü çek"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all cursor-pointer group shrink-0 active:scale-95 disabled:opacity-50"
            >
              {isCapturing ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <CameraIcon className="size-3.5 transition-transform group-hover:scale-110" />
              )}
              <span>
                {capturedScreenshots.length > 0
                  ? `Ekran Görüntüsü Çek (${capturedScreenshots.length})`
                  : "Ekran Görüntüsü Çek"}
              </span>
            </button>

            {/* Gönder / Forma Aktar Butonu (Eğer en az 1 görsel çekildiyse) */}
            {capturedScreenshots.length > 0 && (
              <button
                type="button"
                onClick={handleOpenModalWithScreenshots}
                title="Çekilen ekran görüntülerini forma aktar ve geri bildirim gönder"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 animate-in zoom-in-95 duration-150"
              >
                <SendIcon className="size-3.5" />
                <span>Gönder ({capturedScreenshots.length})</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-700" />

            {/* Kapatma ('X') Butonu */}
            <button
              type="button"
              onClick={() => {
                setIsCaptureBarVisible(false);
                setCapturedScreenshots([]);
              }}
              title="Ekran görüntüsü yakalama çubuğunu kapat"
              className="size-7 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ) : (
          /* 2. DEFAULT COMPACT FEEDBACK PILL (Ekran görüntüsü butonu çıkmaz, sadece geri bildirim formu) */
          <button
            type="button"
            onClick={() => {
              setCategory("SUGGESTION");
              setIsOpen(true);
            }}
            title="Öneri, istek, şikayet veya hata bildirin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-indigo-700 backdrop-blur-md border border-gray-200/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] text-xs font-black transition-all hover:shadow-lg active:scale-95 cursor-pointer group shrink-0"
          >
            <MessageSquareQuoteIcon className="size-3.5 text-indigo-600 transition-transform group-hover:scale-110" />
            <span>Geri Bildirim</span>
          </button>
        )}
      </aside>

      {/* FEEDBACK MODAL */}
      <FeedbackModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setAttachmentsForModal([]);
        }}
        initialCategory={category}
        initialAttachments={attachmentsForModal}
        onRequestScreenCapture={() => {
          setIsOpen(false);
          setIsCaptureBarVisible(true);
          toast.info("Ekran görüntüsü çekmek için alttaki butonu kullanabilirsiniz.");
        }}
      />
    </>
  );
}
