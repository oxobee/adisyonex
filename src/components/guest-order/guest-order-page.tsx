"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CakeIcon,
  CalendarIcon,
  CheckCircle2Icon,
  MinusIcon,
  PhoneIcon,
  PlusIcon,
  ShoppingBagIcon,
  Trash2Icon,
  UserIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { toast } from "sonner";

import { registerCustomerAction } from "@/actions/customer.actions";
import {
  guestLogoutAction,
  guestMyOrdersAction,
  guestPlaceOrderAction,
  guestRequestBillAction,
} from "@/actions/guest-order.actions";
import { ItemConfigDialog } from "@/components/pos/item-config-dialog";
import { linePrice, toBillLine } from "@/components/pos/types";
import { useOrderCart } from "@/components/pos/use-order-cart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useServerAction } from "@/hooks/use-server-action";
import { formatTime } from "@/lib/format";
import {
  clearGuestSession,
  guestSessionKey,
  readGuestSession,
  writeGuestSession,
} from "@/lib/guest-cart-storage";
import { uuid } from "@/lib/uuid";
import { cn } from "@/lib/utils";
import { computeBill } from "@/services/billing";
import type { QrSliderItem } from "@/services/restaurant-settings.service";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";
import type { GuestOrderSummaryDTO } from "@/types/order";

import { MenuBrowser } from "../waiter/menu-browser";
import { newLineKey } from "../pos/types";
import { Theme2QsrView } from "./theme2-qsr-view";

const orderStatus = (
  o: GuestOrderSummaryDTO,
): { label: string; className: string } => {
  if (o.status === "COMPLETED") {
    return { label: "Ödendi", className: "bg-slate-100 text-slate-700" };
  }
  if (o.status === "VOID") {
    return { label: "İptal Edildi", className: "bg-red-100 text-red-800" };
  }
  switch (o.kitchenStatus) {
    case "WAITING":
      return { label: "Sırada", className: "bg-amber-100 text-amber-900" };
    case "PREPARING":
      return { label: "Hazırlanıyor", className: "bg-sky-100 text-sky-900" };
    case "READY":
      return { label: "Hazır", className: "bg-emerald-100 text-emerald-900" };
    default:
      return { label: "Servis Edildi", className: "bg-slate-100 text-slate-700" };
  }
};

