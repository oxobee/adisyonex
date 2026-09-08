"use client";

import { useState } from "react";
import {
  PhoneCallIcon,
  PhoneOffIcon,
  UserCheckIcon,
  UserPlusIcon,
  MapPinIcon,
  ShoppingBagIcon,
  RotateCcwIcon,
  PlusCircleIcon,
  ClockIcon,
  SparklesIcon,
  CheckIcon,
  BikeIcon,
  CalendarDaysIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { quickRegisterCustomerFromCallAction } from "@/actions/telephony.actions";
import type { ActiveCallDTO } from "@/services/telephony.service";

export interface OnStartOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerId?: string;
  callSessionId?: string;
  customerNotes?: string | null;
  addresses?: Array<{
    id: string;
    title: string;
    address: string;
    isDefault: boolean;
    isLastUsed: boolean;
  }>;
  serviceType: "DELIVERY" | "TAKEAWAY" | "DINE_IN" | "RESERVATION";
  isReservation?: boolean;
  repeatItems?: Array<{
    name: string;
    quantity: number;
    price: number;
    variantName?: string | null;
  }>;
}

interface IncomingCallDrawerProps {
  readonly call: ActiveCallDTO | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onDismissCall: (callId: string, status?: "ANSWERED" | "ENDED" | "MISSED") => void;
  readonly onStartOrder: (payload: OnStartOrderPayload) => void;
}

