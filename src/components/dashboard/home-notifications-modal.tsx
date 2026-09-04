"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  ArmchairIcon,
  BellIcon,
  ChefHatIcon,
  ChevronRightIcon,
  InboxIcon,
  ShoppingBagIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface HomeNotificationItem {
  readonly id: string;
  readonly type: "order" | "table" | "kitchen" | "stock";
  readonly title: string;
  readonly description: string;
  readonly timeAgo: string;
  readonly targetUrl: string;
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "order" | "table" | "kitchen" | "stock">("all");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.type === activeTab;
  });

  const getCategoryCount = (type: "order" | "table" | "kitchen" | "stock") => {
    return notifications.filter((n) => n.type === type).length;
  };

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  const getIconAndStyle = (type: HomeNotificationItem["type"]) => {
    switch (type) {
      case "order":
        return {
          icon: ShoppingBagIcon,
          bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          label: "Sipariş",
          labelColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
        };
      case "table":
        return {
          icon: ArmchairIcon,
          bg: "bg-blue-50 text-blue-600 border-blue-200",
          label: "Masa",
          labelColor: "text-blue-700 bg-blue-50 border-blue-200",
        };
      case "kitchen":
        return {
          icon: ChefHatIcon,
          bg: "bg-orange-50 text-orange-600 border-orange-200",
          label: "Mutfak",
          labelColor: "text-orange-700 bg-orange-50 border-orange-200",
        };
      case "stock":
        return {
          icon: AlertTriangleIcon,
          bg: "bg-rose-50 text-rose-600 border-rose-200",
          label: "Stok Uyarısı",
          labelColor: "text-rose-700 bg-rose-50 border-rose-200",
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-state="open"
      className="esc-modal-open fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <BellIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Bildirim Merkezi</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                  {notifications.length} Aktif
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Restoranınızdaki tüm sipariş, masa, mutfak ve stok hareketleri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center gap-1.5 px-5 sm:px-6 py-3 border-b border-gray-100 bg-gray-50/70 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer",
              activeTab === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            Tümü ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("order")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
              activeTab === "order"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <span>Siparişler</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {getCategoryCount("order")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("table")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
              activeTab === "table"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <span>Masalar</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {getCategoryCount("table")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kitchen")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
              activeTab === "kitchen"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <span>Mutfak</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {getCategoryCount("kitchen")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stock")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
              activeTab === "stock"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-200/60"
            )}
          >
            <span>Stok</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {getCategoryCount("stock")}
            </span>
          </button>
        </div>

        {/* NOTIFICATIONS LIST BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-2.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-3">
                <InboxIcon className="size-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Bildirim Bulunmuyor</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Bu kategoride şu anda bekleyen veya okunmamış bir operasyonel hareket yok.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const { icon: Icon, bg, label, labelColor } = getIconAndStyle(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.targetUrl)}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-gray-200/80 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105",
                        bg
                      )}
                    >
                      <Icon className="size-5.5" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-gray-900 truncate">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider",
                            labelColor
                          )}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-2">
                    <span className="text-xs font-semibold text-gray-400 tabular-nums">
                      {item.timeAgo}
                    </span>
                    <div className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            Herhangi bir bildirime tıklayarak ilgili sayfaya gidebilirsiniz.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 transition-colors shadow-2xs cursor-pointer"
          >
            Kapat (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
