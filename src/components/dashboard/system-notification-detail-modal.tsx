"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellRingIcon,
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  deleteAdminNotificationAction,
  toggleAdminNotificationReadAction,
} from "@/actions/live-alerts.actions";

export interface SystemNotificationItem {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly buttonText?: string | null;
  readonly buttonUrl?: string | null;
  readonly isRead: boolean;
  readonly createdAt: string;
  readonly readAt?: string | null;
}

interface SystemNotificationDetailModalProps {
  readonly notification: SystemNotificationItem | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onStatusChange?: (id: string, newReadState: boolean) => void;
  readonly onDelete?: (id: string) => void;
}

export function SystemNotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}: SystemNotificationDetailModalProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!notification) return null;

  const formattedDate = (() => {
    try {
      const d = new Date(notification.createdAt);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return notification.createdAt;
    }
  })();

  const handleToggleRead = async () => {
    setIsPending(true);
    const targetState = !notification.isRead;
    try {
      const res = await toggleAdminNotificationReadAction(
        notification.id,
        targetState,
      );
      if (res.success) {
        onStatusChange?.(notification.id, targetState);
        toast.success(
          targetState
            ? "Bildirim okundu olarak işaretlendi"
            : "Bildirim okunmadı olarak işaretlendi",
        );
        router.refresh();
      } else {
        toast.error(res.error || "İşlem başarısız oldu");
      }
    } catch {
      toast.error("İşlem sırasında bir hata oluştu");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu bildirimi silmek istediğinize emin misiniz?")) return;

    setIsDeleting(true);
    try {
      const res = await deleteAdminNotificationAction(notification.id);
      if (res.success) {
        onDelete?.(notification.id);
        toast.success("Bildirim başarıyla silindi");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || "Bildirim silinemedi");
      }
    } catch {
      toast.error("Bildirim silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  };

  const modalBody = (
    <div className="flex flex-col gap-5 text-left">
      {/* Üst Bilgi Rozetleri */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60 shadow-2xs">
          <ShieldCheckIcon className="size-3.5 text-indigo-600" />
          <span>Süper Admin Sistem Bildirimi</span>
        </div>
        <span className="text-xs font-medium text-gray-500">
          {formattedDate}
        </span>
      </div>

      {/* Başlık ve İkon */}
      <div className="flex items-start gap-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
          <BellRingIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-gray-900 leading-snug">
            {notification.title}
          </h3>
          <span
            className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
              notification.isRead
                ? "bg-gray-100 text-gray-600"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {notification.isRead ? "✓ Okundu" : "● Yeni Bildirim"}
          </span>
        </div>
      </div>

      {/* Mesaj İçeriği */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/70 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-normal max-h-60 overflow-y-auto">
        {notification.message}
      </div>

      {/* Varsa Link / Eylem Butonu */}
      {notification.buttonUrl && (
        <a
          href={notification.buttonUrl}
          target={
            notification.buttonUrl.startsWith("http") ? "_blank" : "_self"
          }
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-98 transition-all cursor-pointer text-center"
        >
          <span>{notification.buttonText || "İlgili Sayfayı Aç"}</span>
          <ExternalLinkIcon className="size-4" />
        </a>
      )}

      {/* Alt Butonlar: Okundu Olarak İşaretle & Sil */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 mt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleRead}
          disabled={isPending || isDeleting}
          className="flex items-center gap-1.5 rounded-xl font-bold cursor-pointer text-xs"
        >
          {notification.isRead ? (
            <>
              <CircleIcon className="size-3.5 text-gray-400" />
              <span>Okunmadı Yap</span>
            </>
          ) : (
            <>
              <CheckCircle2Icon className="size-3.5 text-emerald-600" />
              <span>Okundu Olarak İşaretle</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold cursor-pointer text-xs"
        >
          <Trash2Icon className="size-3.5" />
          <span>{isDeleting ? "Siliniyor…" : "Bildirimi Sil"}</span>
        </Button>
      </div>
    </div>
  );

  // Mobilde alttan açılır (Sheet), masaüstünde popup (Dialog)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[85vh] p-5 overflow-y-auto bg-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{notification.title}</SheetTitle>
          </SheetHeader>
          {modalBody}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-gray-200">
        <DialogHeader className="sr-only">
          <DialogTitle>{notification.title}</DialogTitle>
        </DialogHeader>
        {modalBody}
      </DialogContent>
    </Dialog>
  );
}
