"use client";

import { useState, useTransition, useMemo } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  PhoneIcon,
  ArmchairIcon,
  CheckCircle2Icon,
  PlusIcon,
  ShoppingBagIcon,
  XIcon,
  SearchIcon,
  LayoutGridIcon,
  ListFilterIcon,
  RefreshCwIcon,
  UserXIcon,
  SparklesIcon,
  SunMediumIcon,
  MoonIcon,
  FlameIcon,
  MessageCircleIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createReservationAction,
  listReservationsAction,
  seatReservationAction,
  updateReservationStatusAction,
  cancelReservationAction,
  assignReservationTableAction,
} from "@/actions/reservation.actions";
import type {
  ReservationDTO,
  ReservationStatsDTO,
} from "@/services/reservation.service";
import type { TableDTO } from "@/types/table";
import type { ReservationStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

interface ReservationsManagementViewProps {
  readonly initialReservations: readonly ReservationDTO[];
  readonly initialStats: ReservationStatsDTO;
  readonly tables: readonly TableDTO[];
}

type TabKey = "ALL" | "TODAY" | "UPCOMING" | "SEATED" | "CANCELLED";
type ViewMode = "GRID" | "COMPACT" | "TABLE_TIMELINE";

export function ReservationsManagementView({
  initialReservations,
  initialStats,
  tables,
}: ReservationsManagementViewProps) {
  const [reservations, setReservations] = useState<readonly ReservationDTO[]>(initialReservations);
  const [stats, setStats] = useState<ReservationStatsDTO>(initialStats);
  const [activeTab, setActiveTab] = useState<TabKey>("TODAY");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Yeni Rezervasyon Modal Durumu
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTableId, setFormTableId] = useState("");
  const [formGuestCount, setFormGuestCount] = useState(2);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("19:30");
  const [formSource, setFormSource] = useState<"PHONE" | "POS" | "ONLINE" | "WALK_IN">("PHONE");
  const [formNotes, setFormNotes] = useState("");

  const refreshData = () => {
    startTransition(async () => {
      const res = await listReservationsAction();
      if (res.success && res.data) {
        setReservations(res.data);
      }
    });
  };

  const handleSeat = async (res: ReservationDTO) => {
    startTransition(async () => {
      const result = await seatReservationAction(res.id);
      if (!result.success) {
        toast.error(result.error || "Masaya oturtulamadı.");
        return;
      }
      toast.success(`✓ ${res.customerName} masaya oturtuldu ve sipariş başlatıldı!`);
      refreshData();
    });
  };

  const handleStatusChange = async (resId: string, status: ReservationStatus) => {
    startTransition(async () => {
      const result = await updateReservationStatusAction(resId, status);
      if (!result.success) {
        toast.error(result.error || "Durum güncellenemedi.");
        return;
      }
      toast.success("Rezervasyon durumu güncellendi.");
      refreshData();
    });
  };

  const handleCancel = async (resId: string) => {
    startTransition(async () => {
      const result = await cancelReservationAction(resId, "Yönetim paneli iptali");
      if (!result.success) {
        toast.error(result.error || "İptal edilemedi.");
        return;
      }
      toast.success("Rezervasyon iptal edildi.");
      refreshData();
    });
  };

  const handleAssignTable = async (resId: string, tableId: string) => {
    startTransition(async () => {
      const result = await assignReservationTableAction(resId, tableId ? tableId : null);
      if (!result.success) {
        toast.error(result.error || "Masa atanamadı.");
        return;
      }
      toast.success("Masa ataması güncellendi.");
      refreshData();
    });
  };

  const handleCreateNewReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Lütfen müşteri adını giriniz.");
      return;
    }
    if (!formPhone.trim()) {
      toast.error("Lütfen müşteri telefonunu giriniz.");
      return;
    }

    const resDateTime = new Date(`${formDate}T${formTime}:00`);

    startTransition(async () => {
      const res = await createReservationAction({
        customerName: formName.trim(),
        customerPhone: formPhone.trim(),
        customerEmail: formEmail.trim() || undefined,
        tableId: formTableId || null,
        guestCount: formGuestCount,
        reservationTime: resDateTime,
        source: formSource,
        notes: formNotes.trim() || null,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Rezervasyon oluşturulamadı.");
        return;
      }

      toast.success(`✓ ${res.data.customerName} için rezervasyon başarıyla oluşturuldu!`);
      setIsNewModalOpen(false);
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormTableId("");
      setFormGuestCount(2);
      setFormNotes("");
      refreshData();
    });
  };

  // Filtreleme
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // Tab filter
      if (activeTab === "TODAY") {
        if (!r.reservationTime.startsWith(todayStr)) return false;
      } else if (activeTab === "UPCOMING") {
        if (r.status !== "CONFIRMED" && r.status !== "PENDING") return false;
      } else if (activeTab === "SEATED") {
        if (r.status !== "SEATED") return false;
      } else if (activeTab === "CANCELLED") {
        if (r.status !== "CANCELLED" && r.status !== "NO_SHOW") return false;
      }

      // Specific date filter
      if (selectedDateFilter && !r.reservationTime.startsWith(selectedDateFilter)) {
        return false;
      }

      // Table filter
      if (selectedTableFilter !== "ALL" && r.tableId !== selectedTableFilter) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = r.customerName.toLowerCase().includes(q);
        const matchPhone = r.customerPhone.includes(q);
        const matchTable = r.tableLabel?.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchTable && !matchNotes) return false;
      }

      return true;
    });
  }, [reservations, activeTab, selectedDateFilter, selectedTableFilter, searchTerm, todayStr]);

  // Zaman Dilimi / Oturum Bazlı Kategorizasyon
  const categorizedGroups = useMemo(() => {
    const now = new Date();
    const urgentItems: ReservationDTO[] = [];
    const lunchItems: ReservationDTO[] = [];
    const dinnerItems: ReservationDTO[] = [];
    const futureOrOtherItems: ReservationDTO[] = [];

    // Sıralama (tarih ve saate göre artan)
    const sorted = [...filteredReservations].sort((a, b) => {
      return new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime();
    });

    for (const item of sorted) {
      const itemDate = new Date(item.reservationTime);
      const isSameDay = item.reservationTime.startsWith(todayStr);
      const diffMinutes = Math.round((itemDate.getTime() - now.getTime()) / 60000);
      const hour = itemDate.getHours();

      // Eğer bugün ise ve yaklaşmışsa (< 45 dk veya 30 dk gecikmeli ve henüz oturmamış/iptal olmamışsa)
      if (
        isSameDay &&
        item.status === "CONFIRMED" &&
        diffMinutes >= -30 &&
        diffMinutes <= 45
      ) {
        urgentItems.push(item);
      } else if (isSameDay && hour >= 11 && hour < 16) {
        lunchItems.push(item);
      } else if (isSameDay && hour >= 16) {
        dinnerItems.push(item);
      } else {
        futureOrOtherItems.push(item);
      }
    }

    const groups: {
      id: string;
      title: string;
      subtitle: string;
      icon: typeof ClockIcon;
      color: string;
      items: ReservationDTO[];
    }[] = [];

    if (urgentItems.length > 0) {
      groups.push({
        id: "urgent",
        title: "Sıradaki / Hemen Şimdi",
        subtitle: "Önümüzdeki 45 dakika içinde beklenen misafirler",
        icon: FlameIcon,
        color: "text-rose-600 bg-rose-50 border-rose-200",
        items: urgentItems,
      });
    }

    if (lunchItems.length > 0) {
      groups.push({
        id: "lunch",
        title: "Öğle Servisi",
        subtitle: "11:30 - 16:00 saatleri arasındaki rezervasyonlar",
        icon: SunMediumIcon,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        items: lunchItems,
      });
    }

    if (dinnerItems.length > 0) {
      groups.push({
        id: "dinner",
        title: "Akşam Servisi",
        subtitle: "17:00 - 23:30 saatleri arasındaki rezervasyonlar",
        icon: MoonIcon,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        items: dinnerItems,
      });
    }

    if (futureOrOtherItems.length > 0) {
      groups.push({
        id: "other",
        title: activeTab === "TODAY" ? "Gün İçi Diğer Saatler" : "İleri Tarihli & Diğer Randevular",
        subtitle: "Gelecek günler ve diğer oturumlar",
        icon: CalendarDaysIcon,
        color: "text-slate-700 bg-slate-100 border-slate-200",
        items: futureOrOtherItems,
      });
    }

    return groups;
  }, [filteredReservations, todayStr, activeTab]);

  // Ek Metrikler
  const totalGuests = useMemo(() => {
    return filteredReservations.reduce((sum, r) => sum + (r.guestCount || 1), 0);
  }, [filteredReservations]);

  const preOrderCount = useMemo(() => {
    return filteredReservations.filter((r) => r.preOrderItems && r.preOrderItems.length > 0).length;
  }, [filteredReservations]);

  // WhatsApp Bildirimi Açma
  const openWhatsAppReminder = (res: ReservationDTO) => {
    let cleanPhone = res.customerPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "9" + cleanPhone;
    } else if (!cleanPhone.startsWith("90")) {
      cleanPhone = "90" + cleanPhone;
    }

    const resDate = new Date(res.reservationTime);
    const dateStr = resDate.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
    const timeStr = resDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

    const message = encodeURIComponent(
      `Merhaba Sayın ${res.customerName},\n\n` +
      `Restoranımızdaki ${dateStr} saat ${timeStr} için ${res.guestCount} kişilik masa rezervasyonunuzu hatırlatmak isteriz.\n` +
      `${res.tableLabel ? `Masanız: Masa ${res.tableLabel}\n` : ""}` +
      `Sizi ağırlamaktan mutluluk duyacağız. Herhangi bir değişiklik durumunda bize bu numaradan ulaşabilirsiniz.\n\nİyi günler dileriz.`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* 1. ÜST BAŞLIK VE EYLEM BUTONLARI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shadow-xs">
            <CalendarDaysIcon className="size-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masa Rezervasyonları
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                Caller ID & Online Entegre
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Telefonla arayan, kasadan alınan ve online masa rezervasyonlarının merkezi yönetimi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Görünüm Seçici */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutGridIcon className="size-3.5" />
              <span>Kart Izgarası</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("COMPACT")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "COMPACT"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ListFilterIcon className="size-3.5" />
              <span>Kompakt Liste</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE_TIMELINE")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "TABLE_TIMELINE"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ArmchairIcon className="size-3.5" />
              <span>Masa Çizelgesi</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isPending}
            className="gap-1.5 font-bold text-xs rounded-xl"
          >
            <RefreshCwIcon className={cn("size-3.5", isPending && "animate-spin")} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>

          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="gap-2 font-black text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
          >
            <PlusIcon className="size-4" />
            <span>Yeni Rezervasyon</span>
          </Button>
        </div>
      </div>

      {/* 2. ZENGİN KPI METRİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bugün Toplam
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {stats.todayTotal}
            </span>
            <span className="text-[11px] text-slate-400 block font-medium">Kayıtlı Rezervasyon</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CalendarDaysIcon className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bekleyen / Onaylı
            </span>
            <span className="text-2xl font-black text-amber-600 font-mono">
              {stats.upcomingCount}
            </span>
            <span className="text-[11px] text-amber-700 block font-medium">Yaklaşan Misafir</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ClockIcon className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Masada / Oturan
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {stats.seatedCount}
            </span>
            <span className="text-[11px] text-emerald-700 block font-medium">Aktif Serviste</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2Icon className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Beklenen Misafir
            </span>
            <span className="text-2xl font-black text-blue-600 font-mono">
              {totalGuests}
            </span>
            <span className="text-[11px] text-blue-700 block font-medium">Kişi (Kapasite)</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UsersIcon className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between col-span-2 md:col-span-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Ön Siparişli
            </span>
            <span className="text-2xl font-black text-purple-600 font-mono">
              {preOrderCount}
            </span>
            <span className="text-[11px] text-purple-700 block font-medium">Yemeği Seçilmiş</span>
          </div>
          <div className="size-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShoppingBagIcon className="size-5" />
          </div>
        </div>
      </div>

      {/* 3. ANA İÇERİK BÖLÜMÜ */}
      {viewMode === "TABLE_TIMELINE" ? (
        /* MASA ÇİZELGESİ (TIMELINE / TABLE GRID) GÖRÜNÜMÜ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => {
            const tableReservations = reservations.filter(
              (r) => r.tableId === table.id && r.status !== "CANCELLED"
            );
            const hasUpcoming = tableReservations.some(
              (r) => r.status === "CONFIRMED" || r.status === "PENDING"
            );

            return (
              <div
                key={table.id}
                className={cn(
                  "p-4 rounded-3xl border bg-white shadow-2xs flex flex-col justify-between gap-3 transition-all",
                  hasUpcoming ? "border-amber-300 ring-1 ring-amber-500/20" : "border-slate-200"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="size-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm">
                        {table.label}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">Masa {table.label}</h4>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {table.seats || 2} Kişilik Kapasite
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-black",
                        hasUpcoming ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {tableReservations.length} Rezervasyon
                    </Badge>
                  </div>

                  {/* Bu Masadaki Rezervasyon Saatleri */}
                  <div className="space-y-1.5 min-h-[90px]">
                    {tableReservations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        Bu masa için aktif rezervasyon bulunmuyor
                      </p>
                    ) : (
                      tableReservations.map((tr) => {
                        const trTime = new Date(tr.reservationTime);
                        const timeStr = trTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                        const dateStr = trTime.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

                        return (
                          <div
                            key={tr.id}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-1"
                          >
                            <div>
                              <span className="font-black text-amber-900 block">
                                🕒 {dateStr} {timeStr}
                              </span>
                              <span className="text-[11px] text-slate-600 font-medium">
                                {tr.customerName} ({tr.guestCount} Kişi)
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded",
                                tr.status === "CONFIRMED" && "bg-amber-200 text-amber-900",
                                tr.status === "SEATED" && "bg-emerald-200 text-emerald-900"
                              )}
                            >
                              {tr.status === "CONFIRMED" ? "ONAYLI" : tr.status === "SEATED" ? "MASADA" : tr.status}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormTableId(table.id);
                    setIsNewModalOpen(true);
                  }}
                  className="w-full gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 cursor-pointer rounded-xl"
                >
                  <PlusIcon className="size-3.5" />
                  <span>Bu Masaya Rezerve Et</span>
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        /* KART IZGARASI VEYA KOMPAKT LİSTE */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Sekmeler ve Filtreler */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            {/* Sekmeler */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { key: "TODAY", label: "Bugün" },
                { key: "UPCOMING", label: "Bekleyen & Onaylı" },
                { key: "SEATED", label: "Masaya Oturanlar" },
                { key: "CANCELLED", label: "İptaller" },
                { key: "ALL", label: "Tümü" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as TabKey)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
                    activeTab === t.key
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Arama ve Masa / Tarih Filtreleri */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48 sm:w-56">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, telefon veya masa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500"
                />
              </div>

              {/* Masa Filtresi */}
              <select
                value={selectedTableFilter}
                onChange={(e) => setSelectedTableFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Masalar</option>
                {tables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    Masa {tbl.label} ({tbl.seats || 2} Kişilik)
                  </option>
                ))}
              </select>

              {/* Tarih Filtresi */}
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="py-1.5 px-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none"
              />

              {selectedDateFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter("")}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                  title="Tarih Filtresini Temizle"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Rezervasyon Kartları Bölümü */}
          <div className="p-4 sm:p-6 space-y-8">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <CalendarDaysIcon className="size-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">Filtreye uygun rezervasyon bulunamadı</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Arama kriterlerinizi değiştirebilir veya sağ üstteki &quot;Yeni Rezervasyon&quot; butonuna basarak yeni bir rezervasyon oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              categorizedGroups.map((group) => {
                const GroupIcon = group.icon;
                const groupGuests = group.items.reduce((s, it) => s + (it.guestCount || 1), 0);

                return (
                  <div key={group.id} className="space-y-4">
                    {/* Grup Başlığı */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("size-8 rounded-xl flex items-center justify-center font-bold border", group.color)}>
                          <GroupIcon className="size-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                            {group.title}
                            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0">
                              {group.items.length} Rezervasyon • {groupGuests} Misafir
                            </Badge>
                          </h2>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {group.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Kart Görünümü (GRID) */}
                    {viewMode === "GRID" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {group.items.map((res) => {
                          const resDate = new Date(res.reservationTime);
                          const timeStr = resDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                          const dateStr = resDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" });
                          const isSeated = res.status === "SEATED";
                          const isCancelled = res.status === "CANCELLED" || res.status === "NO_SHOW";
                          const isConfirmed = res.status === "CONFIRMED";
                          const isPendingStatus = res.status === "PENDING";

                          // Bağıl Zaman Hesabı
                          const nowMs = Date.now();
                          const resMs = resDate.getTime();
                          const diffMinutes = Math.round((resMs - nowMs) / 60000);
                          let timeDiffBadge = "";
                          let timeDiffClass = "bg-slate-100 text-slate-600";

                          if (isSeated) {
                            timeDiffBadge = "Masada Oturuyor";
                            timeDiffClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                          } else if (isCancelled) {
                            timeDiffBadge = "İptal Edildi";
                            timeDiffClass = "bg-slate-100 text-slate-500";
                          } else if (diffMinutes > 0 && diffMinutes <= 60) {
                            timeDiffBadge = `${diffMinutes} dakika sonra`;
                            timeDiffClass = "bg-amber-100 text-amber-900 border-amber-300 animate-pulse";
                          } else if (diffMinutes <= 0 && diffMinutes >= -45) {
                            timeDiffBadge = `${Math.abs(diffMinutes)} dk önce gelmeliydi`;
                            timeDiffClass = "bg-rose-100 text-rose-900 border-rose-300";
                          } else if (diffMinutes > 60 && diffMinutes <= 1440) {
                            const diffHours = Math.round(diffMinutes / 60);
                            timeDiffBadge = `${diffHours} saat sonra`;
                            timeDiffClass = "bg-blue-50 text-blue-800 border-blue-200";
                          } else {
                            timeDiffBadge = dateStr;
                            timeDiffClass = "bg-slate-100 text-slate-700";
                          }

                          return (
                            <div
                              key={res.id}
                              className={cn(
                                "rounded-3xl border bg-white p-4.5 transition-all shadow-xs flex flex-col justify-between gap-4 hover:shadow-md",
                                isSeated
                                  ? "border-emerald-200 bg-emerald-50/20"
                                  : isCancelled
                                    ? "border-slate-200 bg-slate-50/60 opacity-70"
                                    : isConfirmed
                                      ? "border-amber-200/90 hover:border-amber-400"
                                      : "border-slate-200 hover:border-slate-300"
                              )}
                            >
                              {/* 1. KART ÜSTÜ: Müşteri Adı & Masa & Durum */}
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                      {res.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-black text-base text-slate-900 truncate tracking-tight">
                                        {res.customerName}
                                      </h3>
                                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <a
                                          href={`tel:${res.customerPhone}`}
                                          className="hover:text-emerald-700 transition-colors flex items-center gap-1"
                                        >
                                          <PhoneIcon className="size-3 text-slate-400" />
                                          <span>{res.customerPhone}</span>
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Masa Rozeti */}
                                  <div className="shrink-0">
                                    {res.tableLabel ? (
                                      <div className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                                        <ArmchairIcon className="size-3.5 text-blue-600" />
                                        <span>Masa {res.tableLabel}</span>
                                      </div>
                                    ) : (
                                      <div className="px-2 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px] flex items-center gap-1">
                                        <span>Masa Atanmadı ⚠️</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 2. ZAMAN & DİJİTAL SAAT KUTUSU */}
                                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ClockIcon className="size-4 text-amber-600" />
                                    <div>
                                      <span className="text-sm font-black text-slate-900 font-mono tracking-tight block">
                                        {timeStr}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-semibold block">
                                        {dateStr}
                                      </span>
                                    </div>
                                  </div>

                                  <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border", timeDiffClass)}>
                                    {timeDiffBadge}
                                  </span>
                                </div>

                                {/* 3. MİSAFİR VE KANAL BİLGİSİ */}
                                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                                  <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl">
                                    <UsersIcon className="size-3.5 text-slate-500" />
                                    <span>{res.guestCount} Misafir</span>
                                  </span>

                                  {/* Rezervasyon Kaynağı */}
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1">
                                    {res.source === "PHONE" && "📞 Telefon / Netgsm"}
                                    {res.source === "POS" && "🖥️ Kasa (POS)"}
                                    {res.source === "ONLINE" && "🌐 Online Rezervasyon"}
                                    {res.source === "WALK_IN" && "🚶 Kapıdan"}
                                  </span>
                                </div>

                                {/* 4. ÖN SİPARİŞ KUTUSU */}
                                {res.preOrderItems && res.preOrderItems.length > 0 && (
                                  <div className="p-2.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex flex-col gap-1.5 text-xs">
                                    <div className="flex items-center justify-between font-black text-purple-900 text-[11px]">
                                      <span className="flex items-center gap-1">
                                        <ShoppingBagIcon className="size-3.5 text-purple-600" />
                                        Ön Sipariş ({res.preOrderItems.length} Kalem):
                                      </span>
                                      <span className="font-mono">
                                        {res.preOrderItems
                                          .reduce((sum, it) => sum + it.price * it.quantity, 0)
                                          .toFixed(2)}{" "}
                                        ₺
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {res.preOrderItems.map((it, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 bg-white border border-purple-200 px-2 py-0.5 rounded-lg text-[10px] font-bold text-purple-950 shadow-2xs"
                                        >
                                          <span className="text-amber-600 font-extrabold">{it.quantity}x</span>
                                          <span>{it.name}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 5. ÖZEL İSTEK / NOT KUTUSU */}
                                {res.notes && (
                                  <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs font-medium flex items-start gap-1.5">
                                    <span className="font-black text-amber-900 shrink-0">Not:</span>
                                    <span className="line-clamp-2">{res.notes}</span>
                                  </div>
                                )}
                              </div>

                              {/* 6. KART ALTI HIZLI AKSİYONLAR */}
                              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                {/* Hızlı Masa Değiştirme / Seçimi */}
                                {!isSeated && !isCancelled && (
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-[11px] font-bold text-slate-500">Masa:</span>
                                    <select
                                      value={res.tableId || ""}
                                      onChange={(e) => handleAssignTable(res.id, e.target.value)}
                                      disabled={isPending}
                                      className="text-xs font-bold py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer hover:border-slate-300"
                                    >
                                      <option value="">-- Masa Seçilmedi --</option>
                                      {tables.map((tbl) => (
                                        <option key={tbl.id} value={tbl.id}>
                                          Masa {tbl.label} ({tbl.seats || 2} Kş)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2">
                                  {/* Sol Butonlar: WhatsApp & İptal */}
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openWhatsAppReminder(res)}
                                      className="size-8 p-0 rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer shadow-2xs"
                                      title="WhatsApp Hatırlatması Gönder"
                                    >
                                      <MessageCircleIcon className="size-4" />
                                    </Button>

                                    {!isCancelled && !isSeated && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCancel(res.id)}
                                        disabled={isPending}
                                        className="size-8 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                        title="Rezervasyonu İptal Et"
                                      >
                                        <XIcon className="size-4" />
                                      </Button>
                                    )}
                                  </div>

                                  {/* Sağ Ana Buton: Masaya Oturt veya Onayla */}
                                  <div className="flex items-center gap-1.5">
                                    {isPendingStatus && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                                        disabled={isPending}
                                        className="text-xs font-bold border-amber-300 text-amber-800 rounded-xl"
                                      >
                                        Onayla
                                      </Button>
                                    )}

                                    {!isSeated && !isCancelled && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleSeat(res)}
                                        disabled={isPending}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer px-3.5"
                                      >
                                        <CheckCircle2Icon className="size-3.5" />
                                        <span>Masaya Oturt & Aç</span>
                                      </Button>
                                    )}

                                    {isSeated && (
                                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center gap-1">
                                        <CheckCircle2Icon className="size-3.5" />
                                        Serviste
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* KOMPAKT LİSTE GÖRÜNÜMÜ */
                      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                        {group.items.map((res) => {
                          const resDate = new Date(res.reservationTime);
                          const timeStr = resDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                          const dateStr = resDate.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                          const isSeated = res.status === "SEATED";
                          const isCancelled = res.status === "CANCELLED" || res.status === "NO_SHOW";

                          return (
                            <div
                              key={res.id}
                              className={cn(
                                "p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors",
                                isSeated && "bg-emerald-50/20",
                                isCancelled && "bg-slate-50/50 opacity-70"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-black text-sm shrink-0">
                                  {timeStr}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-sm text-slate-900">
                                      {res.customerName}
                                    </span>
                                    <span className="text-xs text-slate-500 font-semibold">
                                      ({res.guestCount} Kişi)
                                    </span>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                      {res.tableLabel ? `Masa ${res.tableLabel}` : "Masa Atanmadı"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-0.5">
                                    <span>{dateStr}</span>
                                    <span>{res.customerPhone}</span>
                                    {res.notes && <span className="text-amber-700 italic">Not: {res.notes}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {!isSeated && !isCancelled && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSeat(res)}
                                    disabled={isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl h-8 px-3"
                                  >
                                    <CheckCircle2Icon className="size-3.5" />
                                    <span>Oturt</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openWhatsAppReminder(res)}
                                  className="size-8 p-0 rounded-xl text-emerald-600"
                                >
                                  <MessageCircleIcon className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. YENİ REZERVASYON EKLEME MODALI */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <CalendarDaysIcon className="size-5 text-amber-600" />
              Yeni Masa Rezervasyonu Oluştur
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Müşteri bilgilerini, masa tercihini ve rezervasyon saatini giriniz.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewReservation} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Müşteri Adı Soyadı *</Label>
                <Input
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Telefon Numarası *</Label>
                <Input
                  required
                  placeholder="0532..."
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Rezervasyon Tarihi *</Label>
                <Input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Rezervasyon Saati *</Label>
                <Input
                  type="time"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Masa Seçimi</Label>
                <select
                  value={formTableId}
                  onChange={(e) => setFormTableId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none cursor-pointer"
                >
                  <option value="">Otomatik / Atanmadı</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Masa {t.label} ({t.seats || 2} Kişilik)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kişi Sayısı</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formGuestCount}
                  onChange={(e) => setFormGuestCount(Number(e.target.value))}
                  className="text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Rezervasyon Kaynağı</Label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value as typeof formSource)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none cursor-pointer"
                >
                  <option value="PHONE">📞 Telefonla Arama</option>
                  <option value="POS">🖥️ Kasadan Alındı</option>
                  <option value="ONLINE">🌐 Online Rezervasyon</option>
                  <option value="WALK_IN">🚶 Kapıdan Misafir</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">E-posta (Opsiyonel)</Label>
                <Input
                  type="email"
                  placeholder="musteri@mail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Özel İstek / Müşteri Notu</Label>
              <Textarea
                placeholder="Örn: Bebek sandalyesi istendi, cam kenarı tercih ediliyor..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="text-xs resize-none rounded-xl"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewModalOpen(false)}
                className="text-xs font-bold rounded-xl"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="text-xs font-black bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs rounded-xl"
              >
                <CalendarDaysIcon className="size-4" />
                <span>Rezervasyonu Kaydet</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
