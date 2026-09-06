"use client";

import { useMemo, useState } from "react";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileImageIcon,
  HelpCircleIcon,
  InboxIcon,
  LaptopIcon,
  LightbulbIcon,
  MapPinIcon,
  MessageSquareQuoteIcon,
  PhoneIcon,
  RocketIcon,
  SearchIcon,
  StoreIcon,
  Trash2Icon,
  UserIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteFeedbackAction,
  updateFeedbackStatusAction,
  type FeedbackDTO,
} from "@/actions/feedback.actions";

interface AdminFeedbackViewProps {
  readonly initialFeedbacks: FeedbackDTO[];
}

export function AdminFeedbackView({ initialFeedbacks }: AdminFeedbackViewProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackDTO[]>(initialFeedbacks);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackDTO | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState("");

  // Statistics
  const stats = useMemo(() => {
    return {
      total: feedbacks.length,
      suggestion: feedbacks.filter((f) => f.category === "SUGGESTION").length,
      request: feedbacks.filter((f) => f.category === "REQUEST").length,
      complaint: feedbacks.filter((f) => f.category === "COMPLAINT").length,
      bug: feedbacks.filter((f) => f.category === "BUG").length,
      pending: feedbacks.filter((f) => f.status === "PENDING").length,
    };
  }, [feedbacks]);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (categoryFilter !== "ALL" && f.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          f.title.toLowerCase().includes(q) ||
          f.message.toLowerCase().includes(q) ||
          f.restaurantName.toLowerCase().includes(q) ||
          (f.userName && f.userName.toLowerCase().includes(q)) ||
          (f.userPhone && f.userPhone.includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [feedbacks, categoryFilter, statusFilter, search]);

  const handleOpenDetail = (f: FeedbackDTO) => {
    setSelectedFeedback(f);
    setAdminNoteInput(f.adminNote || "");
  };

  const handleUpdateStatus = async (
    newStatus: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED",
  ) => {
    if (!selectedFeedback) return;
    setIsUpdating(true);
    try {
      const res = await updateFeedbackStatusAction({
        feedbackId: selectedFeedback.id,
        status: newStatus,
        adminNote: adminNoteInput.trim() || undefined,
      });

      if (res.success) {
        setFeedbacks((prev) =>
          prev.map((item) =>
            item.id === selectedFeedback.id
              ? { ...item, status: newStatus, adminNote: adminNoteInput.trim() || null }
              : item,
          ),
        );
        setSelectedFeedback((prev) =>
          prev ? { ...prev, status: newStatus, adminNote: adminNoteInput.trim() || null } : null,
        );
        toast.success("Durum başarıyla güncellendi");
      } else {
        toast.error(res.error || "Güncelleme yapılamadı");
      }
    } catch {
      toast.error("İşlem sırasında hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu geri bildirimi kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const res = await deleteFeedbackAction(id);
      if (res.success) {
        setFeedbacks((prev) => prev.filter((item) => item.id !== id));
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback(null);
        }
        toast.success("Geri bildirim silindi");
      } else {
        toast.error(res.error || "Silinemedi");
      }
    } catch {
      toast.error("Silme işleminde hata oluştu");
    }
  };

  const getCategoryConfig = (category: FeedbackDTO["category"]) => {
    switch (category) {
      case "SUGGESTION":
        return {
          label: "Öneri",
          icon: LightbulbIcon,
          cardClass:
            "border-blue-200/90 bg-gradient-to-br from-blue-50/50 via-white to-sky-50/30 hover:border-blue-300",
          badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
          iconBg: "bg-blue-500 text-white",
        };
      case "REQUEST":
        return {
          label: "İstek",
          icon: RocketIcon,
          cardClass:
            "border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 hover:border-amber-300",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
          iconBg: "bg-amber-500 text-white",
        };
      case "COMPLAINT":
        return {
          label: "Şikayet",
          icon: AlertCircleIcon,
          cardClass:
            "border-rose-200/90 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 hover:border-rose-300",
          badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
          iconBg: "bg-rose-500 text-white",
        };
      case "BUG":
        return {
          label: "Hata Bildirimi",
          icon: HelpCircleIcon,
          cardClass:
            "border-red-300 bg-gradient-to-br from-red-50/70 via-white to-rose-50/40 hover:border-red-400",
          badgeClass: "bg-red-100 text-red-800 border-red-300",
          iconBg: "bg-red-600 text-white",
        };
    }
  };

  const getStatusConfig = (status: FeedbackDTO["status"]) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Yeni / Beklemede",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "REVIEWING":
        return {
          label: "İnceleniyor",
          className: "bg-indigo-100 text-indigo-800 border-indigo-200",
        };
      case "RESOLVED":
        return {
          label: "Çözüldü / Tamamlandı",
          className: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      case "REJECTED":
        return {
          label: "Reddedildi",
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK VE İSTATİSTİK KARTLARI */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Geri Bildirimler
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
              {stats.total} Bildirim
            </span>
            {stats.pending > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                {stats.pending} Yeni
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Restoran yöneticileri ve personelleri tarafından iletilen öneri, istek, şikayet ve hata raporları
          </p>
        </div>
      </div>

      {/* İSTATİSTİK SAYACI KARTLARI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* ÖNERİ */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "SUGGESTION" ? "ALL" : "SUGGESTION")}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs",
            categoryFilter === "SUGGESTION"
              ? "border-blue-600 bg-blue-50/70"
              : "border-blue-200 bg-white hover:bg-blue-50/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
              💡 Öneriler
            </span>
            <span className="size-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">{stats.suggestion}</div>
        </div>

        {/* İSTEK */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "REQUEST" ? "ALL" : "REQUEST")}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs",
            categoryFilter === "REQUEST"
              ? "border-amber-600 bg-amber-50/70"
              : "border-amber-200 bg-white hover:bg-amber-50/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
              🚀 İstekler
            </span>
            <span className="size-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{stats.request}</div>
        </div>

        {/* ŞİKAYET */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "COMPLAINT" ? "ALL" : "COMPLAINT")}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs",
            categoryFilter === "COMPLAINT"
              ? "border-rose-600 bg-rose-50/70"
              : "border-rose-200 bg-white hover:bg-rose-50/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-700 uppercase tracking-wider">
              ⚠️ Şikayetler
            </span>
            <span className="size-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-2">{stats.complaint}</div>
        </div>

        {/* HATA */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "BUG" ? "ALL" : "BUG")}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs",
            categoryFilter === "BUG"
              ? "border-red-600 bg-red-50/70"
              : "border-red-200 bg-white hover:bg-red-50/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-700 uppercase tracking-wider">
              🐞 Hatalar
            </span>
            <span className="size-2 rounded-full bg-red-500" />
          </div>
          <div className="text-2xl font-black text-red-900 mt-2">{stats.bug}</div>
        </div>
      </div>

      {/* FİLTRE VE ARAMA ÇUBUĞU */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
        {/* Arama */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başlık, içerik, restoran veya kullanıcı ara..."
            className="pl-9 h-10 rounded-xl text-xs font-medium border-gray-200"
          />
        </div>

        {/* Durum Sekmeleri */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "Tüm Durumlar" },
            { id: "PENDING", label: "Yeni / Beklemede" },
            { id: "REVIEWING", label: "İnceleniyor" },
            { id: "RESOLVED", label: "Çözüldü" },
            { id: "REJECTED", label: "Reddedildi" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer",
                statusFilter === st.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* GERİ BİLDİRİM KARTLARI LİSTESİ */}
      {filteredFeedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-200 text-center shadow-2xs">
          <div className="size-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
            <InboxIcon className="size-8" />
          </div>
          <h3 className="text-base font-black text-gray-900">Geri Bildirim Bulunamadı</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Seçilen filtre ve arama kriterlerine uygun geri bildirim kaydı mevcut değil.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeedbacks.map((item) => {
            const cat = getCategoryConfig(item.category);
            const st = getStatusConfig(item.status);
            const CatIcon = cat.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className={cn(
                  "anim-sleek group flex flex-col justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5",
                  cat.cardClass,
                )}
              >
                <div>
                  {/* Kart Başlığı & Rozetler */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-7 rounded-xl flex items-center justify-center shadow-2xs",
                          cat.iconBg,
                        )}
                      >
                        <CatIcon className="size-3.5" />
                      </div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          cat.badgeClass,
                        )}
                      >
                        {cat.label}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black border",
                        st.className,
                      )}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Başlık */}
                  <h3 className="text-base font-black text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Mesaj Özeti */}
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1.5 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Varsa Ekran Görüntüsü Küçük Resmi */}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-white/80 border border-indigo-100 px-2.5 py-1.5 rounded-xl w-fit shadow-2xs">
                      <FileImageIcon className="size-3.5 text-indigo-600" />
                      <span>{item.attachments.length} Ekran Görüntüsü / Dosya</span>
                    </div>
                  )}
                </div>

                {/* Alt Bilgi: Restoran & Kullanıcı & Tarih */}
                <div className="mt-4 pt-3 border-t border-gray-200/60 space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center justify-between font-bold text-gray-800">
                    <span className="flex items-center gap-1.5 truncate">
                      <StoreIcon className="size-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{item.restaurantName}</span>
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 tabular-nums shrink-0">
                      {new Date(item.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {item.userName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 truncate">
                      <UserIcon className="size-3 text-gray-400 shrink-0" />
                      <span className="truncate">{item.userName}</span>
                      {item.userPhone && (
                        <span className="text-gray-400 font-mono">({item.userPhone})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAY MODALI (KART TIKLANDIĞINDA AÇILIR) */}
      <Dialog
        open={Boolean(selectedFeedback)}
        onOpenChange={(open) => !open && setSelectedFeedback(null)}
      >
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          {selectedFeedback && (
            <>
              {/* MODAL HEADER */}
              <DialogHeader className="p-5 sm:p-6 border-b border-gray-100 bg-slate-50/70 flex flex-row items-center justify-between space-y-0 text-left">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-11 rounded-2xl flex items-center justify-center text-white shadow-sm",
                      getCategoryConfig(selectedFeedback.category).iconBg,
                    )}
                  >
                    <MessageSquareQuoteIcon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          getCategoryConfig(selectedFeedback.category).badgeClass,
                        )}
                      >
                        {getCategoryConfig(selectedFeedback.category).label}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black border",
                          getStatusConfig(selectedFeedback.status).className,
                        )}
                      >
                        {getStatusConfig(selectedFeedback.status).label}
                      </span>
                    </div>
                    <DialogTitle className="text-base sm:text-lg font-black text-gray-900 mt-1">
                      {selectedFeedback.title}
                    </DialogTitle>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <XIcon className="size-4.5" />
                </button>
              </DialogHeader>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                {/* 1. KULLANICININ MESAJI */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                    Geri Bildirim Açıklaması
                  </label>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-normal">
                    {selectedFeedback.message}
                  </div>
                </div>

                {/* 2. EKRAN GÖRÜNTÜLERİ VE EKLER */}
                {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                      Ekli Ekran Görüntüleri ve Dosyalar ({selectedFeedback.attachments.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedFeedback.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedImagePreview(att)}
                          className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-indigo-500 bg-black cursor-pointer shadow-2xs transition-all"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att}
                            alt={`Ek ${idx + 1}`}
                            className="size-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <EyeIcon className="size-5" />
                          </div>
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            Büyüt
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. KULLANICI VE RESTORAN (FİRMA) BİLGİLERİ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Restoran / Firma Bilgileri */}
                  <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-800 border-b border-gray-200 pb-2">
                      <StoreIcon className="size-4 text-indigo-600" />
                      <span>İşletme / Firma Bilgileri</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-gray-900">{selectedFeedback.restaurantName}</div>
                      {selectedFeedback.restaurantPhone && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <PhoneIcon className="size-3 text-gray-400" />
                          <span>{selectedFeedback.restaurantPhone}</span>
                        </div>
                      )}
                      {selectedFeedback.restaurantAddress && (
                        <div className="flex items-start gap-1.5 text-gray-500 text-[11px]">
                          <MapPinIcon className="size-3 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{selectedFeedback.restaurantAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gönderen Kullanıcı Bilgileri */}
                  <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-800 border-b border-gray-200 pb-2">
                      <UserIcon className="size-4 text-indigo-600" />
                      <span>Gönderen Kullanıcı Bilgileri</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-gray-900">
                        {selectedFeedback.userName || "Bilinmiyor"}
                      </div>
                      {selectedFeedback.userPhone && (
                        <div className="flex items-center gap-1.5 text-gray-600 font-mono">
                          <PhoneIcon className="size-3 text-gray-400" />
                          <span>{selectedFeedback.userPhone}</span>
                        </div>
                      )}
                      {selectedFeedback.userEmail && (
                        <div className="text-gray-500 text-[11px] truncate">
                          ✉️ {selectedFeedback.userEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. CİHAZ VE ORTAM BİLGİLERİ */}
                {selectedFeedback.deviceInfo && (
                  <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-800 border-b border-gray-200 pb-2">
                      <LaptopIcon className="size-4 text-indigo-600" />
                      <span>Cihaz ve Tarayıcı Ortamı</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      {selectedFeedback.deviceInfo.device && (
                        <div>
                          <span className="text-gray-400 text-[11px] block">Cihaz Türü:</span>
                          <span className="font-bold text-gray-800">
                            {selectedFeedback.deviceInfo.device}
                          </span>
                        </div>
                      )}
                      {selectedFeedback.deviceInfo.os && (
                        <div>
                          <span className="text-gray-400 text-[11px] block">İşletim Sistemi:</span>
                          <span className="font-bold text-gray-800">
                            {selectedFeedback.deviceInfo.os}
                          </span>
                        </div>
                      )}
                      {selectedFeedback.deviceInfo.browser && (
                        <div>
                          <span className="text-gray-400 text-[11px] block">Tarayıcı:</span>
                          <span className="font-bold text-gray-800">
                            {selectedFeedback.deviceInfo.browser}
                          </span>
                        </div>
                      )}
                      {selectedFeedback.deviceInfo.screenResolution && (
                        <div>
                          <span className="text-gray-400 text-[11px] block">Ekran Çözünürlüğü:</span>
                          <span className="font-bold text-gray-800 font-mono">
                            {selectedFeedback.deviceInfo.screenResolution}
                          </span>
                        </div>
                      )}
                      {selectedFeedback.deviceInfo.path && (
                        <div>
                          <span className="text-gray-400 text-[11px] block">Sayfa Rotası:</span>
                          <span className="font-bold text-indigo-700 font-mono">
                            {selectedFeedback.deviceInfo.path}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. SÜPER ADMİN YÖNETİMİ & NOT ALANI */}
                <div className="space-y-2.5 pt-2 border-t border-gray-200">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                    Yönetici Notu ve Durum Güncellemesi
                  </label>
                  <Input
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Süper admin dahili notu (Örn: v1.4 sürümünde çözüldü)..."
                    className="h-10 rounded-xl text-xs"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-gray-500 mr-1">Durumu Değiştir:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus("REVIEWING")}
                      className="rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                    >
                      İnceleniyor Yap
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    >
                      Çözüldü Olarak İşaretle
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus("REJECTED")}
                      className="rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Reddet
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus("PENDING")}
                      className="rounded-xl text-xs font-bold bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                    >
                      Beklemeye Al
                    </Button>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selectedFeedback.id)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold text-xs gap-1.5"
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Geri Bildirimi Sil</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-5 rounded-xl font-bold text-xs"
                >
                  Kapat
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX MODAL FOR FULL SCREEN IMAGE PREVIEW */}
      <Dialog
        open={Boolean(selectedImagePreview)}
        onOpenChange={(open) => !open && setSelectedImagePreview(null)}
      >
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-0 rounded-3xl overflow-hidden">
          <div className="relative flex items-center justify-center max-h-[85vh]">
            {selectedImagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedImagePreview}
                alt="Ekran Görüntüsü Önizleme"
                className="max-h-[80vh] w-auto object-contain rounded-2xl"
              />
            )}
            <button
              type="button"
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-3 right-3 size-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