export function GuestOrderPage({
  username,
  tableId,
  tableLabel,
  restaurantName,
  logoUrl,
  menu,
  initiallyVerified,
  verifiedPhoneMasked,
  verifiedExpiresAt,
  initialOrders,
  qrMenuTheme = "MODERN",
  qrPrimaryColor = "#FF5500",
  qrSecondaryColor = "#FFF7ED",
  qrSlidersEnabled = true,
  qrSliders,
}: {
  readonly username: string;
  readonly tableId: string;
  readonly tableLabel: string;
  readonly restaurantName: string;
  readonly logoUrl?: string | null;
  readonly menu: MenuDTO;
  readonly initiallyVerified: boolean;
  readonly verifiedPhoneMasked: string | null;
  readonly verifiedExpiresAt: number | null;
  readonly initialOrders: readonly GuestOrderSummaryDTO[];
  readonly qrMenuTheme?: string;
  readonly qrPrimaryColor?: string;
  readonly qrSecondaryColor?: string;
  readonly qrSlidersEnabled?: boolean;
  readonly qrSliders?: readonly QrSliderItem[] | null;
}) {
  const cart = useOrderCart();
  const [configItem, setConfigItem] = useState<MenuItemDTO | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [requestBillConfirmOpen, setRequestBillConfirmOpen] = useState(false);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [myOrders, setMyOrders] = useState<readonly GuestOrderSummaryDTO[]>(initialOrders);
  const [placed, setPlaced] = useState(false);

  // Customer Loyalty Registration State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBirthDate, setCustomerBirthDate] = useState("");

  const storageKey = useMemo(
    () => guestSessionKey(username, tableId),
    [username, tableId],
  );
  const idempotencyKey = useRef<string>(uuid());

  // Restore cart on mount
  useEffect(() => {
    const saved = readGuestSession(storageKey);
    if (!saved) return;
    if (saved.lines.length > 0) {
      cart.replaceAll(saved.lines);
    }
  }, [storageKey]);

  // Persist cart
  const persistSession = useCallback(() => {
    writeGuestSession(storageKey, {
      lines: cart.cart,
      verified: false,
      expiresAt: null,
    });
  }, [storageKey, cart.cart]);

  useEffect(() => {
    persistSession();
  }, [persistSession]);

  const refreshOrders = async () => {
    const res = await guestMyOrdersAction({ username, tableId });
    if (res.success && res.data) {
      setMyOrders(res.data);
    }
  };

  // Poll orders so when cashier settles table, button resets automatically
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshOrders();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const requestBill = useServerAction(guestRequestBillAction, {
    onSuccess: () => {
      toast.success("Hesap talebiniz garsona iletildi!");
      setRequestBillConfirmOpen(false);
      void refreshOrders();
    },
    onError: (m) => toast.error(m || "Hesap talebi iletilemedi"),
  });

  const bill = useMemo(
    () => computeBill(cart.cart.map(toBillLine)),
    [cart.cart],
  );
  const itemCount = cart.cart.reduce((s, l) => s + l.quantity, 0);

  const items = () =>
    cart.cart.map((l) => ({
      menuItemId: l.menuItemId,
      variantId: l.variantId ?? undefined,
      quantity: l.quantity,
      lineNote: l.lineNote ?? undefined,
      isComp: false,
      modifierIds: l.modifiers.map((m) => m.id),
    }));

  const place = useServerAction(guestPlaceOrderAction, {
    onSuccess: () => {
      setReviewOpen(false);
      cart.clear();
      clearGuestSession(storageKey);
      idempotencyKey.current = uuid();
      setPlaced(true);
      void refreshOrders();
      toast.success("Siparişiniz başarıyla mutfağa iletildi!");
    },
    onError: (m) => {
      toast.error(m || "Sipariş oluşturulurken bir hata oluştu");
    },
  });

  const registerCustomer = useServerAction(registerCustomerAction, {
    onSuccess: () => {
      setCustomerDrawerOpen(false);
      setRegisteredSuccess(true);
    },
    onError: (m) => toast.error(m || "Kayıt işlemi başarısız oldu"),
  });

  const submitOrder = () => {
    if (itemCount === 0) return;
    place.execute({
      username,
      tableId,
      idempotencyKey: idempotencyKey.current,
      items: items(),
    });
  };

  const onQuickAdd = (item: MenuItemDTO) => {
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setConfigItem(item);
      return;
    }
    cart.quickAdd(item);
  };

  const busy = place.isPending;

  // Order Placed Success Screen
  if (placed) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center p-5 text-center">
        <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2Icon className="size-10 stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Siparişiniz Alındı!
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            <span className="font-bold text-foreground">Masa No : {tableLabel}</span> için verdiğiniz sipariş mutfağa iletildi. Hazırlandığında servis personeli masanıza getirecektir.
          </p>

          <div className="mt-2 flex w-full max-w-xs flex-col gap-2.5">
            <Button
              className="h-12 w-full rounded-2xl font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 text-sm"
              onClick={() => {
                setPlaced(false);
                setOrdersOpen(true);
              }}
            >
              Siparişlerimi Takip Et
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full rounded-2xl font-bold border-border/80 text-sm hover:bg-muted"
              onClick={() => {
                cart.clear();
                clearGuestSession(storageKey);
                idempotencyKey.current = uuid();
                setPlaced(false);
              }}
            >
              Daha Fazla Sipariş Ver
            </Button>
          </div>

          {/* CUTE & ANIMATED BIRTHDAY / SPECIAL CAMPAIGNS CARD */}
          {!registeredSuccess ? (
            <div className="relative mt-6 flex w-full flex-col items-center overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-card p-6 text-center shadow-lg backdrop-blur-md">
              {/* Subtle background glow */}
              <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-amber-500/20 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full bg-orange-500/20 blur-2xl" />

              {/* Floating Cake Badge with Glow */}
              <div className="relative mb-3 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-orange-500/25 text-3xl shadow-md ring-4 ring-amber-500/10">
                <span>🎂</span>
                <span className="absolute -top-1 -right-1 text-sm">✨</span>
              </div>

              <h2 className="text-lg font-black tracking-tight text-foreground">
                Doğum Gününüze Özel Kampanyalar!
              </h2>

              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-xs">
                Doğum günlerinize özel sürpriz indirim ve kampanyalardan anında faydalanmak için numaranızı kaydedin!
              </p>

              {/* Shimmer Animated Button */}
              <button
                type="button"
                onClick={() => setCustomerDrawerOpen(true)}
                className="group relative mt-5 flex h-13 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] text-base font-black text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {/* Continuous Shimmer Streak */}
                <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent" />

                <span className="relative flex items-center gap-2 drop-shadow-xs">
                  <span className="text-lg group-hover:rotate-12 transition-transform">🎁</span>
                  <span>Numaramı Kaydet</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="mt-6 flex w-full flex-col items-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center shadow-xs">
              <span className="text-3xl mb-1.5">🎉</span>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-300">
                Kaydınız Başarıyla Alındı!
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Doğum gününüzde ve özel fırsatlarda sürpriz hediyeleriniz sizi bekliyor!
              </p>
            </div>
          )}
        </div>

        {/* CUSTOMER REGISTRATION BOTTOM SHEET DRAWER */}
        <Sheet open={customerDrawerOpen} onOpenChange={setCustomerDrawerOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto px-6 py-6 border-t border-border/80">
            <div className="mx-auto max-w-sm flex flex-col gap-5">
              <div className="flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-3xl mb-2 shadow-inner">
                  🎂
                </div>
                <SheetTitle className="text-xl font-black text-foreground">
                  Fırsatlardan Yararlanın
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Doğum gününüze özel sürpriz ikramlar ve avantajlı menüler için bilgilerinizi kaydedin.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!customerName.trim() || !customerPhone.trim()) {
                    toast.error("Lütfen adınızı ve telefon numaranızı girin");
                    return;
                  }
                  registerCustomer.execute({
                    username,
                    name: customerName.trim(),
                    phone: customerPhone.trim(),
                    birthDate: customerBirthDate || null,
                  });
                }}
                className="flex flex-col gap-4"
              >
                <Field>
                  <FieldLabel htmlFor="cust-name">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <UserIcon className="size-3.5 text-primary" />
                      Adınız Soyadınız
                    </span>
                  </FieldLabel>
                  <Input
                    id="cust-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    required
                    className="h-12 rounded-xl text-sm border-border/80 bg-muted/20"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="cust-phone">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <PhoneIcon className="size-3.5 text-primary" />
                      Telefon Numaranız
                    </span>
                  </FieldLabel>
                  <Input
                    id="cust-phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0555 123 45 67"
                    required
                    className="h-12 rounded-xl text-sm border-border/80 bg-muted/20"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="cust-birth">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <CalendarIcon className="size-3.5 text-primary" />
                      Doğum Tarihiniz (İsteğe Bağlı)
                    </span>
                  </FieldLabel>
                  <Input
                    id="cust-birth"
                    type="date"
                    value={customerBirthDate}
                    onChange={(e) => setCustomerBirthDate(e.target.value)}
                    className="h-12 rounded-xl text-sm border-border/80 bg-muted/20"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={registerCustomer.isPending}
                  className="group relative mt-2 flex h-13 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] text-base font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  <span className="relative flex items-center gap-2">
                    <span>{registerCustomer.isPending ? "Kaydediliyor…" : "🎁 Fırsatları Yakala ve Kaydet"}</span>
                  </span>
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        {/* CELEBRATION MODAL */}
        <Dialog open={registeredSuccess && !customerDrawerOpen} onOpenChange={setRegisteredSuccess}>
          <DialogContent className="max-w-xs rounded-3xl p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-amber-500/20 text-3xl">
                🎉
              </div>
              <DialogTitle className="text-lg font-black text-foreground">
                Teşekkürler!
              </DialogTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bilgileriniz kaydedildi. Doğum gününüzde ve özel kampanyalarda sürpriz indirimler sizi bekliyor!
              </p>
              <Button
                className="mt-2 w-full rounded-xl font-bold cursor-pointer"
                onClick={() => setRegisteredSuccess(false)}
              >
                Tamam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (qrMenuTheme === "QSR_FASTFOOD") {
    return (
      <Theme2QsrView
        restaurantName={restaurantName}
        logoUrl={logoUrl}
        tableLabel={tableLabel}
        menu={menu}
        primaryColor={qrPrimaryColor}
        secondaryColor={qrSecondaryColor}
        slidersEnabled={qrSlidersEnabled}
        sliders={qrSliders}
        cartItems={cart.cart}
        cartItemCount={itemCount}
        cartGrandTotal={bill.grandTotal}
        onQuickAdd={onQuickAdd}
        onAddCustomLine={(line) => {
          const variant = line.variantId ? line.item.variants.find((v) => v.id === line.variantId) : null;
          cart.addLine({
            key: newLineKey(),
            menuItemId: line.item.id,
            name: line.item.name,
            variantId: variant?.id ?? null,
            variantName: variant?.name ?? null,
            unitPrice: variant ? variant.price : line.item.price,
            taxRate: line.item.tax.rate,
            taxInclusive: line.item.tax.inclusive,
            modifiers: (line.modifierItems ?? []).map((m) => ({
              id: m.optionId,
              name: m.optionName,
              priceDelta: m.price,
            })),
            quantity: line.quantity,
            lineNote: line.notes ?? null,
            isComp: false,
          });
        }}
        onUpdateQuantity={(key, qty) => {
          const existing = cart.cart.find((c) => c.key === key);
          if (existing) {
            cart.changeQty(key, qty - existing.quantity);
          }
        }}
        onRemoveLine={cart.removeLine}
        onClearCart={cart.clear}
        onPlaceOrder={async () => {
          submitOrder();
        }}
        onRequestBill={async () => {
          await requestBill.execute({ username, tableId });
        }}
        myOrders={myOrders}
        busy={busy}
      />
    );
  }

  return (
    <div className={cn(
      "mx-auto flex min-h-svh w-full max-w-md flex-col p-4 pb-32 transition-colors",
      qrMenuTheme === "ELEGANT_DARK" && "bg-zinc-950 text-zinc-100",
    )}>
      {/* Lively & Themed Top Banner with Square Logo */}
      <div
        className={cn(
          "relative mb-4 overflow-hidden rounded-3xl border p-4 shadow-sm backdrop-blur-md transition-all",
          qrMenuTheme === "ELEGANT_DARK"
            ? "border-amber-500/30 bg-zinc-900/90 text-zinc-100 shadow-amber-500/5"
            : qrMenuTheme === "QSR_FASTFOOD"
              ? "border-zinc-200/80 bg-white text-zinc-900 shadow-xs"
              : qrMenuTheme === "VISUAL_GRID"
                ? "border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-card to-card"
                : qrMenuTheme === "MINIMAL_LIST"
                  ? "border-border/80 bg-card"
                  : "border-primary/20 bg-gradient-to-br from-primary/10 via-amber-500/5 to-card",
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <div
                className={cn(
                  "relative size-12 shrink-0 aspect-square overflow-hidden rounded-2xl border p-0.5 shadow-md",
                  qrMenuTheme === "ELEGANT_DARK" ? "border-amber-500/40 bg-zinc-900" : qrMenuTheme === "QSR_FASTFOOD" ? "border-red-500/30 bg-white shadow-xs" : "border-primary/20 bg-card",
                )}
              >
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  fill
                  className="object-cover rounded-xl"
                  sizes="48px"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md",
                  qrMenuTheme === "ELEGANT_DARK"
                    ? "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100"
                    : qrMenuTheme === "QSR_FASTFOOD"
                      ? "bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-red-500/20"
                      : "bg-gradient-to-br from-amber-500 to-primary",
                )}
              >
                <UtensilsCrossedIcon className="size-6 stroke-[2.2]" />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-lg font-black tracking-tight text-foreground">
                {restaurantName}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-2xs",
                    qrMenuTheme === "ELEGANT_DARK"
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                      : qrMenuTheme === "QSR_FASTFOOD"
                        ? "border-red-500/30 bg-red-500/10 text-red-600 font-extrabold"
                        : "border-primary/30 bg-primary/15 text-primary",
                  )}
                >
                  <span>🍽️</span>
                  <span>Masa No : {tableLabel}</span>
                </span>
              </div>
            </div>
          </div>

          {myOrders.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-primary/30 bg-card/80 text-xs font-bold text-primary shadow-xs hover:bg-primary/10 shrink-0"
              onClick={() => setOrdersOpen(true)}
            >
              Siparişlerim ({myOrders.length})
            </Button>
          ) : null}
        </div>
      </div>

      <MenuBrowser
        menu={menu}
        onQuickAdd={onQuickAdd}
        onOpenDetail={setConfigItem}
        qrMenuTheme={qrMenuTheme}
      />

      {/* Floating Bottom Cart Pill */}
      {itemCount > 0 ? (
        qrMenuTheme === "QSR_FASTFOOD" ? (
          <div className="fixed bottom-5 right-5 z-40 animate-in zoom-in-75 duration-200">
            <button
              type="button"
              className="relative flex items-center justify-center size-14 rounded-full bg-[#FFBC0D] text-zinc-950 shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-amber-300 ring-4 ring-black/10"
              onClick={() => setReviewOpen(true)}
              aria-label="Sepeti İncele"
            >
              <ShoppingBagIcon className="size-6 stroke-[2.5]" />
              <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-black shadow-lg border-2 border-white">
                {itemCount}
              </span>
            </button>
          </div>
        ) : (
          <div className="fixed inset-x-0 bottom-4 z-30 px-3 sm:px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0.5rem)]">
            <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-foreground text-background p-3.5 shadow-2xl backdrop-blur-xl pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-transform active:scale-95 cursor-pointer select-none"
                onClick={() => setReviewOpen(true)}
              >
                <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/15 text-background font-bold">
                  <ShoppingBagIcon className="size-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-black shadow-md">
                    {itemCount}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium text-background/70 truncate">
                    Toplam ({itemCount} Ürün)
                  </span>
                  <span className="text-base font-black tracking-tight text-background tabular-nums whitespace-nowrap">
                    {bill.grandTotal.toFixed(0)} ₺
                  </span>
                </div>
              </button>

              <Button
                size="lg"
                className="h-11 shrink-0 rounded-xl px-4 sm:px-5 font-bold shadow-sm whitespace-nowrap transition-all active:scale-95 cursor-pointer bg-primary text-primary-foreground"
                disabled={busy}
                onClick={() => setReviewOpen(true)}
              >
                {busy ? "İletiliyor…" : "Sipariş Özeti →"}
              </Button>
            </div>
          </div>
        )
      ) : null}

      {configItem ? (
        <ItemConfigDialog
          item={configItem}
          onAdd={cart.addLine}
          onOpenChange={(open) => !open && setConfigItem(null)}
        />
      ) : null}

      {/* Review sheet (Sipariş Özeti) */}
      {reviewOpen ? (
        <Dialog open onOpenChange={setReviewOpen}>
          <DialogContent className="max-h-[90vh] w-[94vw] sm:max-w-md overflow-x-hidden overflow-y-auto rounded-3xl p-4 sm:p-5">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
              <DialogTitle className="text-lg font-black text-foreground">Sipariş Özeti</DialogTitle>
            </DialogHeader>

            {cart.cart.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Sepetiniz henüz boş.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60 overflow-x-hidden">
                {cart.cart.map((l) => (
                  <div key={l.key} className="flex flex-col gap-2 py-3.5 first:pt-1">
                    {/* Item title and line total */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground leading-snug break-words">
                          {l.name}
                        </p>
                        {l.variantName ? (
                          <p className="text-xs font-semibold text-primary mt-0.5">
                            {l.variantName}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-sm font-black text-foreground tabular-nums shrink-0 whitespace-nowrap">
                        {linePrice(l).toFixed(0)} ₺
                      </span>
                    </div>

                    {/* Selected Options / Modifiers as wrapping badge tags */}
                    {l.modifiers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {l.modifiers.map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground leading-tight max-w-full break-words"
                          >
                            {m.name}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {l.lineNote ? (
                      <p className="text-[11px] text-muted-foreground italic break-words mt-0.5">
                        Not: {l.lineNote}
                      </p>
                    ) : null}

                    {/* Quantity Selector and Remove Button */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 shrink-0">
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center rounded-md hover:bg-card active:scale-90 text-foreground transition-all"
                          onClick={() => cart.changeQty(l.key, -1)}
                        >
                          <MinusIcon className="size-3.5 stroke-[2.5]" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold tabular-nums">
                          {l.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center rounded-md hover:bg-card active:scale-90 text-foreground transition-all"
                          onClick={() => cart.changeQty(l.key, 1)}
                        >
                          <PlusIcon className="size-3.5 stroke-[2.5]" />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive flex size-7 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                        onClick={() => cart.removeLine(l.key)}
                        title="Ürünü Çıkar"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-dashed pt-4 mt-2">
              <span className="text-base font-bold text-foreground">Toplam Tutar</span>
              <span className="text-xl font-black text-foreground tabular-nums whitespace-nowrap">
                {bill.grandTotal.toFixed(2)} ₺
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                className="h-13 w-full rounded-2xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/25 text-base tracking-wide whitespace-nowrap transition-transform active:scale-[0.98] cursor-pointer"
                disabled={itemCount === 0 || busy}
                onClick={submitOrder}
              >
                {busy ? "İletiliyor…" : "Sipariş Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Your orders sheet */}
      <Sheet open={ordersOpen} onOpenChange={setOrdersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="font-black text-lg">Verdiğiniz Siparişler</SheetTitle>
          </SheetHeader>

          {myOrders.length === 0 ? (
            <p className="text-muted-foreground px-4 py-12 text-center text-sm">
              Henüz verilmiş bir siparişiniz bulunmuyor.
            </p>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="flex flex-col gap-3">
                {myOrders.map((o) => {
                  const st = orderStatus(o);
                  return (
                    <li key={o.id} className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold">
                          {o.tableLabel ?? `#${o.orderNumber}`}
                          <span className="text-muted-foreground font-normal text-xs">
                            {" "}· {formatTime(o.createdAt)}
                          </span>
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <ul className="mt-2 flex flex-col gap-0.5">
                        {o.lines.map((l, i) => (
                          <li
                            key={`${o.id}-${i}`}
                            className="text-muted-foreground flex justify-between gap-2 text-xs"
                          >
                            <span className="min-w-0 truncate">
                              <span className="tabular-nums font-bold">{l.quantity}×</span>{" "}
                              {l.name}
                              {l.variantName ? ` · ${l.variantName}` : ""}
                            </span>
                            {l.state === "SERVED" ? <span>Servis Edildi</span> : null}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                        <span className="font-medium text-muted-foreground">Tutar</span>
                        <span className="font-bold text-foreground tabular-nums">
                          {o.total.toFixed(2)} ₺
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Sticky Bottom "Hesap İste" Action Area */}
          {myOrders.length > 0 ? (
            <div className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur-md">
              {myOrders.some((o) => o.billRequestedAt !== null) ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-center text-xs font-bold text-amber-700 dark:text-amber-300 shadow-xs animate-pulse">
                  <span className="text-base">🧾</span>
                  <span>Hesap Talebiniz Alındı — Garson Masanıza Geliyor</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRequestBillConfirmOpen(true)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-sm font-black text-white shadow-md shadow-orange-500/25 transition-all duration-200 hover:scale-[1.01] active:scale-95 cursor-pointer"
                >
                  <span className="text-base">🧾</span>
                  <span>Hesap İste</span>
                </button>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* CUTE "HESAP İSTE" CONFIRMATION DIALOG */}
      {requestBillConfirmOpen ? (
        <Dialog open onOpenChange={(open) => !open && setRequestBillConfirmOpen(false)}>
          <DialogContent className="max-w-xs rounded-3xl p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl shadow-inner">
                🧾
              </div>
              <DialogTitle className="text-lg font-black text-foreground">
                Hesap İste
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Masa hesabınızın kapatılması için garsonumuza bildirim gönderilsin mi?
              </DialogDescription>
            </div>

            <DialogFooter className="mt-4 flex flex-row gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl font-bold cursor-pointer"
                onClick={() => setRequestBillConfirmOpen(false)}
                disabled={requestBill.isPending}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 cursor-pointer"
                onClick={() => requestBill.execute({ username, tableId })}
                disabled={requestBill.isPending}
              >
                {requestBill.isPending ? "İletiliyor…" : "🧾 Evet, İste"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
