"use client";

import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import Link from "next/link";
import {
  ChefHatIcon,
  CheckCircle2Icon,
  ClockIcon,
  RefreshCwIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
  Volume2Icon,
  VolumeXIcon,
  FlameIcon,
  UtensilsCrossedIcon,
  AlertTriangleIcon,
  ArmchairIcon,
  LayersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getReadyToServeItemsAction,
  markItemsServedAction,
  type ReadyToServeItemDTO,
} from "@/actions/kitchen.actions";

interface WaiterReadyItemsPanelProps {
  readonly initialItems?: readonly ReadyToServeItemDTO[];
}

/**
 * Web Audio API synthesize pleasant bell/chime sound for ready dishes
 */
function playReadyChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic bell frequencies (G5 - C6 - E6)
    const freqs = [783.99, 1046.5, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.09;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  } catch {
    // Ignore audio policy blocks
  }
}

export function WaiterReadyItemsPanel({ initialItems = [] }: WaiterReadyItemsPanelProps) {
  const [items, setItems] = useState<ReadyToServeItemDTO[]>([...initialItems]);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [deliveringIds, setDeliveringIds] = useState<Record<string, boolean>>({});

  const prevItemIdsRef = useRef<Set<string>>(new Set(initialItems.map((i) => i.id)));

  // Real-time fetcher
  const fetchReadyItems = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await getReadyToServeItemsAction({});
      if (res.success && res.data) {
        const fresh = res.data;
        // Detect newly arrived dishes
        if (soundEnabled) {
          const freshIds = new Set(fresh.map((i) => i.id));
          const hasNew = fresh.some((i) => !prevItemIdsRef.current.has(i.id));
          if (hasNew && prevItemIdsRef.current.size > 0) {
            playReadyChime();
            toast.info("🔔 Yeni Servis Hazır!", {
              description: "Mutfaktan yeni bir sipariş hazırlandı, masaya iletiniz.",
            });
          }
          prevItemIdsRef.current = freshIds;
        }
        setItems(fresh);
      }
    } catch (e) {
      console.error("Failed to refresh ready to serve items:", e);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [soundEnabled]);

  // Periodic polling every 7 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReadyItems(false);
    }, 7000);
    return () => clearInterval(interval);
  }, [fetchReadyItems]);

  // Handle Mark Single Item Served
  const handleServeItem = (item: ReadyToServeItemDTO) => {
    if (deliveringIds[item.id]) return;

    setDeliveringIds((prev) => ({ ...prev, [item.id]: true }));

    // Optimistic UI update
    setItems((prev) => prev.filter((it) => it.id !== item.id));

    startTransition(async () => {
      try {
        const res = await markItemsServedAction({ itemIds: [item.id] });
        if (res.success) {
          toast.success(`🍽️ ${item.quantity}x ${item.name} Servis Edildi!`, {
            description: `${item.tableLabel} masasına teslim edildi olarak işaretlendi.`,
          });
        } else {
          // Revert if error
          toast.error("Servis işlemi kaydedilemedi.");
          fetchReadyItems(false);
        }
      } catch {
        toast.error("İşlem sırasında bağlantı hatası oluştu.");
        fetchReadyItems(false);
      } finally {
        setDeliveringIds((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    });
  };

  // Handle Mark All Items For a Table Served
  const handleServeTableGroup = (tableLabel: string, tableItems: ReadyToServeItemDTO[]) => {
    const ids = tableItems.map((i) => i.id);
    setDeliveringIds((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = true));
      return next;
    });

    // Optimistic UI
    setItems((prev) => prev.filter((it) => !ids.includes(it.id)));

    startTransition(async () => {
      try {
        const res = await markItemsServedAction({ itemIds: ids });
        if (res.success) {
          toast.success(`🎉 ${tableLabel} Masasının Tüm Siparişleri Servis Edildi!`, {
            description: `${ids.length} adet hazır tabak teslim edildi.`,
          });
        } else {
          toast.error("Toplu servis işlemi kaydedilemedi.");
          fetchReadyItems(false);
        }
      } catch {
        toast.error("İşlem sırasında bağlantı hatası oluştu.");
        fetchReadyItems(false);
      } finally {
        setDeliveringIds((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          return next;
        });
      }
    });
  };

  // Extract unique tables for filter tabs
  const tableCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.tableLabel] = (acc[item.tableLabel] || 0) + item.quantity;
    return acc;
  }, {});
  const uniqueTables = Object.keys(tableCounts);

  // Filter items by selected table
  const displayedItems =
    selectedTableFilter === "ALL"
      ? items
      : items.filter((it) => it.tableLabel === selectedTableFilter);

  return (
    <div className="col-span-1 md:col-span-1 xl:col-span-2 flex flex-col gap-3 sm:gap-4 anim-sleek">
      {/* PANEL CONTAINER */}
      <div className="w-full rounded-2xl sm:rounded-3xl border-t border-t-white border-x border-gray-200/90 border-b-[3px] border-b-gray-300/80 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] p-4 sm:p-5 flex flex-col gap-3.5">
        
        {/* PANEL HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs shrink-0">
              <ChefHatIcon className="size-5.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                  Servise Hazır Ürünler
                </h2>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100/80 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {items.length} Tabak Hazır
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Mutfaktan çıkan ve masaya servis bekleyen lezzetler (İşlem Sırasına Göre)
              </p>
            </div>
          </div>

          {/* Action Tools: Sound Chime & Refresh */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sound Mute/Unmute Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={cn(
                "p-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1.5",
                soundEnabled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
              )}
              title={soundEnabled ? "Servis Zili Açık" : "Servis Zili Sessiz"}
            >
              {soundEnabled ? <Volume2Icon className="size-3.5" /> : <VolumeXIcon className="size-3.5" />}
              <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Zil Açık" : "Sessiz"}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => fetchReadyItems(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-700 border border-gray-200 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Listeyi Şimdi Yenile"
            >
              <RefreshCwIcon className={cn("size-3.5", isRefreshing && "animate-spin text-primary")} />
              <span className="text-[11px] hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        {/* TABLE FILTER TABS (Eğer 2+ Farklı Masa Varsa) */}
        {uniqueTables.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTableFilter("ALL")}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer shadow-2xs",
                selectedTableFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Tüm Masalar ({items.length})
            </button>
            {uniqueTables.map((tbl) => (
              <button
                key={tbl}
                type="button"
                onClick={() => setSelectedTableFilter(tbl)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5",
                  selectedTableFilter === tbl
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-100"
                )}
              >
                <span>{tbl}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 font-extrabold">
                  {tableCounts[tbl]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* READY ITEMS CONTENT */}
        {displayedItems.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-gray-200">
            <div className="size-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-inner ring-4 ring-emerald-100/50">
              <CheckCircle2Icon className="size-8 stroke-[2.2]" />
            </div>
            <div className="space-y-1 max-w-sm px-4">
              <h3 className="text-sm sm:text-base font-black text-gray-900">
                Tüm Servisler Masalara İletildi 👍
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Mutfakta şu an servise hazır bekleyen ürün bulunmuyor. Yeni bir tabak hazırlandığında işlem sırası önceliğine göre burada belirecektir.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mutfak servisi canlı izleniyor</span>
            </div>
          </div>
        ) : (
          /* CARDS GRID (İŞLEM SIRASI ÖNCELİĞİNE GÖRE SIRALI) */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {displayedItems.map((item, index) => {
              const isUrgent = item.elapsedMinutes >= 5;
              const isDelivering = Boolean(deliveringIds[item.id]);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "anim-sleek group relative flex flex-col justify-between p-4 rounded-2xl sm:rounded-3xl border transition-all duration-200",
                    "bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]",
                    isUrgent
                      ? "border-red-300/90 hover:border-red-400 ring-2 ring-red-500/15"
                      : "border-gray-200 hover:border-emerald-300 hover:shadow-md",
                    isDelivering && "opacity-40 scale-95 pointer-events-none"
                  )}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* TOP ROW: PRIORITY BADGE + TABLE + TIME AGO */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* İşlem Sırası Öncelik Rozeti */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide shadow-2xs",
                          item.priorityOrder === 1
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20"
                            : item.priorityOrder <= 3
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        )}
                      >
                        {item.priorityOrder === 1 ? (
                          <FlameIcon className="size-3 fill-white" />
                        ) : (
                          <SparklesIcon className="size-3" />
                        )}
                        <span>#{item.priorityOrder} Öncelik</span>
                      </span>

                      {/* Masa Etiketi */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-800 border border-blue-200">
                        <ArmchairIcon className="size-3" />
                        <span>{item.tableLabel}</span>
                      </span>
                    </div>

                    {/* Bekleme Süresi */}
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-bold shrink-0 tabular-nums",
                        isUrgent ? "text-red-600 font-black animate-pulse" : "text-gray-500"
                      )}
                      title={
                        isUrgent
                          ? "5 dakikadan uzun süredir serviste bekliyor! Lütfen hemen masaya iletiniz."
                          : "Hazırlanma süresi"
                      }
                    >
                      <ClockIcon className="size-3" />
                      <span>{item.elapsedMinutes === 0 ? "Az önce çıktı" : `${item.elapsedMinutes} dk önce`}</span>
                    </div>
                  </div>

                  {/* ITEM BODY: ADET & İSİM & VARYANT & NOTLAR */}
                  <div className="py-3 space-y-1.5 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
                          <span className="text-blue-600 mr-1.5 inline-block font-extrabold">
                            {item.quantity}x
                          </span>
                          {item.name}
                        </h4>

                        {/* Varyant / Porsiyon */}
                        {item.variantName && (
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700">
                            {item.variantName}
                          </span>
                        )}
                      </div>

                      {/* Sipariş No */}
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">
                        #{item.orderNumber}
                      </span>
                    </div>

                    {/* Modifiers / Ekstra Malzemeler */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {item.modifiers.map((mod, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            +{mod}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Line Note (Özel Müşteri Notu) */}
                    {item.lineNote && (
                      <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-1.5 mt-1">
                        <span className="text-xs">💬</span>
                        <span className="line-clamp-2">{item.lineNote}</span>
                      </div>
                    )}
                  </div>

                  {/* FOOTER ACTIONS: SERVİS EDİLDİ & MASAYA GİT */}
                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    {/* Masaya Git Linki */}
                    <Link
                      href="/dashboard/tables"
                      className="px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1"
                      title="Masalar ekranını aç"
                    >
                      <span>Masaya Git</span>
                      <ArrowRightIcon className="size-3" />
                    </Link>

                    {/* Servis Edildi Butonu (Ana Aksiyon) */}
                    <button
                      type="button"
                      onClick={() => handleServeItem(item)}
                      disabled={isDelivering || isPending}
                      className={cn(
                        "px-4 py-2 rounded-xl font-black text-xs text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5",
                        "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25",
                        "disabled:opacity-50"
                      )}
                    >
                      <CheckIcon className="size-3.5 stroke-[3]" />
                      <span>{isDelivering ? "Kaydediliyor…" : "Servis Edildi"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM HELPER: TOPLU MASAYI SERVİS ET BUTONU (Eğer seçili masada 2+ ürün varsa) */}
        {selectedTableFilter !== "ALL" && displayedItems.length > 1 && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">
              {selectedTableFilter} için hazır bekleyen {displayedItems.length} ürün var
            </span>
            <button
              type="button"
              onClick={() => handleServeTableGroup(selectedTableFilter, displayedItems)}
              className="px-3 py-1.5 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2Icon className="size-3.5" />
              <span>Tüm Masayı Servis Et ({displayedItems.length} Tabak)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
