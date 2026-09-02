"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronRightIcon,
  HeartIcon,
  KeyRoundIcon,
  LogInIcon,
  LogOutIcon,
  PhoneIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SparklesIcon,
  StarIcon,
  UserCheckIcon,
  UserIcon,
  UserPlusIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getCustomerProfileAction,
  registerCustomerAction,
} from "@/actions/customer.actions";
import type { CustomerDTO, CustomerProfileDTO } from "@/services/customer.service";
import type { GuestOrderSummaryDTO } from "@/types/order";

export interface CustomerLoyaltyPanelProps {
  readonly username: string;
  readonly restaurantName: string;
  readonly logoUrl?: string | null;
  readonly tableLabel: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly activeOrders?: readonly GuestOrderSummaryDTO[];
  readonly onRequestBill?: () => Promise<void> | void;
  readonly onCustomerIdentified?: (customer: CustomerDTO) => void;
}

const KVKK_TEXT = `Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca; Adisyoon ve işletmemiz tarafından sunulan sadakat programı, doğum günü indirimleri ve sipariş geçmişi takibi hizmetlerinden faydalanabilmeniz amacıyla; adınız, soyadınız, telefon numaranız ve doğum tarihi bilgileriniz 6698 sayılı Kanun'a uygun olarak işlenmekte ve güvenle saklanmaktadır. Verileriniz üçüncü şahıslara ticari amaçla aktarılmaz.`;

