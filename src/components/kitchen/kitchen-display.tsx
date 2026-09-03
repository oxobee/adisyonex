"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  BellRingIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChefHatIcon,
  ClockIcon,
  FlameIcon,
  Maximize2Icon,
  Minimize2Icon,
  PackageIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UtensilsIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { toast } from "sonner";

import { advanceTicketAction } from "@/actions/kitchen.actions";
import { SelfOrderBadge } from "@/components/shared/self-order-badge";
import { useAnnouncer } from "@/hooks/use-announcer";
import { useServerAction } from "@/hooks/use-server-action";
import {
  alertSignatureMap,
  newOrderAlerts,
  newOrderPhrase,
  selfOrderAlertPhrase,
} from "@/lib/announce";
import { KITCHEN_STATUS_LABEL, type KitchenStatus } from "@/lib/kitchen";
import { cn } from "@/lib/utils";
import type { KitchenTicketDTO } from "@/types/kitchen";

type FilterTab = "ALL" | "WAITING" | "PREPARING" | "READY";

const CARD_THEME: Record<
  KitchenStatus,
  {
    cardBorder: string;
    cardGlow: string;
    headerBg: string;
    badgeBg: string;
    badgeText: string;
    stepColor: string;
    btnClass: string;
    btnLabel: string;
    statusIcon: React.ComponentType<{ className?: string }>;
  }
> = {
  WAITING: {
    cardBorder: "border-rose-500/50 hover:border-rose-400/80",
    cardGlow: "shadow-[0_8px_30px_rgba(244,63,94,0.15)]",
    headerBg: "bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-zinc-900/80 border-rose-500/40",
    badgeBg: "bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]",
    badgeText: "Bekliyor",
    stepColor: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
    btnClass: "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)] active:scale-95",
    btnLabel: "🔥 Hazırlamaya Başla",
    statusIcon: FlameIcon,
  },
  PREPARING: {
    cardBorder: "border-amber-500/50 hover:border-amber-400/80",
    cardGlow: "shadow-[0_8px_30px_rgba(245,158,11,0.15)]",
    headerBg: "bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-zinc-900/80 border-amber-500/40",
    badgeBg: "bg-amber-500 text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse",
    badgeText: "Hazırlanıyor",
    stepColor: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
    btnClass: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-[0_8px_20px_rgba(245,158,11,0.35)] active:scale-95",
    btnLabel: "✨ Hazırlandı Olarak İşaretle",
    statusIcon: ChefHatIcon,
  },
  READY: {
    cardBorder: "border-emerald-500/50 hover:border-emerald-400/80",
    cardGlow: "shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
    headerBg: "bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-zinc-900/80 border-emerald-500/40",
    badgeBg: "bg-emerald-500 text-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]",
    badgeText: "Servise Hazır",
    stepColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    btnClass: "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95",
    btnLabel: "Servise Hazır",
    statusIcon: SparklesIcon,
  },
};

const AUTH_ERRORS: Record<string, string> = {
  STAFF_FORBIDDEN: "Bu işlemi yapmaya yetkiniz yok.",
  NO_STAFF_SESSION: "Oturum süreniz doldu. Lütfen tekrar giriş yapın.",
};
const toMessage = (m: string): string => AUTH_ERRORS[m] ?? m;

/** Fix duplicate "Masa Masa - 1" formatting */
const ticketTitle = (t: KitchenTicketDTO): string => {
  if (t.orderType === "DINE_IN") {
    if (!t.tableLabel) return "Masada Servis";
    const clean = t.tableLabel.trim();
    return clean.toLowerCase().startsWith("masa") ? clean : `Masa ${clean}`;
  }
  if (t.orderType === "DELIVERY") {
    return `Paket #${t.orderNumber}`;
  }
  return `Gel-Al #${t.orderNumber}`;
};

const getMinutesElapsed = (iso: string | null, now: number): number => {
  if (!iso) return 0;
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
};

const selfOrderLineCount = (t: KitchenTicketDTO): number =>
  t.batches.reduce((s, b) => s + (b.isSelfOrder ? b.lines.length : 0), 0);

