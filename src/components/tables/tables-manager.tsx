"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArmchairIcon,
  CheckCircle2Icon,
  Edit3Icon,
  ExternalLinkIcon,
  LayersIcon,
  PlusIcon,
  PrinterIcon,
  QrCodeIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { deleteTableAction } from "@/actions/table.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableDialog } from "./table-dialog";
import { TableShareDialog } from "./table-share-dialog";

export function TablesManager({
  tables,
  username,
  selfOrderEnabled,
}: {
  readonly tables: TableDTO[];
  readonly username: string;
  readonly selfOrderEnabled: boolean;
}) {
  const router = useRouter();

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TableDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableDTO | null>(null);
  const [shareTarget, setShareTarget] = useState<TableDTO | null>(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [batchQrMap, setBatchQrMap] = useState<Record<string, string>>({});

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const del = useServerAction(deleteTableAction, {
    refresh: true,
    onSuccess: () => {
      toast.success("Masa başarıyla kaldırıldı");
      setDeleteTarget(null);
    },
    onError: (message) => toast.error(message),
  });

  const openNew = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (table: TableDTO) => {
    setEditTarget(table);
    setDialogOpen(true);
  };

  // Sections list & counts
  const { sections, totalSeats, activeCount } = useMemo(() => {
    const map = new Map<string, number>();
    let seats = 0;
    let active = 0;

    for (const t of tables) {
      const sec = t.section?.trim() || "Genel Salon";
      map.set(sec, (map.get(sec) || 0) + 1);
      if (t.seats) seats += t.seats;
      if (t.isActive) active += 1;
    }

    return {
      sections: Array.from(map.entries()).map(([name, count]) => ({ name, count })),
      totalSeats: seats,
      activeCount: active,
    };
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tables.filter((t) => {
      const secName = (t.section?.trim() || "Genel Salon").toLowerCase();
      const labelMatch = t.label.toLowerCase().includes(q) || secName.includes(q);
      if (!labelMatch) return false;

      if (selectedSection !== "all") {
        const sec = t.section?.trim() || "Genel Salon";
        if (sec !== selectedSection) return false;
      }

      if (statusFilter === "active" && !t.isActive) return false;
      if (statusFilter === "inactive" && t.isActive) return false;

      return true;
    });
  }, [tables, searchQuery, selectedSection, statusFilter]);

  // Group filtered tables by section
  const groupedSections = useMemo(() => {
    const map = new Map<string, TableDTO[]>();
    for (const t of filteredTables) {
      const sec = t.section?.trim() || "Genel Salon";
      const list = map.get(sec) || [];
      list.push(t);
      map.set(sec, list);
    }
    return Array.from(map.entries());
  }, [filteredTables]);

  // Generate QR codes for all tables for batch printing
  const handleOpenBatchPrint = async () => {
    setIsBatchPrintOpen(true);
    if (typeof window === "undefined") return;
    const origin = window.location.origin;

    const qrMap: Record<string, string> = {};
    for (const t of tables) {
      try {
        const link = `${origin}/order/${username}?table=${t.id}`;
        const url = await QRCode.toDataURL(link, { width: 512, margin: 2 });
        qrMap[t.id] = url;
      } catch {
        // ignore
      }
    }
    setBatchQrMap(qrMap);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto p-3 sm:p-5 lg:p-7 flex flex-col gap-5 sm:gap-6 text-gray-900">
      {/* WORLD-CLASS MOTION DESIGN KEYFRAMES */}
      <style jsx global>{`
        @keyframes sleekFadeIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .anim-sleek {
          animation: sleekFadeIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #print-batch-qr-area, #print-batch-qr-area * {
            visibility: visible;
          }
          #print-batch-qr-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* 
        1. ÜST BAŞLIK ALANI (PRO STUDIO HEADER)
      */}
      <header className="anim-sleek flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white shadow-xs">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ArmchairIcon className="size-4.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Kat Planı & Masa Yönetimi
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-gray-900 mt-1">
            Masalar & QR Sipariş Kodları
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 max-w-2xl">
            Salon düzeninizi yapılandırın, masaları bölümlere ayırın ve her masaya özel temassız
            QR menü sipariş kartlarını yönetin.
          </p>
        </div>

        {/* Eylemler */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleOpenBatchPrint}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 text-xs sm:text-sm font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
            title="Tüm masaların QR kodlarını toplu yazdırın"
          >
            <PrinterIcon className="size-4 text-gray-600" />
            <span>Toplu QR Yazdır</span>
          </button>

          {username && (
            <Link
              href={`/order/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 active:scale-95 text-xs sm:text-sm font-bold text-blue-700 transition-all cursor-pointer shadow-2xs"
              title="Canlı QR menüyü yeni sekmede test edin"
            >
              <ExternalLinkIcon className="size-4" />
              <span className="hidden sm:inline">Canlı QR Menü</span>
            </Link>
          )}

          <Button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Yeni Masa Ekle</span>
          </Button>
        </div>
      </header>

      {/* 
        2. OPERASYONEL METRİKLER (4 KART PANELİ)
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Kart 1: Toplam Masa */}
        <div
          className="anim-sleek p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white shadow-xs flex items-center justify-between"
          style={{ animationDelay: "30ms" }}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Toplam Masa
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-1 tabular-nums">
              {tables.length}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 mt-0.5">
              {sections.length} farklı bölümde
            </span>
          </div>
          <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <ArmchairIcon className="size-6" />
          </div>
        </div>

        {/* Kart 2: Aktif Servis */}
        <div
          className="anim-sleek p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white shadow-xs flex items-center justify-between"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Aktif Masalar
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 mt-1 tabular-nums">
              {activeCount}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 mt-0.5">
              {tables.length > 0
                ? `%${Math.round((activeCount / tables.length) * 100)} faal durumda`
                : "Hazır"}
            </span>
          </div>
          <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2Icon className="size-6" />
          </div>
        </div>

        {/* Kart 3: Oturum Kapasitesi */}
        <div
          className="anim-sleek p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white shadow-xs flex items-center justify-between"
          style={{ animationDelay: "90ms" }}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Oturum Kapasitesi
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-purple-600 mt-1 tabular-nums">
              {totalSeats}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 mt-0.5">
              Kişilik toplam oturum
            </span>
          </div>
          <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
            <UsersIcon className="size-6" />
          </div>
        </div>

        {/* Kart 4: QR Sipariş Durumu */}
        <div
          className="anim-sleek p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white shadow-xs flex items-center justify-between"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Müşteri QR Siparişi
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  selfOrderEnabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                )}
              />
              <span
                className={cn(
                  "text-sm sm:text-base font-black tracking-tight",
                  selfOrderEnabled ? "text-emerald-700" : "text-amber-700"
                )}
              >
                {selfOrderEnabled ? "Sipariş Açık" : "Sadece Menü"}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 mt-0.5">
              {selfOrderEnabled ? "Masadan sipariş aktif" : "Ayarlardan açılabilir"}
            </span>
          </div>
          <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <QrCodeIcon className="size-6" />
          </div>
        </div>
      </div>

      {/* 
        3. ARAMA VE BÖLÜM FİLTRELEME ÇUBUĞU (INTERACTIVE TOOLBAR)
      */}
      <div
        className="anim-sleek flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white shadow-xs"
        style={{ animationDelay: "150ms" }}
      >
        {/* Sol: Bölüm Butonları (Pill Tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedSection("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 select-none",
              selectedSection === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            )}
          >
            Tümü ({tables.length})
          </button>

          {sections.map((sec) => (
            <button
              key={sec.name}
              type="button"
              onClick={() => setSelectedSection(sec.name)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 select-none",
                selectedSection === sec.name
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              )}
            >
              {sec.name} ({sec.count})
            </button>
          ))}
        </div>

        {/* Sağ: Canlı Arama Inputu + Durum Filtresi */}
        <div className="flex items-center gap-2">
          {/* Arama Inputu */}
          <div className="relative flex-1 md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masa adı veya bölüm ara…"
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Durum Filtresi (Tümü / Aktif / Pasif) */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Yalnızca Aktif</option>
            <option value="inactive">Yalnızca Pasif</option>
          </select>
        </div>
      </div>

      {/* 
        4. MASA KARTLARI LİSTESİ (BÖLÜMLERE GÖRE KATEGORİZE VE GELİŞMİŞ TASARIM)
      */}
      {filteredTables.length === 0 ? (
        <div className="anim-sleek p-8 sm:p-12 text-center rounded-3xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 border border-gray-200">
            <ArmchairIcon className="size-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-gray-900">Eşleşen Masa Bulunamadı</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md">
            Arama kriterlerinize veya seçilen filtreye uygun masa bulunmuyor. Arama filtresini
            temizleyin veya yeni bir masa tanımlayın.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedSection("all");
                setStatusFilter("all");
              }}
              className="text-xs rounded-xl"
            >
              Filtreleri Temizle
            </Button>
            <Button size="sm" onClick={openNew} className="text-xs rounded-xl gap-1.5">
              <PlusIcon className="size-3.5" />
              <span>Yeni Masa Ekle</span>
            </Button>
          </div>
        </div>
      ) : (
        groupedSections.map(([sectionName, rows], sectionIndex) => (
          <section
            key={sectionName}
            className="anim-sleek flex flex-col gap-3.5"
            style={{ animationDelay: `${sectionIndex * 45 + 180}ms` }}
          >
            {/* Bölüm Başlığı & Masa Sayısı Rozeti */}
            <div className="flex items-center justify-between pb-1 border-b border-gray-200/80">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-black">
                  <LayersIcon className="size-3" />
                </div>
                <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                  {sectionName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-600 border border-gray-200">
                  {rows.length} Masa
                </span>
              </div>

              <span className="text-xs font-medium text-gray-400">
                Kapasite: {rows.reduce((s, t) => s + (t.seats || 0), 0)} Kişi
              </span>
            </div>

            {/* Bölümdeki Masaların Grid Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5">
              {rows.map((table, tableIndex) => (
                <div
                  key={table.id}
                  className={cn(
                    "anim-sleek group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl",
                    "border border-gray-200/90 bg-white shadow-xs transition-all duration-200",
                    "hover:shadow-lg hover:border-blue-200 hover:-translate-y-1",
                    !table.isActive && "opacity-75 bg-gray-50/50"
                  )}
                  style={{
                    animationDelay: `${tableIndex * 25 + 200}ms`,
                  }}
                >
                  {/* Kart Üstü: Masa Numarası Squircle + Aktif/Pasif Rozeti */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ArmchairIcon className="size-5" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight group-hover:text-primary transition-colors">
                          {table.label}
                        </h3>
                        <span className="text-[11px] font-semibold text-gray-500">
                          {sectionName}
                        </span>
                      </div>
                    </div>

                    {/* Durum Rozeti */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border",
                        table.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          table.isActive ? "bg-emerald-500" : "bg-gray-400"
                        )}
                      />
                      {table.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>

                  {/* Kart Ortası: Kapasite ve QR Önizleme Alanı */}
                  <div className="my-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200/80">
                      <UsersIcon className="size-3.5 text-gray-500" />
                      <span>{table.seats ? `${table.seats} Kişilik` : "Kapasite Belirtilmedi"}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShareTarget(table)}
                      className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/90 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                      title="Masa QR Kodunu Gör"
                    >
                      <QrCodeIcon className="size-3.5" />
                      <span>QR Gör</span>
                    </button>
                  </div>

                  {/* Kart Altı: Aksiyon Butonları (Paylaş, Düzenle, Sil) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 px-1.5 text-xs font-bold rounded-xl border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors gap-1 cursor-pointer"
                      onClick={() => setShareTarget(table)}
                      title="QR Kodunu İndir veya Paylaş"
                    >
                      <QrCodeIcon className="size-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Paylaş</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 px-1.5 text-xs font-bold rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors gap-1 cursor-pointer"
                      onClick={() => openEdit(table)}
                      title="Masayı Düzenle"
                    >
                      <Edit3Icon className="size-3.5 text-gray-600 shrink-0" />
                      <span className="truncate">Düzenle</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 px-1.5 text-xs font-bold rounded-xl border-gray-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors gap-1 cursor-pointer"
                      onClick={() => setDeleteTarget(table)}
                      title="Masayı Kaldır"
                    >
                      <Trash2Icon className="size-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">Sil</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* MASA EKLE / DÜZENLE MODAL */}
      {dialogOpen ? (
        <TableDialog
          table={editTarget}
          onOpenChange={setDialogOpen}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {/* TEKİL MASA QR PAYLAŞ MODAL */}
      {shareTarget ? (
        <TableShareDialog
          table={shareTarget}
          username={username}
          selfOrderEnabled={selfOrderEnabled}
          onOpenChange={(open) => !open && setShareTarget(null)}
        />
      ) : null}

      {/* MASA SİLME ONAY MODAL */}
      {deleteTarget ? (
        <Dialog open onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-2">
                <Trash2Icon className="size-5.5" />
              </div>
              <DialogTitle className="text-lg font-black text-gray-900">
                {deleteTarget.label} Masasını Kaldır
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-500">
                Bu masayı kaldırmak istediğinizden emin misiniz? Geçmiş sipariş kayıtları korunur,
                fakat açık olan adisyon varsa garson ekranından düşebilir.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setDeleteTarget(null)}
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl font-bold"
                disabled={del.isPending}
                onClick={() => del.execute({ id: deleteTarget.id })}
              >
                {del.isPending ? "Kaldırılıyor…" : "Evet, Masayı Kaldır"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* TOPLU QR YAZDIRMA MODAL (PRINT READY BATCH MODAL) */}
      <Dialog open={isBatchPrintOpen} onOpenChange={setIsBatchPrintOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl p-5 sm:p-7">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <PrinterIcon className="size-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black text-gray-900">
                    Tüm Masa QR Kartları (Yazdırılabilir)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Restoranınızdaki tüm masaların QR kartlarını tek sayfada görüntüleyin ve yazdırın.
                  </DialogDescription>
                </div>
              </div>

              <Button
                onClick={() => window.print()}
                className="gap-1.5 rounded-xl font-bold text-xs"
              >
                <PrinterIcon className="size-3.5" />
                <span>Yazdır (Print)</span>
              </Button>
            </div>
          </DialogHeader>

          <div id="print-batch-qr-area" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4">
            {tables.map((t) => {
              const qrUrl = batchQrMap[t.id];
              return (
                <div
                  key={t.id}
                  className="flex flex-col items-center justify-between p-3.5 rounded-2xl border-2 border-gray-200 bg-white text-center shadow-xs"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      {t.section || "Salon"}
                    </span>
                    <h4 className="text-base font-black text-gray-900 mt-0.5">{t.label}</h4>
                  </div>

                  <div className="my-2 p-1.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
                    {qrUrl ? (
                      <Image
                        src={qrUrl}
                        alt={`${t.label} QR`}
                        width={130}
                        height={130}
                        unoptimized
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="size-[130px] bg-gray-100 animate-pulse rounded-lg" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-gray-500">
                    📱 Menü & Sipariş İçin Okutunuz
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