export function CustomerLoyaltyPanel({
  username,
  restaurantName,
  logoUrl,
  tableLabel,
  primaryColor = "#FF5500",
  secondaryColor = "#FFF7ED",
  activeOrders = [],
  onRequestBill,
  onCustomerIdentified,
}: CustomerLoyaltyPanelProps) {
  // Session storage key for persistent customer login
  const sessionKey = `adisyoon_customer_${username}`;

  // Customer Profile State
  const [profile, setProfile] = useState<CustomerProfileDTO | null>(null);

  // Registration Drawer State
  const [registerDrawerOpen, setRegisterDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [kvkkModalOpen, setKvkkModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Login (SMS OTP Simulation) State
  const [loginDrawerOpen, setLoginDrawerOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Interactive Quick Action Modals
  const [waiterCallModalOpen, setWaiterCallModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billType, setBillType] = useState<"CARD" | "CASH">("CARD");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [socialModalOpen, setSocialModalOpen] = useState(false);

  // Favorites management (Tap to delete with confirmation)
  const [selectedFavToDelete, setSelectedFavToDelete] = useState<string | null>(null);
  const [confirmDeleteFav, setConfirmDeleteFav] = useState<string | null>(null);
  const [removedFavNames, setRemovedFavNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`adisyoon_removed_favs_${username}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleRemoveFavorite = (favName: string) => {
    const updated = [...removedFavNames, favName];
    setRemovedFavNames(updated);
    try {
      localStorage.setItem(
        `adisyoon_removed_favs_${username}`,
        JSON.stringify(updated),
      );
    } catch {}
    setConfirmDeleteFav(null);
    setSelectedFavToDelete(null);
    toast.success(`${favName} en çok sevilenlerden kaldırıldı.`);
  };

  // Load saved session on mount
  const loadProfile = useCallback(
    async (customerId?: string, savedPhone?: string) => {
      try {
        const res = await getCustomerProfileAction({
          username,
          customerId,
          phone: savedPhone,
        });
        if (res.success && res.data) {
          setProfile(res.data);
          onCustomerIdentified?.(res.data.customer);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
    },
    [username, onCustomerIdentified],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id || parsed.phone) {
          void loadProfile(parsed.id, parsed.phone);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, [activeOrders?.length, sessionKey, loadProfile]);

  const liveOrders = (activeOrders ?? []).filter((o) => o.status !== "VOID");

  // Handle SMS OTP Sending (Simulation)
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      toast.error("Lütfen telefon numaranızı girin");
      return;
    }
    setLoginStep("OTP");
    toast.success("Doğrulama Kodu Gönderildi! 📲", {
      description: "Simülasyon Modu: Herhangi bir 6 haneli kod girerek giriş yapabilirsiniz.",
    });
  };

  // Handle SMS OTP Verification & Login
  const handleVerifyOtpAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp.trim()) {
      toast.error("Lütfen doğrulama kodunu girin");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await getCustomerProfileAction({
        username,
        phone: loginPhone.trim(),
      });

      if (res.success && res.data) {
        const cust = res.data.customer;
        localStorage.setItem(
          sessionKey,
          JSON.stringify({ id: cust.id, phone: cust.phone, name: cust.name }),
        );
        toast.success(`Tekrar hoş geldiniz, ${cust.name}! 👋`, {
          description: "Giriş başarılı, sadakat puanlarınız ve sipariş geçmişiniz yüklendi.",
        });
        setLoginDrawerOpen(false);
        setLoginStep("PHONE");
        setLoginOtp("");
        await loadProfile(cust.id, cust.phone);
      } else {
        toast.info("Bu numarayla kayıtlı hesap bulunamadı.", {
          description: "Lütfen adınızı girerek saniyeler içinde Hesap Oluşturun.",
        });
        setPhone(loginPhone.trim());
        setLoginDrawerOpen(false);
        setLoginStep("PHONE");
        setLoginOtp("");
        setRegisterDrawerOpen(true);
      }
    } catch {
      toast.error("Giriş yapılırken bir hata oluştu.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Lütfen adınızı ve telefon numaranızı girin");
      return;
    }
    if (!kvkkAccepted) {
      toast.error("Lütfen KVKK Aydınlatma Metnini onaylayın");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerCustomerAction({
        username,
        name: name.trim(),
        phone: phone.trim(),
        birthDate: birthDate ? birthDate : null,
        kvkkConsent: kvkkAccepted,
      });

      if (res.success && res.data) {
        const cust = res.data;
        localStorage.setItem(
          sessionKey,
          JSON.stringify({ id: cust.id, phone: cust.phone, name: cust.name }),
        );
        toast.success(`Hoş geldiniz, ${cust.name}! 🎉`, {
          description: "Hesabınız başarıyla oluşturuldu ve oturum açıldı.",
        });
        setRegisterDrawerOpen(false);
        await loadProfile(cust.id, cust.phone);
      } else {
        toast.error(res.error || "Kayıt işlemi gerçekleştirilemedi.");
      }
    } catch {
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(sessionKey);
    setProfile(null);
    toast.info("Oturum kapatıldı.");
  };

  const handleCallWaiter = () => {
    setWaiterCallModalOpen(false);
    toast.success("Garson Çağrıldı! 🛎️", {
      description: `${tableLabel} masası için servis personeli yönlendirildi.`,
    });
  };

  const handleRequestBillConfirm = async () => {
    setBillModalOpen(false);
    if (onRequestBill) {
      await onRequestBill();
    }
    toast.success(`Hesap Talebi İletildi (${billType === "CARD" ? "Kredi Kartı" : "Nakit"})! 🧾`, {
      description: "Garsonumuz pos cihazı/hesap ile masanıza gelmektedir.",
    });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewModalOpen(false);
    toast.success("Değerlendirmeniz İçin Teşekkür Ederiz! ⭐", {
      description: "Görüşleriniz hizmet kalitemizi artırmamıza yardımcı oluyor.",
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* ============================================================ */}
      {/* 1. TOP FIRMA & MASA BAŞLIĞI                                  */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-zinc-200/80 flex items-center justify-between gap-3">
        {/* Left: Firma Adı & Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="relative size-12 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-xs shadow-inner shrink-0 border border-zinc-100"
            style={{ backgroundColor: primaryColor }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={restaurantName}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            ) : (
              <UtensilsCrossedIcon className="size-6 stroke-[2.2]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-base text-zinc-900 truncate leading-tight">
              {restaurantName}
            </h3>
            <span className="text-[11px] font-bold text-zinc-400 block mt-0.5">
              Müşteri & Masa Paneli
            </span>
          </div>
        </div>

        {/* Right: Masa Numarası */}
        <div
          className="px-3 py-1.5 rounded-2xl text-xs font-black border shadow-2xs shrink-0 flex items-center gap-1.5"
          style={{
            backgroundColor: secondaryColor,
            borderColor: `${primaryColor}40`,
            color: primaryColor,
          }}
        >
          <span>🍽️</span>
          <span>{tableLabel}</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. AÇIK SİPARİŞLERİM (ANLIK SİPARİŞ TAKİBİ: HAZIRLANIYOR)    */}
      {/* ============================================================ */}
      {liveOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-red-600" />
              </span>
              <span>Açık Siparişlerim ({liveOrders.length})</span>
            </h4>
            <span className="text-[10px] font-bold text-red-700 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
              Canlı Takip Ediliyor 🔴
            </span>
          </div>

          <div className="space-y-3">
            {liveOrders.map((ord) => {
              const nonVoidLines = ord.lines.filter((l) => l.state !== "VOID");
              const allServed =
                nonVoidLines.length > 0 &&
                nonVoidLines.every((l) => l.state === "SERVED");
              const anyServed = nonVoidLines.some((l) => l.state === "SERVED");
              const anyPrepared = nonVoidLines.some((l) => l.state === "PREPARED");
              const anyPreparing = nonVoidLines.some((l) => l.state === "PREPARING");

              // Accurate live kitchen & delivery status:
              const isDelivered = allServed;
              const isReady = !isDelivered && (ord.kitchenStatus === "READY" || anyPrepared);
              const isPreparing =
                !isDelivered &&
                !isReady &&
                (ord.kitchenStatus === "PREPARING" || anyPreparing || anyServed);
              const isWaiting = !isDelivered && !isReady && !isPreparing;
              const isSettledOrPaid = ord.status === "COMPLETED";

              return (
                <div
                  key={ord.id}
                  className="relative overflow-hidden bg-white rounded-3xl p-4 border-2 border-red-500 shadow-md space-y-3 transition-all"
                >
                  {/* Top Bar: Order Number & Live Status Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-red-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-zinc-900">
                        Sipariş #{ord.orderNumber || ord.id.slice(-6)}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        • {ord.tableLabel ?? tableLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isDelivered && (
                        <Badge className="bg-red-600 text-white border-red-600 text-[10px] font-black">
                          🍽️ Masanıza Teslim Edildi
                        </Badge>
                      )}
                      {isReady && !isDelivered && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] font-black animate-pulse">
                          🍽️ Servise Hazır
                        </Badge>
                      )}
                      {isPreparing && (
                        <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[10px] font-black animate-pulse">
                          🍳 Hazırlanıyor
                        </Badge>
                      )}
                      {isWaiting && (
                        <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] font-black animate-pulse">
                          ⏳ Mutfakta Bekliyor
                        </Badge>
                      )}
                      {isSettledOrPaid && (
                        <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] font-black">
                          ✅ Ödendi
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="divide-y divide-zinc-100 text-xs pt-1">
                    {ord.lines.map((line, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-black tabular-nums"
                            style={{ color: primaryColor }}
                          >
                            {line.quantity}×
                          </span>
                          <span className="font-semibold text-zinc-800">{line.name}</span>
                          {line.variantName && (
                            <span className="text-[10px] text-zinc-400">
                              ({line.variantName})
                            </span>
                          )}
                        </div>
                        {line.state === "SERVED" ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Servis Edildi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md animate-pulse">
                            Bekleniyor
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total & Quick Bill Request */}
                  <div className="border-t border-zinc-100 pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Toplam Tutar</span>
                      <span className="font-black text-sm text-zinc-900 tabular-nums">
                        {formatCurrency(ord.total)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBillModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs border text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>🧾</span>
                      <span>Hesap İste</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. EN ÜSTTE DİKKAT ÇEKİCİ HIZLI HESAP OLUŞTUR / GİRİŞ ALANI */}
      {/* ============================================================ */}
      {!profile ? (
        <div className="relative overflow-hidden rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-white shadow-md space-y-3">
          {/* Background Glows */}
          <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-amber-400/25 blur-xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 size-28 rounded-full bg-orange-500/20 blur-xl" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="space-y-1 min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider">
                <SparklesIcon className="size-3 text-amber-600" />
                <span>Sadakat Kulübü</span>
              </span>
              <h4 className="text-base font-black text-zinc-900 leading-tight">
                Hızlı Hesap Oluştur veya Giriş Yap
              </h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Doğum günü sürprizleri, size özel indirimler ve geçmiş siparişlerinizi anında görmek için katılın!
              </p>
            </div>

            <div className="size-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🎁
            </div>
          </div>

          {/* Action Buttons: Hızlı Giriş Yap & Hesap Oluştur */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setLoginStep("PHONE");
                setLoginOtp("");
                setLoginDrawerOpen(true);
              }}
              className="w-full h-11.5 rounded-2xl font-black text-xs sm:text-sm text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <LogInIcon className="size-4 stroke-[2.5]" />
              <span>Hızlı Giriş Yap</span>
              <ChevronRightIcon className="size-4 stroke-[3]" />
            </button>

            <div className="flex items-center gap-2 py-0.5">
              <div className="h-px bg-zinc-200/80 flex-1" />
              <span className="text-[11px] font-bold text-zinc-400">veya</span>
              <div className="h-px bg-zinc-200/80 flex-1" />
            </div>

            <button
              type="button"
              onClick={() => setRegisterDrawerOpen(true)}
              className="w-full h-11 rounded-2xl font-black text-xs sm:text-sm border-2 shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer bg-white"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
              }}
            >
              <UserPlusIcon className="size-4 stroke-[2.5]" />
              <span>Hesap Oluştur</span>
            </button>
          </div>
        </div>
      ) : (
        /* GİRİŞ YAPILMIŞSA: MÜŞTERİ PROFİLİ VE GEÇMİŞ SİPARİŞ ANALİTİĞİ */
        <div className="space-y-3">
          {/* Müşteri Kimlik Kartı */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-zinc-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="size-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {profile.customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-zinc-900 truncate">
                    {profile.customer.name}
                  </h4>
                  {profile.customer.birthMonth && (
                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[9px] font-bold">
                      🎂 Doğum Günü Kayıtlı
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                  {profile.customer.phone}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOutIcon className="size-4" />
            </button>
          </div>

          {/* Sadakat İstatistik Rozetleri */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl p-3 border border-zinc-200/70 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-zinc-400 block">Sipariş Sayısı</span>
              <span className="text-base font-black text-zinc-900 tabular-nums block mt-0.5" style={{ color: primaryColor }}>
                {profile.stats.orderCount} kez
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-zinc-200/70 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-zinc-400 block">Toplam Harcama</span>
              <span className="text-sm font-black text-zinc-900 tabular-nums block mt-0.5">
                {formatCurrency(profile.stats.totalSpent)}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-zinc-200/70 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-zinc-400 block">Ort. Sipariş</span>
              <span className="text-sm font-black text-zinc-900 tabular-nums block mt-0.5">
                {formatCurrency(profile.stats.averageOrderValue)}
              </span>
            </div>
          </div>

          {/* En Çok Sevdiği Lezzetler (Favoriler) */}
          {profile.favoriteItems.length > 0 && (
            <div className="bg-white rounded-3xl p-4 border border-zinc-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartIcon className="size-3.5 fill-red-500 text-red-500" />
                  <span>En Çok Sevdiğiniz Lezzetler</span>
                </h4>
                <span className="text-[10px] font-bold text-zinc-400">Favoriler</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {profile.favoriteItems
                  .filter((fav) => !removedFavNames.includes(fav.name))
                  .map((fav, i) => {
                    const isSelected = selectedFavToDelete === fav.name;
                    return (
                      <div
                        key={i}
                        onClick={() =>
                          setSelectedFavToDelete(isSelected ? null : fav.name)
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-red-50 border-red-500 text-red-600 shadow-xs"
                            : "bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100",
                        )}
                        style={
                          !isSelected
                            ? {
                                backgroundColor: secondaryColor,
                                borderColor: `${primaryColor}30`,
                              }
                            : undefined
                        }
                      >
                        <span>{isSelected ? "❤️" : "⭐"}</span>
                        <span>{fav.name}</span>
                        <span className="text-[10px] font-black opacity-70">
                          ({fav.count}×)
                        </span>

                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteFav(fav.name);
                            }}
                            className="size-4.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black hover:bg-red-700 active:scale-90 ml-0.5"
                            title="Kaldır"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Geçmiş Siparişler (Kategorize ve Tarihsel) */}
          {profile.orders.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <ReceiptIcon className="size-3.5" style={{ color: primaryColor }} />
                <span>Geçmiş Siparişlerim ({profile.orders.length})</span>
              </h4>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
                {profile.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl p-3.5 border border-zinc-200/80 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-zinc-400">
                          #{ord.orderNumber || ord.id.slice(-5)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          • {formatDate(ord.createdAt)}
                        </span>
                      </div>

                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[9px] font-black px-2 py-0.5">
                        {ord.status === "VOID" ? "İptal Edildi" : "Tamamlandı"}
                      </Badge>
                    </div>

                    <div className="divide-y divide-zinc-100/80">
                      {ord.lines.map((line, idx) => (
                        <div key={idx} className="py-1 flex items-center justify-between text-zinc-700">
                          <span className="truncate pr-2">
                            <strong className="text-zinc-900">{line.quantity}×</strong> {line.name}
                            {line.variantName ? ` (${line.variantName})` : ""}
                          </span>
                          <span className="tabular-nums font-mono text-[11px] font-bold shrink-0">
                            {formatCurrency(line.unitPrice * line.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-1.5 flex items-center justify-between font-black text-xs text-zinc-900">
                      <span className="text-zinc-400 font-medium">Toplam Tutar</span>
                      <span style={{ color: primaryColor }} className="tabular-nums text-sm">
                        {formatCurrency(ord.grandTotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. ANA İŞLEM BUTONLARI (GARSON, HESAP, DEĞERLENDİR, SOSYAL)  */}
      {/* ============================================================ */}
      {/* Garson Çağır Butonu (Geniş / Tam Boy) */}
      <button
        type="button"
        onClick={() => setWaiterCallModalOpen(true)}
        className="w-full bg-white rounded-3xl p-4 border border-zinc-200/80 hover:border-zinc-300 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer active:scale-95 group text-left"
      >
        <div className="flex items-center gap-3.5">
          <div
            className="size-13 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0"
            style={{ backgroundColor: secondaryColor }}
          >
            🛎️
          </div>
          <div>
            <h5 className="font-black text-sm text-zinc-900">Garson Çağır</h5>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              Masanıza servis personeli yönlendirilsin
            </span>
          </div>
        </div>
        <div
          className="size-8 rounded-full flex items-center justify-center text-xs font-black transition-colors"
          style={{ backgroundColor: secondaryColor, color: primaryColor }}
        >
          ➔
        </div>
      </button>

      {/* İkili Butonlar: Değerlendir & Sosyal Medya */}
      <div className="grid grid-cols-2 gap-2.5">

        {/* Bizi Değerlendir Butonu */}
        <button
          type="button"
          onClick={() => setReviewModalOpen(true)}
          className="bg-white rounded-3xl p-4 border border-zinc-200/80 hover:border-zinc-300 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 group"
        >
          <div
            className="size-12 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"
            style={{ backgroundColor: secondaryColor }}
          >
            ⭐
          </div>
          <div>
            <h5 className="font-black text-xs text-zinc-900">Bizi Değerlendir</h5>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Deneyiminizi puanlayın</span>
          </div>
        </button>

        {/* Sosyal Medya Hesapları Butonu */}
        <button
          type="button"
          onClick={() => setSocialModalOpen(true)}
          className="bg-white rounded-3xl p-4 border border-zinc-200/80 hover:border-zinc-300 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 group"
        >
          <div
            className="size-12 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"
            style={{ backgroundColor: secondaryColor }}
          >
            📱
          </div>
          <div>
            <h5 className="font-black text-xs text-zinc-900">Sosyal Medya</h5>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Bizi takip edin & keşfedin</span>
          </div>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 4. ALTTAN AÇILIR HIZLI GİRİŞ YAP (SMS DOĞRULAMA SİMÜLASYONU)  */}
      {/* ============================================================ */}
      <Sheet open={loginDrawerOpen} onOpenChange={setLoginDrawerOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] rounded-t-3xl p-0 overflow-hidden flex flex-col bg-white"
        >
          <SheetHeader className="p-4 pb-3 border-b text-left bg-zinc-50 flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-base font-black text-zinc-900 flex items-center gap-2">
                <LogInIcon className="size-4.5" style={{ color: primaryColor }} />
                <span>Hızlı Giriş Yap</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400 font-medium">
                {loginStep === "PHONE"
                  ? "Telefon numaranız ile SMS doğrulama yaparak anında giriş yapın"
                  : "Telefonunuza gönderilen 6 haneli doğrulama kodunu girin"}
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => setLoginDrawerOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
            >
              <XIcon className="size-5" />
            </button>
          </SheetHeader>

          {loginStep === "PHONE" ? (
            <form onSubmit={handleSendOtp} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                  <SmartphoneIcon className="size-3.5" style={{ color: primaryColor }} />
                  <span>Telefon Numaranız</span>
                </label>
                <Input
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  required
                  autoFocus
                  className="h-12 rounded-2xl text-xs font-bold border-zinc-200 bg-zinc-50/70"
                />
                <span className="text-[11px] text-zinc-400 block">
                  Telefonunuza tek kullanımlık SMS doğrulama kodu gönderilecektir.
                </span>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <KeyRoundIcon className="size-4 stroke-[2.5]" />
                <span>Doğrulama Kodu Gönder</span>
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginDrawerOpen(false);
                    setRegisterDrawerOpen(true);
                  }}
                  className="text-xs font-bold text-zinc-500 hover:underline cursor-pointer"
                >
                  Hesabınız yok mu? <strong style={{ color: primaryColor }}>Hesap Oluşturun</strong>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpAndLogin} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="size-4" style={{ color: primaryColor }} />
                  <span className="text-xs font-mono font-bold text-zinc-800">{loginPhone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLoginStep("PHONE")}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  style={{ color: primaryColor }}
                >
                  Numarayı Değiştir
                </button>
              </div>

              {/* Simulation Notification */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2">
                <SparklesIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Simülasyon Modu:</strong> SMS altyapısı şu an simüle edilmektedir. İstediğiniz herhangi bir 6 haneli kodu girerek anında giriş yapabilirsiniz.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                  <KeyRoundIcon className="size-3.5" style={{ color: primaryColor }} />
                  <span>6 Haneli Doğrulama Kodu</span>
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value)}
                  placeholder="• • • • • •"
                  required
                  autoFocus
                  className="h-14 rounded-2xl text-center text-xl font-mono tracking-widest font-black border-zinc-200 bg-zinc-50/70"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-12 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <UserCheckIcon className="size-4 stroke-[2.5]" />
                <span>{isLoggingIn ? "Giriş Yapılıyor…" : "Giriş Yap ve Hesabımı Aç"}</span>
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Yeni kod gönderildi! (Simülasyon)");
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  Kod gelmedi mi? Tekrar Gönder
                </button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* ============================================================ */}
      {/* 5. ALTTAN AÇILIR TAM EKRAN HESAP OLUŞTUR DRAWER'I            */}
      {/* ============================================================ */}
      <Sheet open={registerDrawerOpen} onOpenChange={setRegisterDrawerOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] rounded-t-3xl p-0 overflow-hidden flex flex-col bg-white"
        >
          <SheetHeader className="p-4 pb-3 border-b text-left bg-zinc-50 flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-base font-black text-zinc-900 flex items-center gap-2">
                <UserPlusIcon className="size-4.5" style={{ color: primaryColor }} />
                <span>Hesap Oluştur</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400 font-medium">
                Sadakat kulübüne katılarak sürpriz hediyeler ve puanlar kazanın
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => setRegisterDrawerOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
            >
              <XIcon className="size-5" />
            </button>
          </SheetHeader>

          <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Ad Soyad */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                <UserIcon className="size-3.5" style={{ color: primaryColor }} />
                <span>Adınız Soyadınız</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Mehmet Özkan"
                required
                className="h-12 rounded-2xl text-xs font-bold border-zinc-200 bg-zinc-50/70"
              />
            </div>

            {/* Telefon Numarası */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                <PhoneIcon className="size-3.5" style={{ color: primaryColor }} />
                <span>İletişim Numaranız (Telefon)</span>
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                required
                className="h-12 rounded-2xl text-xs font-bold border-zinc-200 bg-zinc-50/70"
              />
              <span className="text-[10px] text-zinc-400 block">
                Daha önce kayıt olduysanız telefon numaranızla profiliniz ve geçmişiniz otomatik eşleşir.
              </span>
            </div>

            {/* Doğum Tarihi */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" style={{ color: primaryColor }} />
                <span>Doğum Tarihiniz (Doğum Günü İndirimi İçin)</span>
              </label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-12 rounded-2xl text-xs font-bold border-zinc-200 bg-zinc-50/70"
              />
            </div>

            {/* KVKK Onay Tick Alanı */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="size-4 mt-0.5 rounded-md border-zinc-300 accent-primary cursor-pointer"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-[11px] text-zinc-600 font-medium leading-relaxed">
                  <strong className="text-zinc-900">Açık Rıza ve KVKK Aydınlatma Metni</strong>&apos;ni okudum, kişisel verilerimin sadakat programı ve kampanya bilgilendirmesi amacıyla işlenmesini onaylıyorum.
                </span>
              </label>

              <button
                type="button"
                onClick={() => setKvkkModalOpen(true)}
                className="text-[10px] font-bold underline text-primary block ml-6.5 cursor-pointer"
                style={{ color: primaryColor }}
              >
                KVKK Aydınlatma Metnini İncele →
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!kvkkAccepted || isSubmitting}
              className="w-full h-12 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              <UserCheckIcon className="size-4 stroke-[2.5]" />
              <span>{isSubmitting ? "Kaydediliyor…" : "Hesap Oluştur ve Kaydol"}</span>
            </Button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setRegisterDrawerOpen(false);
                  setLoginStep("PHONE");
                  setLoginDrawerOpen(true);
                }}
                className="text-xs font-bold text-zinc-500 hover:underline cursor-pointer"
              >
                Zaten hesabınız var mı? <strong style={{ color: primaryColor }}>Hızlı Giriş Yapın</strong>
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ============================================================ */}
      {/* 5. KVKK SÖZLEŞME METNİ POPUP                                 */}
      {/* ============================================================ */}
      <Dialog open={kvkkModalOpen} onOpenChange={setKvkkModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-5 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-zinc-900 flex items-center gap-2">
              <ShieldCheckIcon className="size-5 text-emerald-600" />
              <span>KVKK Aydınlatma ve Rıza Metni</span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto text-xs text-zinc-600 leading-relaxed p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
            {KVKK_TEXT}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setKvkkAccepted(true);
                setKvkkModalOpen(false);
              }}
              className="w-full rounded-2xl font-bold text-xs text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Okudum, Kabul Ediyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 6. GARSON ÇAĞIR MODAL                                        */}
      {/* ============================================================ */}
      <Dialog open={waiterCallModalOpen} onOpenChange={setWaiterCallModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-16 rounded-3xl flex items-center justify-center text-3xl shadow-inner" style={{ backgroundColor: secondaryColor }}>
              🛎️
            </div>
            <DialogTitle className="text-base font-black text-zinc-900">Garson Çağır</DialogTitle>
            <p className="text-xs text-zinc-500 leading-relaxed">
              <strong className="text-zinc-900">{tableLabel}</strong> masası için servis personeli çağrılsın mı?
            </p>
            <div className="flex gap-2 w-full mt-2">
              <Button variant="outline" onClick={() => setWaiterCallModalOpen(false)} className="flex-1 rounded-2xl font-bold text-xs">
                Vazgeç
              </Button>
              <Button
                onClick={handleCallWaiter}
                className="flex-1 rounded-2xl font-black text-xs text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Evet, Çağır
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAVORITE ITEM DELETE CONFIRMATION MODAL */}
      <Dialog
        open={Boolean(confirmDeleteFav)}
        onOpenChange={(open) => !open && setConfirmDeleteFav(null)}
      >
        <DialogContent className="max-w-xs rounded-3xl p-5 text-center space-y-3 border border-zinc-200 shadow-2xl">
          <div className="size-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl shadow-inner">
            🗑️
          </div>
          <DialogTitle className="text-base font-black text-zinc-900">
            Favorilerden Kaldırılsın mı?
          </DialogTitle>
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-900">&ldquo;{confirmDeleteFav}&rdquo;</strong> ürününü en çok sevilen lezzetlerinizden kaldırmak istiyor musunuz?
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDeleteFav(null);
                setSelectedFavToDelete(null);
              }}
              className="h-10 rounded-2xl font-bold text-xs cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              onClick={() => confirmDeleteFav && handleRemoveFavorite(confirmDeleteFav)}
              className="h-10 rounded-2xl font-black text-xs text-white bg-red-600 hover:bg-red-700 shadow-md cursor-pointer active:scale-95"
            >
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 7. HESAP İSTE MODAL (ŞIK, GÜZEL VE TEMAYLA UYUMLU TASARIM)   */}
      {/* ============================================================ */}
      <Dialog open={billModalOpen} onOpenChange={setBillModalOpen}>
        <DialogContent className="max-w-sm rounded-[32px] p-6 text-center space-y-4 border border-zinc-200/90 shadow-2xl bg-white overflow-hidden">
          {/* Header Icon with glowing ambient aura */}
          <div className="relative mx-auto size-16">
            <div
              className="absolute inset-0 rounded-3xl blur-md opacity-30 animate-pulse"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="relative size-16 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-zinc-100"
              style={{ backgroundColor: secondaryColor }}
            >
              🧾
            </div>
          </div>

          <div>
            <DialogTitle className="text-lg font-black tracking-tight text-zinc-900">
              Hesap İste
            </DialogTitle>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              <span className="font-bold text-zinc-800">{tableLabel}</span> Masası
            </p>
          </div>

          {/* Active Bill Amount Card */}
          {liveOrders.reduce((sum, o) => sum + o.total, 0) > 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Ödenecek Tutar
                </span>
                <span className="text-xs text-zinc-500 font-medium">Toplam Masanız</span>
              </div>
              <span className="text-xl font-black tabular-nums tracking-tight text-zinc-900">
                {formatCurrency(liveOrders.reduce((sum, o) => sum + o.total, 0))}
              </span>
            </div>
          )}

          {/* Payment Selection Radio Cards */}
          <div className="space-y-2 text-left">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block px-1">
              Ödeme Tercihiniz
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBillType("CARD")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between h-24",
                  billType === "CARD"
                    ? "border-2 shadow-sm bg-white"
                    : "border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 text-zinc-600",
                )}
                style={{
                  borderColor: billType === "CARD" ? primaryColor : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">💳</span>
                  {billType === "CARD" && (
                    <span
                      className="size-2.5 rounded-full ring-4"
                      style={{
                        backgroundColor: primaryColor,
                        // @ts-ignore
                        "--tw-ring-color": `${primaryColor}30`,
                      }}
                    />
                  )}
                </div>
                <div>
                  <h6 className="font-black text-xs text-zinc-900 leading-tight">
                    Kredi Kartı
                  </h6>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    POS Cihazı ile
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBillType("CASH")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between h-24",
                  billType === "CASH"
                    ? "border-2 shadow-sm bg-white"
                    : "border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 text-zinc-600",
                )}
                style={{
                  borderColor: billType === "CASH" ? primaryColor : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">💵</span>
                  {billType === "CASH" && (
                    <span
                      className="size-2.5 rounded-full ring-4"
                      style={{
                        backgroundColor: primaryColor,
                        // @ts-ignore
                        "--tw-ring-color": `${primaryColor}30`,
                      }}
                    />
                  )}
                </div>
                <div>
                  <h6 className="font-black text-xs text-zinc-900 leading-tight">
                    Nakit
                  </h6>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Nakit ödeme
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 w-full pt-2">
            <Button
              variant="outline"
              onClick={() => setBillModalOpen(false)}
              className="flex-1 h-12 rounded-2xl font-bold text-xs border-zinc-200 cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              onClick={handleRequestBillConfirm}
              className="flex-1 h-12 rounded-2xl font-black text-xs text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              Hesap İste ➔
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 8. BİZİ DEĞERLENDİR (YILDIZ VE YORUM MODALI)                 */}
      {/* ============================================================ */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 text-center space-y-3">
          <DialogTitle className="text-base font-black text-zinc-900">Bizi Değerlendirin ⭐</DialogTitle>
          <p className="text-xs text-zinc-500">Bugünkü lezzet ve servis deneyiminizi puanlayın:</p>

          <div className="flex items-center justify-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-125 active:scale-95 cursor-pointer"
              >
                <StarIcon
                  className={cn(
                    "size-7 transition-colors",
                    star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300",
                  )}
                />
              </button>
            ))}
          </div>

          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Yorum ve önerileriniz (İsteğe bağlı)..."
            rows={3}
            className="w-full rounded-2xl p-3 text-xs border border-zinc-200 bg-zinc-50 outline-none resize-none font-medium"
          />

          <Button
            onClick={handleSubmitReview}
            className="w-full rounded-2xl font-black text-xs text-white h-11"
            style={{ backgroundColor: primaryColor }}
          >
            Puanı Gönder ✨
          </Button>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 9. SOSYAL MEDYA HESAPLARI MODAL                              */}
      {/* ============================================================ */}
      <Dialog open={socialModalOpen} onOpenChange={setSocialModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 text-center space-y-4">
          <DialogTitle className="text-base font-black text-zinc-900">Sosyal Medyada Biz 📱</DialogTitle>
          <p className="text-xs text-zinc-500">Bizi takip ederek güncel fırsat ve etkinliklerden haberdar olun:</p>

          <div className="space-y-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-2xl border border-pink-200 bg-pink-50/60 hover:bg-pink-100/70 text-pink-700 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>📸</span>
                <span>Instagram</span>
              </span>
              <ChevronRightIcon className="size-4" />
            </a>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>👥</span>
                <span>Facebook</span>
              </span>
              <ChevronRightIcon className="size-4" />
            </a>

            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-700 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>📍</span>
                <span>Google Haritalar & Yorumlar</span>
              </span>
              <ChevronRightIcon className="size-4" />
            </a>
          </div>

          <Button
            variant="outline"
            onClick={() => setSocialModalOpen(false)}
            className="w-full rounded-2xl font-bold text-xs"
          >
            Kapat
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
