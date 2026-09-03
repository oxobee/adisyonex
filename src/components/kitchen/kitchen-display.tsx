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
    headerBg: string;
    badgeBg: string;
    badgeText: string;
    stepColor: string;
    btnClass: string;
    btnLabel: string;
  }
> = {
  WAITING: {
    cardBorder: "border-rose-200 hover:border-rose-300",
    headerBg: "bg-rose-50/80 border-b border-rose-100",
    badgeBg: "bg-rose-100 text-rose-800 border border-rose-200",
    badgeText: "Bekliyor",
    stepColor: "bg-rose-500",
    btnClass: "bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs active:scale-95",
    btnLabel: "🔥 Hazırlamaya Başla",
  },
  PREPARING: {
    cardBorder: "border-amber-200 hover:border-amber-300",
    headerBg: "bg-amber-50/80 border-b border-amber-100",
    badgeBg: "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse",
    badgeText: "Hazırlanıyor",
    stepColor: "bg-amber-500",
    btnClass: "bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold shadow-xs active:scale-95",
    btnLabel: "✨ Hazırlandı Olarak İşaretle",
  },
  READY: {
    cardBorder: "border-emerald-200 hover:border-emerald-300",
    headerBg: "bg-emerald-50/80 border-b border-emerald-100",
    badgeBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    badgeText: "Servise Hazır",
    stepColor: "bg-emerald-500",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs active:scale-95",
    btnLabel: "Servise Hazır",
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
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-200 select-none",
        "bg-white text-gray-900 shadow-xs hover:shadow-md",
        "animate-in fade-in zoom-in-95 duration-200",
        theme.cardBorder,
        isUrgent && "ring-2 ring-rose-500/50",
      )}
    >
      {/* KART BAŞLIĞI */}
      <div className={cn("flex items-center justify-between gap-3 p-4 transition-colors", theme.headerBg)}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {ticket.orderType === "DINE_IN" ? (
              <UtensilsIcon className="size-5 text-amber-600 shrink-0" />
            ) : ticket.orderType === "DELIVERY" ? (
              <PackageIcon className="size-5 text-blue-600 shrink-0" />
            ) : (
              <ShoppingBagIcon className="size-5 text-emerald-600 shrink-0" />
            )}
            <h3 className="truncate text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              {ticketTitle(ticket)}
            </h3>
          </div>

          {ticket.firstFiredAt && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border tracking-tight tabular-nums",
                  isUrgent
                    ? "bg-rose-100 border-rose-200 text-rose-800 animate-pulse"
                    : isWarning
                      ? "bg-amber-100 border-amber-200 text-amber-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700",
                )}
              >
                <ClockIcon className="size-3" />
                <span>{minsElapsed} dk bekleme</span>
                {isUrgent && <span className="text-[10px] ml-0.5 font-bold">⚠️ Kritik</span>}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider", theme.badgeBg)}>
            {theme.badgeText}
          </span>
          <span className="text-[11px] font-medium text-gray-500">
            #{ticket.orderNumber}
          </span>
        </div>
      </div>

      {/* 3 AŞAMALI İLERLEME ÇİZGİSİ */}
      <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100">
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "WAITING" ? "bg-rose-500" : "bg-rose-300",
            )}
          />
          <span className={cn("text-[10px] font-semibold", ticket.status === "WAITING" ? "text-rose-700 font-bold" : "text-gray-400")}>
            1. Bekliyor
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "PREPARING"
                ? "bg-amber-500 animate-pulse"
                : ticket.status === "READY"
                  ? "bg-emerald-500"
                  : "bg-gray-200",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-semibold",
              ticket.status === "PREPARING"
                ? "text-amber-700 font-bold"
                : ticket.status === "READY"
                  ? "text-emerald-700"
                  : "text-gray-400",
            )}
          >
            2. Hazırlanıyor
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "READY" ? "bg-emerald-500" : "bg-gray-200",
            )}
          />
          <span className={cn("text-[10px] font-semibold", ticket.status === "READY" ? "text-emerald-700 font-bold" : "text-gray-400")}>
            3. Servise Hazır
          </span>
        </div>
      </div>

      {/* SİPARİŞ KALEMLERİ LİSTESİ */}
      <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto max-h-[320px]">
        {ticket.batches.map((batch, idx) => (
          <div key={batch.firedAt ?? idx} className="flex flex-col gap-2">
            {batch.isAddOn || batch.isSelfOrder ? (
              <div className="flex items-center gap-2">
                {batch.isAddOn ? (
                  <span className="rounded-md bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-bold uppercase">
                    ＋ Ek Sipariş ({getMinutesElapsed(batch.firedAt, now)} dk önce)
                  </span>
                ) : null}
                {batch.isSelfOrder ? <SelfOrderBadge /> : null}
              </div>
            ) : null}

            <ul className="divide-y divide-gray-100 rounded-xl bg-gray-50/60 border border-gray-200/80 overflow-hidden">
              {batch.lines.map((line) => {
                const isChecked = checkedLines[line.id] ?? false;

                return (
                  <li
                    key={line.id}
                    onClick={() => toggleLine(line.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-all cursor-pointer select-none active:bg-gray-100",
                      isChecked ? "bg-emerald-50/50 opacity-60" : "hover:bg-white",
                    )}
                    title="Hazırlanan ürünü tamamlamak için dokunun"
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs tabular-nums border transition-all shadow-2xs",
                        isChecked
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "bg-white border-gray-200 text-gray-800",
                      )}
                    >
                      {isChecked ? <CheckIcon className="size-4 stroke-[3]" /> : `${line.quantity}×`}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-bold leading-snug transition-all", isChecked ? "line-through text-gray-400" : "text-gray-900")}>
                        {line.name}
                        {line.variantName && (
                          <span className="text-gray-500 font-medium ml-1">({line.variantName})</span>
                        )}
                      </span>

                      {line.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {line.modifiers.map((mod, i) => (
                            <span key={i} className="rounded-md bg-white border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                              {mod}
                            </span>
                          ))}
                        </div>
                      )}

                      {line.lineNote && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-xs font-semibold">
                          <AlertTriangleIcon className="size-3.5 text-amber-600 shrink-0" />
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

      {/* DEV DOKUNMATİK AKSİYON BUTONU */}
      <div className="p-4 pt-2 border-t border-gray-100 bg-gray-50/40">
        {ticket.advanceLabel ? (
          <button
            type="button"
            disabled={advance.isPending}
            onClick={() => advance.execute({ orderId: ticket.orderId })}
            className={cn(
              "flex items-center justify-center gap-2 h-13 w-full rounded-xl text-sm sm:text-base font-bold tracking-wide uppercase transition-all duration-150 cursor-pointer select-none",
              theme.btnClass,
            )}
          >
            {advance.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span>İşleniyor...</span>
              </span>
            ) : (
              theme.btnLabel
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 h-13 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-sm shadow-2xs">
            <CheckCircle2Icon className="size-5 text-emerald-600 shrink-0" />
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

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);

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

  const counts = useMemo(() => {
    const waiting = tickets.filter((t) => t.status === "WAITING").length;
    const preparing = tickets.filter((t) => t.status === "PREPARING").length;
    const ready = tickets.filter((t) => t.status === "READY").length;
    const overdue = tickets.filter(
      (t) => t.firstFiredAt && getMinutesElapsed(t.firstFiredAt, now) >= 20,
    ).length;

    return { total: tickets.length, waiting, preparing, ready, overdue };
  }, [tickets, now]);

  const filteredTickets = useMemo(() => {
    if (activeFilter === "ALL") return tickets;
    return tickets.filter((t) => t.status === activeFilter);
  }, [tickets, activeFilter]);

  return (
    <div className="w-full flex flex-col gap-5 p-3.5 sm:p-5 lg:p-6 max-w-[1800px] mx-auto min-h-screen">
      {/* UNTITLED UI KDS HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ChefHatIcon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {restaurantName}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs font-semibold text-gray-600">
                Mutfak İstasyonu
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              {staffName}
            </h1>
          </div>
        </div>

        {/* Untitled UI Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200/80 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeFilter === "ALL"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            Tümü ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("WAITING")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5",
              activeFilter === "WAITING"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-rose-600 hover:text-rose-700",
            )}
          >
            <FlameIcon className="size-3.5" />
            <span>Bekleyen ({counts.waiting})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("PREPARING")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5",
              activeFilter === "PREPARING"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-amber-600 hover:text-amber-700",
            )}
          >
            <ChefHatIcon className="size-3.5" />
            <span>Hazırlanıyor ({counts.preparing})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("READY")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5",
              activeFilter === "READY"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-emerald-600 hover:text-emerald-700",
            )}
          >
            <SparklesIcon className="size-3.5" />
            <span>Hazır ({counts.ready})</span>
          </button>
        </div>

        {/* Sağ Araçlar */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {counts.overdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertTriangleIcon className="size-3.5 text-rose-600" />
              <span>{counts.overdue} Gecikme</span>
            </div>
          )}

          {supported && (
            <button
              type="button"
              onClick={toggle}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-95 shadow-2xs",
                enabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
              title={enabled ? "Sesli Uyarı Açık" : "Sesli Uyarı Kapalı"}
              aria-label="Ses Kontrolü"
            >
              {enabled ? <Volume2Icon className="size-4.5" /> : <VolumeXIcon className="size-4.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran KDS Modu"}
            aria-label="Tam Ekran"
          >
            {isFullscreen ? <Minimize2Icon className="size-4.5" /> : <Maximize2Icon className="size-4.5" />}
          </button>
        </div>
      </header>

      {/* SİPARİŞ FİŞLERİ GRID DÜZENİ */}
      {filteredTickets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center my-auto min-h-[420px] shadow-xs">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 mb-3 shadow-xs">
            <ChefHatIcon className="size-8 stroke-[1.8] text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {activeFilter === "ALL"
              ? "Şu an bekleyen mutfak siparişi yok"
              : "Bu filtrede sipariş bulunmuyor"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            Yeni siparişler verildiğinde sesli uyarı ve animasyonlarla anlık olarak bu ekranda görüntülenecektir.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 w-full">
          {filteredTickets.map((t) => (
            <TicketCard key={t.orderId} ticket={t} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}