export function IncomingCallDrawer({
  call,
  open,
  onClose,
  onDismissCall,
  onStartOrder,
}: IncomingCallDrawerProps) {
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [isRegistering, setIsRegistering] = useState(false);

  // New customer quick-registration form state
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAddressTitle, setNewAddressTitle] = useState("Ev");
  const [newNotes, setNewNotes] = useState("");

  if (!call) return null;

  const profile = call.customerProfile;
  const isRegistered = profile.isRegistered;

  const handleRepeatLastOrder = () => {
    if (!profile.lastOrder) {
      toast.error("Tekrarlanacak geçmiş sipariş bulunamadı.");
      return;
    }

    const chosenAddress = profile.addresses[selectedAddressIndex]?.address;

    onStartOrder({
      customerName: profile.name || "Müşteri",
      customerPhone: profile.phone,
      customerAddress: chosenAddress,
      customerId: profile.customerId,
      callSessionId: call.id,
      customerNotes: profile.notes,
      addresses: profile.addresses,
      serviceType: "DELIVERY", // Telefon siparişleri varsayılan olarak paket servis
      repeatItems: profile.lastOrder.items,
    });

    onDismissCall(call.id, "ANSWERED");
    toast.success("Son sipariş kalemleri yeni adisyona aktarıldı!");
  };

  const handleOpenNewOrder = (
    serviceType: "DELIVERY" | "TAKEAWAY" | "DINE_IN" | "RESERVATION" = "DELIVERY"
  ) => {
    const chosenAddress =
      serviceType === "DELIVERY"
        ? profile.addresses[selectedAddressIndex]?.address
        : undefined;

    onStartOrder({
      customerName: profile.name || "Müşteri",
      customerPhone: profile.phone,
      customerAddress: chosenAddress,
      customerId: profile.customerId,
      callSessionId: call.id,
      customerNotes: profile.notes,
      addresses: profile.addresses,
      serviceType,
      isReservation: serviceType === "RESERVATION",
    });

    onDismissCall(call.id, "ANSWERED");
    const label =
      serviceType === "TAKEAWAY"
        ? "Gel-Al"
        : serviceType === "DINE_IN"
          ? "Salon"
          : serviceType === "RESERVATION"
            ? "Masa Rezervasyonu"
            : "Paket Servis";
    toast.success(`Müşteri bilgileri ile yeni ${label} modu açıldı.`);
  };

  const handleQuickRegisterAndOrder = async () => {
    if (!newName.trim()) {
      toast.error("Lütfen müşteri adını girin.");
      return;
    }

    setIsRegistering(true);
    try {
      const res = await quickRegisterCustomerFromCallAction({
        phone: profile.phone,
        name: newName.trim(),
        address: newAddress.trim() || undefined,
        addressTitle: newAddressTitle,
        notes: newNotes.trim() || undefined,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Müşteri kaydedilemedi.");
        return;
      }

      toast.success("Müşteri kaydedildi ve sipariş başlatıldı.");

      onStartOrder({
        customerName: res.data.name,
        customerPhone: res.data.phone,
        customerAddress: res.data.address,
        customerId: res.data.customerId,
        callSessionId: call.id,
        customerNotes: newNotes.trim() || null,
        addresses: res.data.address
          ? [
              {
                id: "quick-addr-1",
                title: newAddressTitle,
                address: res.data.address,
                isDefault: true,
                isLastUsed: true,
              },
            ]
          : [],
        serviceType: "DELIVERY",
      });

      onDismissCall(call.id, "ANSWERED");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg overflow-y-auto p-0 flex flex-col gap-0 border-l"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Gelen Çağrı: {call.formattedFromNumber}</SheetTitle>
          <SheetDescription>Gelen arama ve sipariş yönetim paneli</SheetDescription>
        </SheetHeader>

        {/* Call Banner */}
        <div className="bg-primary/10 border-b p-5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground animate-bounce">
                <PhoneCallIcon className="size-4.5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Gelen Arama
                </span>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {call.formattedFromNumber}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {call.isSimulation ? (
                <Badge variant="outline" className="border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  SİMÜLASYON
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  CANLI ÇAĞRI
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            Arama Zamanı: {new Date(call.startedAt).toLocaleTimeString("tr-TR")}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 space-y-5 overflow-y-auto">
          {isRegistered ? (
            /* REGISTERED CUSTOMER VIEW */
            <div className="space-y-4">
              {/* Customer Header */}
              <div className="flex items-start justify-between gap-3 bg-muted/40 p-3.5 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheckIcon className="size-4.5 text-primary" />
                    <h4 className="font-semibold text-base text-foreground">
                      {profile.name}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kayıtlı Müşteri • {profile.formattedPhone}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Düzenli Müşteri
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-background border rounded-lg p-2.5 text-center">
                  <span className="text-[11px] text-muted-foreground block">Toplam Sipariş</span>
                  <span className="text-base font-bold text-foreground">{profile.orderCount}</span>
                </div>
                <div className="bg-background border rounded-lg p-2.5 text-center">
                  <span className="text-[11px] text-muted-foreground block">Toplam Harcama</span>
                  <span className="text-base font-bold text-foreground">
                    {profile.totalSpent.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </span>
                </div>
                <div className="bg-background border rounded-lg p-2.5 text-center">
                  <span className="text-[11px] text-muted-foreground block">Son Sipariş</span>
                  <span className="text-xs font-semibold text-foreground truncate block mt-0.5">
                    {profile.lastOrderDate ? new Date(profile.lastOrderDate).toLocaleDateString("tr-TR") : "—"}
                  </span>
                </div>
              </div>

              {/* Customer Notes */}
              {profile.notes && (
                <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-2.5 rounded-md">
                  <span className="font-semibold block mb-0.5">Müşteri Notu:</span>
                  {profile.notes}
                </div>
              )}

              {/* Registered Addresses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPinIcon className="size-3.5 text-primary" />
                    Kayıtlı Adresler ({profile.addresses.length})
                  </span>
                </div>

                {profile.addresses.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-md border text-center">
                    Henüz kayıtlı teslimat adresi bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.addresses.map((addr, idx) => {
                      const isSelected = selectedAddressIndex === idx;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressIndex(idx)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "hover:border-muted-foreground/30 bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-medium text-xs">
                              <span className="capitalize font-semibold">{addr.title}</span>
                              {addr.isLastUsed && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Son Kullanılan
                                </Badge>
                              )}
                            </div>
                            {isSelected && <CheckIcon className="size-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {addr.address}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Last Order Preview & Repeat */}
              {profile.lastOrder && (
                <Card className="border shadow-none bg-muted/20">
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold flex items-center gap-1 text-foreground">
                        <ShoppingBagIcon className="size-3.5 text-primary" />
                        Son Sipariş (#{profile.lastOrder.orderNumber})
                      </span>
                      <span className="font-bold text-foreground">
                        {profile.lastOrder.total.toLocaleString("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        })}
                      </span>
                    </div>

                    <div className="space-y-1 bg-background/60 p-2 rounded border text-xs">
                      {profile.lastOrder.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-muted-foreground">
                          <span>
                            {it.quantity} × {it.name} {it.variantName ? `(${it.variantName})` : ""}
                          </span>
                          <span className="font-medium text-foreground">
                            {(it.price * it.quantity).toFixed(2)} ₺
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="default"
                      className="w-full gap-2 shadow-xs font-semibold"
                      onClick={handleRepeatLastOrder}
                    >
                      <RotateCcwIcon className="size-4" />
                      Son Siparişi Tekrarla
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  variant="default"
                  className="w-full gap-2 font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => handleOpenNewOrder("DELIVERY")}
                >
                  <BikeIcon className="size-4" />
                  🛵 Paket Servis Siparişi Aç
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="gap-1.5 font-semibold text-xs"
                    onClick={() => handleOpenNewOrder("TAKEAWAY")}
                  >
                    <ShoppingBagIcon className="size-3.5" />
                    🥡 Gel-Al Aç
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5 font-semibold text-xs"
                    onClick={() => handleOpenNewOrder("DINE_IN")}
                  >
                    <PlusCircleIcon className="size-3.5" />
                    🍽️ Masa / Salon Aç
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-2xs"
                  onClick={() => handleOpenNewOrder("RESERVATION")}
                >
                  <CalendarDaysIcon className="size-4 text-amber-600" />
                  📅 Masa Rezervasyonu Yap
                </Button>
              </div>
            </div>
          ) : (
            /* UNREGISTERED (NEW CUSTOMER) VIEW */
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 p-3.5 rounded-lg">
                <UserPlusIcon className="size-5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Yeni Müşteri</h4>
                  <p className="text-xs text-muted-foreground">
                    Bu telefon numarası sisteme kayıtlı değil. Hızlıca kaydedip siparişe geçebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="callerPhone" className="text-xs">
                    Telefon Numarası
                  </Label>
                  <Input
                    id="callerPhone"
                    value={call.formattedFromNumber}
                    disabled
                    className="bg-muted text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newName" className="text-xs">
                    Müşteri Adı Soyadı <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newName"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-xs"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="newAddress" className="text-xs">
                      Teslimat Adresi
                    </Label>
                    <div className="flex gap-1">
                      {["Ev", "İş", "Diğer"].map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => setNewAddressTitle(title)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            newAddressTitle === title
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="newAddress"
                    placeholder="Mahalle, Cadde/Sokak, Bina No, Daire, İlçe..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newNotes" className="text-xs">
                    Müşteri Notu (Opsiyonel)
                  </Label>
                  <Input
                    id="newNotes"
                    placeholder="Örn: Zili çalmayın, kapıya bırakın..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  className="w-full gap-2 font-semibold"
                  disabled={isRegistering || !newName.trim()}
                  onClick={handleQuickRegisterAndOrder}
                >
                  <SparklesIcon className="size-4" />
                  Müşteriyi Kaydet ve Sipariş Aç
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2 font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-2xs text-xs"
                  onClick={() => {
                    onStartOrder({
                      customerName: newName.trim() || "Yeni Müşteri",
                      customerPhone: profile.phone,
                      customerNotes: newNotes.trim() || null,
                      serviceType: "RESERVATION",
                      isReservation: true,
                      callSessionId: call.id,
                    });
                    onDismissCall(call.id, "ANSWERED");
                    toast.success("Müşteri bilgileriyle Rezervasyon Modu açıldı.");
                  }}
                >
                  <CalendarDaysIcon className="size-4 text-amber-600" />
                  📅 Masa Rezervasyonu Yap
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/20 flex gap-2">
          <Button
            variant="destructive"
            className="w-full gap-2 text-xs font-semibold"
            onClick={() => onDismissCall(call.id, "ENDED")}
          >
            <PhoneOffIcon className="size-3.5" />
            Aramayı Kapat
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
