"use client";

import { useEffect, useState } from "react";
import {
  CameraIcon,
  Loader2Icon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

import { FeedbackModal, type FeedbackCategoryType } from "./feedback-modal";

export function GlobalFeedbackTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategoryType>("SUGGESTION");
  const [isCaptureBarVisible, setIsCaptureBarVisible] = useState(false);
  const [capturedScreenshots, setCapturedScreenshots] = useState<string[]>([]);
  const [attachmentsForModal, setAttachmentsForModal] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  // Listen to custom global event to open feedback modal or capture bar
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
        setIsCaptureBarVisible(true);
        setIsOpen(false);
        toast.info(
          "Ekran görüntüsü çekme modu aktif. Ekranı yakalamak için alttaki butona basınız."
        );
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener("open-feedback-modal", handleOpen);
    return () => window.removeEventListener("open-feedback-modal", handleOpen);
  }, []);

  /**
   * Browser-permission-based screen capture:
   * Requests native browser display media (tab/window/screen selection & permission dialog),
   * captures a high-resolution frame directly from the video stream, and stops all tracks immediately.
   */
  const handleDirectCapture = async () => {
    setIsCapturing(true);

    const triggerEl = document.querySelector(".global-feedback-trigger") as HTMLElement;
    if (triggerEl) triggerEl.style.opacity = "0";

    try {
      // 1. Primary: Browser getDisplayMedia with explicit user permission prompt
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
        toast.info(
          "Lütfen açılan tarayıcı penceresinden bu sekmeyi seçerek 'Paylaş'a basınız. 📸",
          { duration: 4000 }
        );

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser",
          } as MediaTrackConstraints,
          audio: false,
        });

        // Flash effect
        setFlash(true);
        setTimeout(() => setFlash(false), 200);

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const video = document.createElement("video");
          video.autoplay = true;
          video.muted = true;
          video.playsInline = true;
          video.srcObject = stream;

          video.onloadedmetadata = () => {
            video
              .play()
              .then(() => {
                setTimeout(() => {
                  try {
                    const canvas = document.createElement("canvas");
                    canvas.width = video.videoWidth || window.innerWidth;
                    canvas.height = video.videoHeight || window.innerHeight;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                      const url = canvas.toDataURL("image/png");
                      // Immediately stop stream to end screen sharing icon
                      stream.getTracks().forEach((track) => track.stop());
                      video.remove();
                      canvas.remove();
                      resolve(url);
                    } else {
                      stream.getTracks().forEach((track) => track.stop());
                      reject(new Error("Canvas oluşturulamadı"));
                    }
                  } catch (err) {
                    stream.getTracks().forEach((track) => track.stop());
                    reject(err);
                  }
                }, 300);
              })
              .catch((err) => {
                stream.getTracks().forEach((track) => track.stop());
                reject(err);
              });
          };

          video.onerror = (err) => {
            stream.getTracks().forEach((track) => track.stop());
            reject(err);
          };
        });

        setCapturedScreenshots((prev) => [...prev, dataUrl]);
        toast.success(
          "Ekran görüntüsü alındı! 📸 Forma aktarmak için yanındaki 'Gönder' butonuna basabilirsiniz."
        );
        return;
      }

      // 2. Fallback: html2canvas for mobile browsers where getDisplayMedia is not supported
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      await new Promise((r) => setTimeout(r, 180));

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        scale: 1,
        ignoreElements: (el) =>
          el.classList.contains("global-feedback-trigger") ||
          el.classList.contains("feedback-dialog-content") ||
          el.classList.contains("esc-modal-open"),
      });

      let dataUrl = "";
      try {
        dataUrl = canvas.toDataURL("image/png");
      } catch {
        dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      }

      if (!dataUrl || dataUrl.length < 100) {
        throw new Error("Görüntü verisi alınamadı");
      }

      setCapturedScreenshots((prev) => [...prev, dataUrl]);
      toast.success(
        "Ekran görüntüsü alındı! 📸 Forma aktarmak için yanındaki 'Gönder' butonuna basabilirsiniz."
      );
    } catch (err: any) {
      console.error("Screen capture error:", err);
      // If user cancelled the browser permission prompt
      if (
        err?.name === "NotAllowedError" ||
        err?.name === "AbortError" ||
        err?.message?.includes("Permission denied")
      ) {
        toast.info("Ekran paylaşım izni onaylanmadı veya iptal edildi.");
      } else {
        toast.error(
          "Ekran görüntüsü alınamadı. Form içinden cihazınızdan görsel seçebilirsiniz."
        );
      }
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

      {/* FLOATING ACTION BAR: SADECE EKRAN GÖRÜNTÜSÜ MODU TETİKLENDİĞİNDE GÖRÜNÜR */}
      {isCaptureBarVisible && (
        <aside
          aria-label="Ekran Yakalama Çubuğu"
          className="global-feedback-trigger fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-50 flex items-center gap-1.5 transition-all"
        >
          <div className="flex items-center gap-2 p-2 rounded-full bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/90 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.4),0_8px_10px_-6px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Ekran Görüntüsü Çek Butonu */}
            <button
              type="button"
              onClick={handleDirectCapture}
              disabled={isCapturing}
              title="Tarayıcı izni ile bu ekranın görüntüsünü al"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all cursor-pointer group shrink-0 active:scale-95 disabled:opacity-50 shadow-xs"
            >
              {isCapturing ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CameraIcon className="size-4 transition-transform group-hover:scale-110" />
              )}
              <span>
                {capturedScreenshots.length > 0
                  ? `Ekran Görüntüsü Çek (${capturedScreenshots.length})`
                  : "Ekran Görüntüsü Çek"}
              </span>
            </button>

            {/* Gönder / Forma Aktar Butonu (En az 1 görsel çekildiyse) */}
            {capturedScreenshots.length > 0 && (
              <button
                type="button"
                onClick={handleOpenModalWithScreenshots}
                title="Çekilen ekran görüntülerini forma aktar ve geri bildirim formunu aç"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 animate-in zoom-in-95 duration-150"
              >
                <SendIcon className="size-3.5" />
                <span>Gönder ({capturedScreenshots.length})</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Kapatma ('X') Butonu */}
            <button
              type="button"
              onClick={() => {
                setIsCaptureBarVisible(false);
                setCapturedScreenshots([]);
                toast.info("Ekran görüntüsü yakalama çubuğu kapatıldı.");
              }}
              title="Ekran görüntüsü yakalama çubuğunu kapat"
              className="size-8 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </aside>
      )}

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
          toast.info(
            "Ekran görüntüsü çekmek için alttaki 'Ekran Görüntüsü Çek' butonuna basınız."
          );
        }}
      />
    </>
  );
}
