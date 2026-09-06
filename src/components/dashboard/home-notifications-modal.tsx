"use client";

import { useState } from "react";
import {
  BellRingIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  InboxIcon,
  ShieldCheckIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  SystemNotificationDetailModal,
  type SystemNotificationItem,
} from "./system-notification-detail-modal";
import {
  deleteAdminNotificationAction,
  toggleAdminNotificationReadAction,
} from "@/actions/live-alerts.actions";

export interface HomeNotificationItem extends SystemNotificationItem {
  readonly type?: "system" | "order" | "table" | "kitchen" | "stock";
  readonly description?: string;
  readonly timeAgo?: string;
  readonly targetUrl?: string;
}

export function HomeNotificationsModal({
  isOpen,
  onClose,
  notifications = [],
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly notifications?: readonly HomeNotificationItem[];
}) {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [selectedNotif, setSelectedNotif] = useState<SystemNotificationItem | null>(null);
  const [localList, setLocalList] = useState<readonly HomeNotificationItem[]>(notifications);

  // Sync if notifications prop changes
  useState(() => {
    setLocalList(notifications);
  });

  if (!isOpen) return null;

  const filtered = localList.filter((n) => {
    if (activeTab === "unread") return !n.isRead;
    if (activeTab === "read") return Boolean(n.isRead);
    return true;
  });

  const unreadCount = localList.filter((n) => !n.isRead).length;

  const handleOpenDetail = (notif: HomeNotificationItem) => {
    setSelectedNotif(notif);
  };

  const handleStatusChange = (id: string, newReadState: boolean) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: newReadState } : item)),
    );
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif({ ...selectedNotif, isRead: newReadState });
    }
  };

  const handleDelete = (id: string) => {
    setLocalList((prev) => prev.filter((item) => item.id !== id));
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = localList.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await Promise.all(
        unreadIds.map((id) => toggleAdminNotificationReadAction(id, true)),
      );
      setLocalList((prev) => prev.map((item) => ({ ...item, isRead: true })));
      toast.success("Tüm bildirimler okundu olarak işaretlendi");
    } catch {
      toast.error("İşlem sırasında hata oluştu");
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        data-state="open"
        className="esc-modal-open fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                <BellRingIcon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    Sistem Bildirimleri
                  </h2>
                  {unreadCount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                      {unreadCount} Okunmamış
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      Hepsi Okundu
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Süper Admin tarafından işletmenize gönderilen duyuru ve bilgilendirmeler
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-xs font-bold text-gray-700 transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <CheckCircle2Icon className="size-3.5" />
                  <span>Tümünü Oku</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <XIcon className="size-5" />
              </button>
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 border-b border-gray-100 bg-gray-50/70">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeTab === "all"
                  ? "bg-white text-indigo-700 shadow-2xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60",
              )}
            >
              Tümü ({localList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeTab === "unread"
                  ? "bg-white text-rose-700 shadow-2xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60",
              )}
            >
              Okunmamış ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("read")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeTab === "read"
                  ? "bg-white text-emerald-700 shadow-2xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60",
              )}
            >
              Okunmuş ({localList.length - unreadCount})
            </button>
          </div>

          {/* NOTIFICATIONS LIST BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-2.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400 mb-3">
                  <InboxIcon className="size-7" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                  {activeTab === "unread"
                    ? "Okunmamış Bildirim Yok"
                    : "Sistem Bildirimi Bulunmuyor"}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Süper Admin tarafından henüz yeni bir duyuru veya bilgilendirme iletilmedi.
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-sm",
                    item.isRead
                      ? "bg-white/90 border-gray-200/80 hover:bg-gray-50"
                      : "bg-indigo-50/40 border-indigo-200 hover:bg-indigo-50/70",
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-2xl border shadow-2xs",
                        item.isRead
                          ? "bg-gray-100 text-gray-500 border-gray-200"
                          : "bg-indigo-600 text-white border-indigo-600",
                      )}
                    >
                      <ShieldCheckIcon className="size-5" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 truncate">
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span className="size-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                        {item.message || item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pl-2">
                    <span className="text-xs font-semibold text-gray-400 tabular-nums">
                      {item.timeAgo}
                    </span>
                    <div className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              Bildirime tıklayarak detayını görüntüleyebilir, bağlantıyı açabilir veya silebilirsiniz.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 transition-colors shadow-2xs cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL (Mobile Bottom Sheet & Desktop Dialog) */}
      <SystemNotificationDetailModal
        notification={selectedNotif}
        isOpen={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </>
  );
}
