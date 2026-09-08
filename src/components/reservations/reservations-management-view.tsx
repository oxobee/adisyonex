"use client";

import { useState, useTransition } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
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
  AlertCircleIcon,
  SparklesIcon,
  FilterIcon,
  GlobeIcon,
  StoreIcon,
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

export function ReservationsManagementView({
  initialReservations,
  initialStats,
  tables,
}: ReservationsManagementViewProps) {
  const [reservations, setReservations] = useState<readonly ReservationDTO[]>(initialReservations);
  const [stats, setStats] = useState<ReservationStatsDTO>(initialStats);
  const [activeTab, setActiveTab] = useState<"TODAY" | "UPCOMING" | "SEATED" | "CANCELLED" | "ALL">("TODAY");
  const [viewMode, setViewMode] = useState<"LIST" | "TABLE_TIMELINE">("LIST");
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
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
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
      toast.success(`✓ ${res.customerName} masaya oturtuldu ve sipariş açıldı!`);
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

      toast.success(`✓ ${res.data.customerName} için rezervasyon oluşturuldu!`);
      setIsNewModalOpen(false);
      // Reset form
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
  const filteredReservations = reservations.filter((r) => {
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

  return (
    <div className="space-y-6">
      {/* 1. ÜST BAŞLIK VE EYLEM BUTONLARI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shadow-xs">
            <CalendarDaysIcon className="size-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Masa Rezervasyonları
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                Caller ID & Online Hazır
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Telefonla arayan, kasadan alınan ve ilerideki online masa rezervasyonlarının merkezi yönetimi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Görünüm Değiştirici */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ListFilterIcon className="size-3.5" />
              <span>Liste</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE_TIMELINE")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "TABLE_TIMELINE"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutGridIcon className="size-3.5" />
              <span>Masa Çizelgesi</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isPending}
            className="gap-1.5 font-bold text-xs"
          >
            <RefreshCwIcon className={cn("size-3.5", isPending && "animate-spin")} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>

          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="gap-2 font-black text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <PlusIcon className="size-4" />
            <span>Yeni Rezervasyon</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI METRİK KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Bugün Toplam
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {stats.todayTotal}
            </span>
            <span className="text-[11px] text-slate-400 block">Kayıtlı Rezervasyon</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CalendarDaysIcon className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Bekleyen / Onaylı
            </span>
            <span className="text-2xl font-black text-amber-600 font-mono">
              {stats.upcomingCount}
            </span>
            <span className="text-[11px] text-amber-700 block">Yaklaşan Misafir</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ClockIcon className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Masada / Oturan
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {stats.seatedCount}
            </span>
            <span className="text-[11px] text-emerald-700 block">Aktif Serviste</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2Icon className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              İptal / Gelmedi
            </span>
            <span className="text-2xl font-black text-rose-600 font-mono">
              {stats.cancelledCount}
            </span>
            <span className="text-[11px] text-rose-700 block">İptal Edilenler</span>
          </div>
          <div className="size-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UserXIcon className="size-5" />
          </div>
        </div>
      </div>

      {/* 3. LİSTE GÖRÜNÜMÜ VEYA MASA ÇİZELGESİ */}
      {viewMode === "LIST" ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Sekmeler ve Filtreler */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
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
                  onClick={() => setActiveTab(t.key as typeof activeTab)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
                    activeTab === t.key
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
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
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                  title="Tarih Filtresini Temizle"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Rezervasyon Kartları Listesi */}
          <div className="p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <CalendarDaysIcon className="size-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">Filtreye uygun rezervasyon bulunamadı</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Arama kriterlerinizi değiştirebilir veya sağ üstteki &quot;Yeni Rezervasyon&quot; butonuna basarak yeni bir kayıt açabilirsiniz.
                </p>
              </div>
            ) : (
              filteredReservations.map((res) => {
                const resDate = new Date(res.reservationTime);
                const timeStr = resDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                const dateStr = resDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" });
                const isSeated = res.status === "SEATED";
                const isCancelled = res.status === "CANCELLED" || res.status === "NO_SHOW";

                return (
                  <div
                    key={res.id}
                    className={cn(
                      "pt-3 first:pt-0 p-3.5 rounded-2xl border transition-all flex flex-col gap-3",
                      isSeated
                        ? "bg-emerald-50/30 border-emerald-200"
                        : isCancelled
                          ? "bg-slate-50/80 border-slate-200 opacity-65"
                          : "bg-white border-slate-200/90 shadow-2xs hover:border-amber-300"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Sol: Müşteri & Masa & Saat */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-base text-slate-900">
                            {res.customerName}
                          </span>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-black px-2 py-0.5",
                              res.status === "CONFIRMED" && "bg-amber-100 text-amber-900 border-amber-300",
                              res.status === "SEATED" && "bg-emerald-100 text-emerald-900 border-emerald-300",
                              res.status === "CANCELLED" && "bg-rose-100 text-rose-900 border-rose-300",
                              res.status === "NO_SHOW" && "bg-slate-200 text-slate-700 border-slate-300"
                            )}
                          >
                            {res.status === "CONFIRMED"
                              ? "ONAYLANDI"
                              : res.status === "SEATED"
                                ? "MASADA"
                                : res.status === "CANCELLED"
                                  ? "İPTAL EDİLDİ"
                                  : res.status === "NO_SHOW"
                                    ? "GELMEDİ"
                                    : "BEKLEMEDE"}
                          </Badge>

                          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                            {res.source === "PHONE" && "📞 Telefon / Netgsm"}
                            {res.source === "POS" && "🖥️ Kasa (POS)"}
                            {res.source === "ONLINE" && "🌐 Online Web Rezervasyon"}
                            {res.source === "WALK_IN" && "🚶 Kapıdan"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1.5 font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                            <ClockIcon className="size-3.5 text-amber-600" />
                            {dateStr} • {timeStr}
                          </span>

                          <span className="flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-2 py-1 rounded-lg">
                            <UserIcon className="size-3.5 text-slate-500" />
                            {res.guestCount} Kişi
                          </span>

                          <span className="flex items-center gap-1 text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/70">
                            <ArmchairIcon className="size-3.5 text-blue-600" />
                            {res.tableLabel ? `Masa ${res.tableLabel}` : "Masa atanmadı"}
                          </span>

                          <a
                            href={`tel:${res.customerPhone}`}
                            className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition-colors"
                          >
                            <PhoneIcon className="size-3.5 text-slate-400" />
                            <span>{res.customerPhone}</span>
                          </a>
                        </div>
                      </div>

                      {/* Sağ: Aksiyon Butonları */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isSeated && !isCancelled && (
                          <Button
                            size="sm"
                            onClick={() => handleSeat(res)}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                          >
                            <CheckCircle2Icon className="size-3.5" />
                            <span>Masaya Oturt & Aç</span>
                          </Button>
                        )}

                        {res.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                            disabled={isPending}
                            className="text-xs font-bold border-amber-300 text-amber-800"
                          >
                            Onayla
                          </Button>
                        )}

                        {!isCancelled && !isSeated && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(res.id, "NO_SHOW")}
                            disabled={isPending}
                            className="text-xs text-slate-500 hover:text-slate-800"
                            title="Müşteri Gelmedi Olarak İşaretle"
                          >
                            Gelmedi
                          </Button>
                        )}

                        {!isCancelled && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancel(res.id)}
                            disabled={isPending}
                            className="text-xs text-slate-400 hover:text-rose-600"
                            title="İptal Et"
                          >
                            <XIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Not ve Ön Sipariş Kalemleri */}
                    {(res.notes || (res.preOrderItems && res.preOrderItems.length > 0)) && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                        {res.notes && (
                          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 font-medium flex items-center gap-1.5">
                            <span className="font-bold text-amber-950">Özel İstek / Not:</span>
                            <span>{res.notes}</span>
                          </div>
                        )}

                        {res.preOrderItems && res.preOrderItems.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between font-bold text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <ShoppingBagIcon className="size-3.5 text-primary" />
                                Önceden Sipariş Edilen Menü Kalemleri ({res.preOrderItems.length} Kalem):
                              </span>
                              <span className="text-primary font-mono">
                                Toplam:{" "}
                                {res.preOrderItems
                                  .reduce((sum, it) => sum + it.price * it.quantity, 0)
                                  .toFixed(2)}{" "}
                                ₺
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {res.preOrderItems.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                                >
                                  <span className="font-bold text-amber-700">{it.quantity}x</span>
                                  <span>{it.name}</span>
                                  <span className="text-slate-400 font-mono font-normal">
                                    ({(it.price * it.quantity).toFixed(2)}₺)
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
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
                              {tr.status}
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
                  className="w-full gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <PlusIcon className="size-3.5" />
                  <span>Bu Masaya Rezerve Et</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. YENİ REZERVASYON EKLEME MODALI */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                  className="text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Telefon Numarası *</Label>
                <Input
                  required
                  placeholder="0532..."
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="text-xs font-bold"
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
                  className="text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Rezervasyon Saati *</Label>
                <Input
                  type="time"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="text-xs font-bold"
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
                  className="text-xs font-bold"
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
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Özel İstek / Müşteri Notu</Label>
              <Textarea
                placeholder="Örn: Bebek sandalyesi istendi, cam kenarı tercih ediliyor..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewModalOpen(false)}
                className="text-xs font-bold"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="text-xs font-black bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs"
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