function TicketCard({
  ticket,
  now,
}: {
  readonly ticket: KitchenTicketDTO;
  readonly now: number;
}) {
  const advance = useServerAction(advanceTicketAction, {
    refresh: true,
    onError: (m) => toast.error(toMessage(m)),
  });

  // Dokunmatik panelde aşçıların hazırladıkları kalemleri işaretleyebilmesi için yerel durum
  const [checkedLines, setCheckedLines] = useState<Record<string, boolean>>({});

  const toggleLine = (id: string) => {
    setCheckedLines((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const theme = CARD_THEME[ticket.status];
  const minsElapsed = getMinutesElapsed(ticket.firstFiredAt, now);
  const isUrgent = minsElapsed >= 20;
  const isWarning = minsElapsed >= 10 && minsElapsed < 20;

  return (
    <li
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 transition-all duration-200 select-none",
        "bg-[#111319] text-white shadow-xl hover:-translate-y-1 hover:shadow-2xl",
        "animate-in fade-in zoom-in-95 duration-300",
        theme.cardBorder,
        theme.cardGlow,
        isUrgent && "ring-2 ring-red-500/80 animate-pulse",
      )}
    >
      {/* KART BAŞLIĞI */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b p-4 backdrop-blur-md transition-colors",
          theme.headerBg,
        )}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {ticket.orderType === "DINE_IN" ? (
              <UtensilsIcon className="size-5 text-amber-400 shrink-0" />
            ) : ticket.orderType === "DELIVERY" ? (
              <PackageIcon className="size-5 text-sky-400 shrink-0" />
            ) : (
              <ShoppingBagIcon className="size-5 text-emerald-400 shrink-0" />
            )}
            <h3 className="truncate text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-sm">
              {ticketTitle(ticket)}
            </h3>
          </div>

          {/* Bekleme Süresi Rozeti */}
          {ticket.firstFiredAt && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black border tracking-tight tabular-nums",
                  isUrgent
                    ? "bg-red-500/25 border-red-500/50 text-red-300 animate-pulse"
                    : isWarning
                      ? "bg-amber-500/25 border-amber-500/50 text-amber-300"
                      : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
                )}
              >
                <ClockIcon className="size-3" />
                <span>{minsElapsed} dk bekleme</span>
                {isUrgent && <span className="text-[10px] ml-0.5 font-bold">⚠️ Kritik</span>}
              </span>
            </div>
          )}
        </div>

        {/* Durum Rozeti */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider shadow-md",
              theme.badgeBg,
            )}
          >
            {theme.badgeText}
          </span>
          <span className="text-[10px] font-bold text-zinc-400">
            Fiş #{ticket.orderNumber}
          </span>
        </div>
      </div>

      {/* 3 AŞAMALI AKILLI İLERLEME ÇİZGİSİ */}
      <div className="grid grid-cols-3 gap-1.5 px-4 pt-3.5 pb-2 bg-black/20 border-b border-white/5">
        {/* Aşama 1: Bekliyor */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "WAITING"
                ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                : "bg-rose-500/60",
            )}
          />
          <span
            className={cn(
              "text-[10px] tracking-tight font-bold",
              ticket.status === "WAITING" ? "text-rose-400 font-black" : "text-zinc-500",
            )}
          >
            1. Bekliyor
          </span>
        </div>

        {/* Aşama 2: Hazırlanıyor */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "PREPARING"
                ? "bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse"
                : ticket.status === "READY"
                  ? "bg-emerald-500"
                  : "bg-zinc-800",
            )}
          />
          <span
            className={cn(
              "text-[10px] tracking-tight font-bold",
              ticket.status === "PREPARING"
                ? "text-amber-400 font-black"
                : ticket.status === "READY"
                  ? "text-emerald-400"
                  : "text-zinc-500",
            )}
          >
            2. Hazırlanıyor
          </span>
        </div>

        {/* Aşama 3: Servise Hazır */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "READY"
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : "bg-zinc-800",
            )}
          />
          <span
            className={cn(
              "text-[10px] tracking-tight font-bold",
              ticket.status === "READY" ? "text-emerald-400 font-black" : "text-zinc-500",
            )}
          >
            3. Servise Hazır
          </span>
        </div>
      </div>

      {/* DOKUNMATİK UYUMLU SİPARİŞ KALEMLERİ LİSTESİ */}
      <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto max-h-[320px]">
        {ticket.batches.map((batch, idx) => (
          <div key={batch.firedAt ?? idx} className="flex flex-col gap-2">
            {batch.isAddOn || batch.isSelfOrder ? (
              <div className="flex items-center gap-2">
                {batch.isAddOn ? (
                  <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-black uppercase">
                    ＋ Ek Sipariş ({getMinutesElapsed(batch.firedAt, now)} dk önce)
                  </span>
                ) : null}
                {batch.isSelfOrder ? <SelfOrderBadge /> : null}
              </div>
            ) : null}

            <ul className="divide-y divide-white/10 rounded-2xl bg-black/40 border border-white/10 overflow-hidden shadow-inner">
              {batch.lines.map((line) => {
                const isChecked = checkedLines[line.id] ?? false;

                return (
                  <li
                    key={line.id}
                    onClick={() => toggleLine(line.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-all cursor-pointer select-none active:bg-white/10",
                      isChecked ? "bg-emerald-950/20 opacity-50" : "hover:bg-white/5",
                    )}
                    title="Hazırlanan ürünü tamamlamak için dokunun"
                  >
                    {/* Checkbox / Adet Kutusu */}
                    <div
                      className={cn(
                        "flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl font-black text-sm tabular-nums border transition-all duration-150 shadow-xs",
                        isChecked
                          ? "bg-emerald-500 border-emerald-400 text-zinc-950 scale-95"
                          : "bg-white/10 border-white/20 text-white group-hover:scale-105",
                      )}
                    >
                      {isChecked ? (
                        <CheckIcon className="size-5 stroke-[3]" />
                      ) : (
                        `${line.quantity}×`
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm sm:text-base font-black leading-snug transition-all",
                          isChecked ? "line-through text-zinc-400" : "text-white",
                        )}
                      >
                        {line.name}
                        {line.variantName && (
                          <span className="text-zinc-300 font-bold ml-1">
                            ({line.variantName})
                          </span>
                        )}
                      </span>

                      {/* Seçenekler / Modifiers */}
                      {line.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {line.modifiers.map((mod, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-white/10 border border-white/15 px-1.5 py-0.2 text-[10px] font-bold text-zinc-300"
                            >
                              {mod}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Not Uyarısı */}
                      {line.lineNote && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 text-xs font-extrabold shadow-xs">
                          <AlertTriangleIcon className="size-3.5 text-amber-400 shrink-0" />
                          <span>Not: “{line.lineNote}”</span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* DEV DOKUNMATİK AKSİYON BUTONU (TOUCH PANEL ENTEGRASYONU) */}
      <div className="p-4 pt-2 border-t border-white/10 bg-black/30">
        {ticket.advanceLabel ? (
          <button
            type="button"
            disabled={advance.isPending}
            onClick={() => advance.execute({ orderId: ticket.orderId })}
            className={cn(
              "flex items-center justify-center gap-2.5 h-14 sm:h-15 w-full rounded-2xl text-base sm:text-lg font-black tracking-wide uppercase transition-all duration-150 cursor-pointer select-none",
              theme.btnClass,
            )}
          >
            {advance.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>İşleniyor...</span>
              </span>
            ) : (
              theme.btnLabel
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2.5 h-14 sm:h-15 w-full rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/20">
            <CheckCircle2Icon className="size-6 text-emerald-400 shrink-0" />
            <span>Servise & Garsona Teslime Hazır</span>
          </div>
        )}
      </div>
    </li>
  );
}

export function KitchenDisplay({
  username,
  restaurantName,
  staffName,
  tickets,
}: {
  readonly username: string;
  readonly restaurantName: string;
  readonly staffName: string;
  readonly tickets: readonly KitchenTicketDTO[];
}) {
  const router = useRouter();
  const { supported, enabled, toggle, announce } = useAnnouncer();
  const [now, setNow] = useState(() => Date.now());
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const seenRef = useRef<Map<string, number> | null>(null);

  // Canlı saat ve 3 saniyede bir hafif yenileme
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);

  // Fullscreen dinleyicisi
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Yeni sipariş sesli uyarısı
  useEffect(() => {
    const sigs = tickets.map((t) => ({
      id: t.orderId,
      selfOrderLines: selfOrderLineCount(t),
    }));
    if (seenRef.current === null) {
      seenRef.current = alertSignatureMap(sigs);
      return;
    }
    const alerts = newOrderAlerts(seenRef.current, sigs);
    seenRef.current = alertSignatureMap(sigs);
    const alert = alerts[0];
    if (!alert) return;

    const ticket = tickets.find((t) => t.orderId === alert.id);
    if (ticket) {
      announce(
        alert.isSelfOrder ? selfOrderAlertPhrase(ticket) : newOrderPhrase(ticket),
        "beep",
      );
    }
  }, [tickets, announce]);

  // Sayaçlar
  const counts = useMemo(() => {
    const waiting = tickets.filter((t) => t.status === "WAITING").length;
    const preparing = tickets.filter((t) => t.status === "PREPARING").length;
    const ready = tickets.filter((t) => t.status === "READY").length;
    const overdue = tickets.filter(
      (t) => t.firstFiredAt && getMinutesElapsed(t.firstFiredAt, now) >= 20,
    ).length;

    return { total: tickets.length, waiting, preparing, ready, overdue };
  }, [tickets, now]);

  // Filtrelenmiş fişler
  const filteredTickets = useMemo(() => {
    if (activeFilter === "ALL") return tickets;
    return tickets.filter((t) => t.status === activeFilter);
  }, [tickets, activeFilter]);

  return (
    <div className="w-full flex flex-col gap-4 p-3 sm:p-5 lg:p-6 max-w-[1800px] mx-auto min-h-screen">
      {/* 
        PREMIUM KDS HEADER CONTROL BAR:
        - Mutfak İstasyonu + Canlı Dijital Saat
        - Dokunmatik Filtre Sekmeleri
        - Ses & Tam Ekran KDS Butonları
      */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl border border-white/10 bg-[#12141c]/90 backdrop-blur-2xl shadow-2xl">
        {/* Sol Alan: Restoran & Aşçı */}
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 sm:size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950 font-black shadow-lg shadow-orange-500/30">
            <ChefHatIcon className="size-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {restaurantName}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-xs font-bold text-zinc-400">
                Mutfak İstasyonu
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {staffName}
            </h1>
          </div>
        </div>

        {/* Orta Alan: Dokunmatik Filtre Sekmeleri */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeFilter === "ALL"
                ? "bg-white text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5",
            )}
          >
            Tümü ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("WAITING")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5",
              activeFilter === "WAITING"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/40"
                : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10",
            )}
          >
            <FlameIcon className="size-4" />
            <span>Bekleyen ({counts.waiting})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("PREPARING")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5",
              activeFilter === "PREPARING"
                ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/40"
                : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10",
            )}
          >
            <ChefHatIcon className="size-4" />
            <span>Hazırlanıyor ({counts.preparing})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("READY")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5",
              activeFilter === "READY"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/40"
                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
            )}
          >
            <SparklesIcon className="size-4" />
            <span>Hazır ({counts.ready})</span>
          </button>
        </div>

        {/* Sağ Alan: Ses & Tam Ekran Araçları */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto">
          {/* Kritik Gecikme Rozeti */}
          {counts.overdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black animate-pulse">
              <AlertTriangleIcon className="size-4 text-red-400" />
              <span>{counts.overdue} Gecikme</span>
            </div>
          )}

          {/* Ses Kontrolü */}
          {supported && (
            <button
              type="button"
              onClick={toggle}
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl border transition-all cursor-pointer active:scale-90 shadow-md",
                enabled
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10",
              )}
              title={enabled ? "Sesli Uyarı Açık" : "Sesli Uyarı Kapalı"}
              aria-label="Ses Kontrolü"
            >
              {enabled ? (
                <Volume2Icon className="size-5" />
              ) : (
                <VolumeXIcon className="size-5" />
              )}
            </button>
          )}

          {/* Tam Ekran KDS Butonu */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90 shadow-md"
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran KDS Modu"}
            aria-label="Tam Ekran"
          >
            {isFullscreen ? (
              <Minimize2Icon className="size-5" />
            ) : (
              <Maximize2Icon className="size-5" />
            )}
          </button>
        </div>
      </header>

      {/* SİPARİŞ FİŞLERİ GRID DÜZENİ */}
      {filteredTickets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-[#12141c]/50 p-12 text-center my-auto min-h-[420px]">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-zinc-400 mb-4 shadow-xl animate-bounce">
            <ChefHatIcon className="size-10 stroke-[2] text-amber-400" />
          </div>
          <h3 className="text-xl font-black text-white">
            {activeFilter === "ALL"
              ? "Şu an bekleyen mutfak siparişi yok"
              : "Bu filtrede sipariş bulunmuyor"}
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm mt-2">
            Yeni siparişler verildiğinde sesli uyarı ve animasyonlarla anlık olarak bu ekranda görüntülenecektir.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full">
          {filteredTickets.map((t) => (
            <TicketCard key={t.orderId} ticket={t} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}
