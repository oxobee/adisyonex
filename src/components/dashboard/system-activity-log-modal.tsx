"use client";

import { useState, useEffect, useMemo } from "react";
import {
  HistoryIcon,
  XIcon,
  SearchIcon,
  RefreshCwIcon,
  FilterIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
  UtensilsIcon,
  ArmchairIcon,
  SettingsIcon,
  UsersIcon,
  CreditCardIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getActivityLogsAction,
  type SerializedActivityLog,
} from "@/actions/activity-log.actions";

interface SystemActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemActivityLogModal({
  isOpen,
  onClose,
}: SystemActivityLogModalProps) {
  const [logs, setLogs] = useState<SerializedActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("TÜMÜ");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getActivityLogsAction();
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        toast.error(res.error || "Loglar alınamadı");
      }
    } catch {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const categories = ["TÜMÜ", "SİPARİŞ", "MENÜ", "MASA", "KASA", "STOK", "Z RAPORU", "PERSONEL", "AYARLAR"];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCat =
        activeCategory === "TÜMÜ" ||
        log.category.toUpperCase() === activeCategory.toUpperCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.actorName.toLowerCase().includes(q) ||
        log.actorRole.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [logs, activeCategory, searchQuery]);

  const getCategoryBadge = (category: string) => {
    const cat = category.toUpperCase();
    switch (cat) {
      case "SİPARİŞ":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            🍽️ Sipariş
          </span>
        );
      case "MENÜ":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            📋 Menü
          </span>
        );
      case "MASA":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            🪑 Masa
          </span>
        );
      case "KASA":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            💳 Kasa
          </span>
        );
      case "STOK":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            📦 Stok
          </span>
        );
      case "Z RAPORU":
      case "Z-RAPORU":
      case "Z RAPOR":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            📝 Z Raporu
          </span>
        );
      case "AYARLAR":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            ⚙️ Ayarlar
          </span>
        );
      case "PERSONEL":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            👥 Personel
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
            {category}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-in zoom-in-95"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <HistoryIcon className="size-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-gray-900 tracking-tight">
                  Sistem Değişiklik & İşlem Günlüğü
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200/80 text-gray-700">
                  {filteredLogs.length} Kayıt
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Tüm işlemler anlık tarih, saat, personel ve detaylarıyla arşivlenir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="flex size-8.5 items-center justify-center rounded-xl bg-white hover:bg-gray-100 text-gray-600 transition-colors shadow-2xs border border-gray-200 cursor-pointer disabled:opacity-50"
              title="Yenile"
            >
              <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8.5 items-center justify-center rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors shadow-2xs border border-gray-200 cursor-pointer"
              title="Kapat"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-white space-y-2.5">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Personel adı, işlem türü veya detay ara..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-xs font-semibold text-gray-800 placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LOGS TIMELINE LIST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[500px]">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <RefreshCwIcon className="size-6 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Loglar yükleniyor...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2 text-center">
              <HistoryIcon className="size-8 text-gray-300 stroke-1" />
              <p className="text-xs font-semibold text-gray-600">Henüz kayıtlı bir işlem logu bulunamadı.</p>
              <p className="text-[11px] text-gray-400 max-w-sm">
                Sistemde yapılan sipariş, masa, menü ve ayar değişiklikleri otomatik olarak burada listelenecektir.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200/80 transition-all flex flex-col gap-1.5 group"
              >
                {/* Upper line: Category, Action, Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getCategoryBadge(log.category)}
                    <span className="text-xs font-black text-gray-900 tracking-tight truncate">
                      {log.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono font-medium shrink-0">
                    <ClockIcon className="size-3 text-gray-400" />
                    <span>{log.dateFormatted} · {log.timeFormatted}</span>
                  </div>
                </div>

                {/* Actor & Details */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                    <div className="flex size-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black">
                      {log.actorName ? log.actorName.charAt(0).toUpperCase() : "P"}
                    </div>
                    <span>{log.actorName}</span>
                    <span className="text-[10px] text-gray-400 font-medium">({log.actorRole})</span>
                  </div>

                  {log.details && (
                    <div className="text-[11px] text-gray-600 font-medium bg-white px-2.5 py-1 rounded-lg border border-gray-200/60 max-w-full truncate">
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500">
          <span>🔒 Güvenlik Notu: Superadmin (Uğur UĞURLU) işlemleri loglanmaz.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
