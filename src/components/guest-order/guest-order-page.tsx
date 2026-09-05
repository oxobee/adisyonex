"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CakeIcon,
  CalendarIcon,
  CheckCircle2Icon,
  GiftIcon,
  MinusIcon,
  PhoneIcon,
  PlusIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  SparklesIcon,
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
  guestCallWaiterAction,
  checkGuestTableSessionAction,
} from "@/actions/guest-order.actions";
import { GuestAiAssistant } from "./guest-ai-assistant";
import { ItemConfigDialog } from "@/components/pos/item-config-dialog";
import { linePrice, toBillLine, type CartLine } from "@/components/pos/types";
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
  SheetDescription,
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
import type { QrHomeSection, QrSliderItem } from "@/services/restaurant-settings.service";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";
import type { GuestOrderSummaryDTO } from "@/types/order";

import { MenuBrowser } from "../waiter/menu-browser";
import { newLineKey } from "../pos/types";
import { Theme2QsrView } from "./theme2-qsr-view";
import { CustomerLoyaltyPanel } from "./customer-loyalty-panel";
import type { CustomerDTO } from "@/services/customer.service";

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
  tableSessionId = null,
  restaurantName,
  logoUrl,
  menu,
  initiallyVerified,
  verifiedPhoneMasked,
  verifiedExpiresAt,
  initialOrders,
  showItemImages = true,
  qrMenuTheme = "MODERN",
  qrPrimaryColor = "#FF5500",
  qrSecondaryColor = "#FFF7ED",
  qrSlidersEnabled = true,
  qrAiEnabled = true,
  qrSliders,
  qrGreetingTitle = "Bugün Ne Yemek İstersiniz?",
  qrGreetingSubtitle = "Hoş Geldiniz 👋",
  qrHomeSections,
  wifiSsid,
  wifiPassword,
}: {
  readonly username: string;
  readonly tableId: string;
  readonly tableLabel: string;
  readonly tableSessionId?: string | null;
  readonly restaurantName: string;
  readonly logoUrl?: string | null;
  readonly menu: MenuDTO;
  readonly initiallyVerified: boolean;
  readonly verifiedPhoneMasked: string | null;
  readonly verifiedExpiresAt: number | null;
  readonly initialOrders: readonly GuestOrderSummaryDTO[];
  readonly showItemImages?: boolean;
  readonly qrMenuTheme?: string;
  readonly qrPrimaryColor?: string;
  readonly secondaryColor?: string;
  readonly qrSecondaryColor?: string;
  readonly qrSlidersEnabled?: boolean;
  readonly qrAiEnabled?: boolean;
  readonly qrSliders?: readonly QrSliderItem[] | null;
  readonly qrGreetingTitle?: string | null;
  readonly qrGreetingSubtitle?: string | null;
  readonly qrHomeSections?: readonly QrHomeSection[] | null;
  readonly wifiSsid?: string | null;
  readonly wifiPassword?: string | null;
}) {
  const cart = useOrderCart();
  const [configItem, setConfigItem] = useState<MenuItemDTO | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [requestBillConfirmOpen, setRequestBillConfirmOpen] = useState(false);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [myOrders, setMyOrders] = useState<readonly GuestOrderSummaryDTO[]>(initialOrders);
  const [placed, setPlaced] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerDTO | null>(null);
  const [tableSessionClosed, setTableSessionClosed] = useState(false);

  // Customer Loyalty Registration State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBirthDate, setCustomerBirthDate] = useState("");

  const storageKey = useMemo(
    () => guestSessionKey(username, tableId),
    [username, tableId],
  );
  const idempotencyKey = useRef<string>(uuid());

  // Ensure device ID is permanently preserved on this physical device
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)adisyoon_device_id=([^;]*)/);
      const cookieDeviceId = match ? match[1] : null;
      const localDeviceId = localStorage.getItem("adisyoon_device_id");

      if (cookieDeviceId && !localDeviceId) {
        localStorage.setItem("adisyoon_device_id", cookieDeviceId);
      } else if (localDeviceId && !cookieDeviceId) {
        document.cookie = `adisyoon_device_id=${localDeviceId}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // Ignore
    }
  }, []);

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

  const refreshOrders = useCallback(async () => {
    // Skip polling if the browser tab/app is in background
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      // 1. Authoritative check: has the table session closed?
      if (tableSessionId && !tableSessionClosed) {
        const sessionCheck = await checkGuestTableSessionAction({
          username,
          tableId,
          tableSessionId,
        });
        if (sessionCheck?.success && sessionCheck.data?.isClosed) {
          setTableSessionClosed(true);
          cart.clear();
          clearGuestSession(storageKey);
          toast.info("Masa hesabınız kapatıldı. Masa oturumunuz sona erdi.");
          return;
        }
      }

      // 2. Fetch table orders
      const res = await guestMyOrdersAction({
        username,
        tableId,
        tableSessionId: tableSessionId ?? undefined,
      });

      if (!res?.success && (res?.error === "TABLE_SESSION_EXPIRED" || res?.error?.includes("oturum"))) {
        setTableSessionClosed(true);
        cart.clear();
        clearGuestSession(storageKey);
        toast.info("Masa hesabınız kapatıldı. Masa oturumunuz sona erdi.");
        return;
      }

      if (res?.success && res.data) {
        const newData = res.data;
        setMyOrders((prev) => {
          if (prev.length === newData.length) {
            const isSame = prev.every((pOrd, i) => {
              const nOrd = newData[i];
              if (
                pOrd.id !== nOrd.id ||
                pOrd.status !== nOrd.status ||
                pOrd.kitchenStatus !== nOrd.kitchenStatus ||
                pOrd.total !== nOrd.total ||
                (pOrd.lines?.length ?? 0) !== (nOrd.lines?.length ?? 0)
              ) {
                return false;
              }
              return true;
            });
            if (isSame) return prev; // Retain reference to prevent full page re-render
          }
          return newData;
        });
      }
    } catch {
      // Ignore background poll errors during deployments
    }
  }, [username, tableId, tableSessionId, tableSessionClosed, storageKey, cart]);

  // Visibility-aware poll so when cashier settles table, UI updates automatically without wasting background CPU/network
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        void refreshOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(() => {
      void refreshOrders();
    }, 4500);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshOrders]);

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

  // Group cart items by category for Tema 1 receipt view
  const categorizedCartTema1 = useMemo(() => {
    const catNameMap = new Map<string, string>();
    for (const cat of menu.categories) {
      catNameMap.set(cat.id, cat.name);
    }
    const itemToCategoryMap = new Map<string, string>();
    for (const item of menu.items) {
      itemToCategoryMap.set(item.id, catNameMap.get(item.categoryId) || "Diğer Lezzetler");
    }

    const groups: { categoryName: string; lines: CartLine[] }[] = [];
    const groupMap = new Map<string, CartLine[]>();

    for (const line of cart.cart) {
      const catName = itemToCategoryMap.get(line.menuItemId) || "Diğer Lezzetler";
      if (!groupMap.has(catName)) {
        groupMap.set(catName, []);
        groups.push({ categoryName: catName, lines: groupMap.get(catName)! });
      }
      groupMap.get(catName)!.push(line);
    }

    return groups;
  }, [cart.cart, menu.categories, menu.items]);

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
      setPlaced(false);
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

  // Restore logged in customer from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`adisyoon_customer_${username}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id) {
          setCurrentCustomer({
            id: parsed.id,
            name: parsed.name || "",
            phone: parsed.phone || "",
            birthDate: null,
            birthDay: null,
            birthMonth: null,
            birthYear: null,
            orderCount: 0,
            totalSpent: 0,
            source: "QR_MENU",
            kvkkConsent: true,
            kvkkAcceptedAt: null,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignore JSON errors
    }
  }, [username]);

  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);

  const submitOrder = async (): Promise<boolean> => {
    if (tableSessionClosed) {
      toast.error("Masa hesabınız kapatılmıştır. Yeni sipariş verilemez.");
      return false;
    }
    if (itemCount === 0 || isOrderSubmitting) return false;
    setIsOrderSubmitting(true);
    let activeCustId = currentCustomer?.id ?? null;
    if (!activeCustId) {
      try {
        const saved = localStorage.getItem(`adisyoon_customer_${username}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id) activeCustId = parsed.id;
        }
      } catch {
        // Ignore JSON errors
      }
    }

    try {
      const res = await guestPlaceOrderAction({
        username,
        tableId,
        tableSessionId: tableSessionId ?? undefined,
        idempotencyKey: idempotencyKey.current,
        customerId: activeCustId,
        items: items(),
      });

      if (res.success) {
        setReviewOpen(false);
        cart.clear();
        clearGuestSession(storageKey);
        idempotencyKey.current = uuid();
        setPlaced(false);
        void refreshOrders();
        toast.success("Siparişiniz başarıyla mutfağa iletildi!");
        return true;
      } else {
        if (res.error === "TABLE_SESSION_EXPIRED" || res.error?.includes("oturum")) {
          setTableSessionClosed(true);
          cart.clear();
          clearGuestSession(storageKey);
          toast.error("Masa hesabı kapatılmıştır. Yeni sipariş verilemez.");
          return false;
        }
        toast.error(res.error || "Sipariş oluşturulurken bir hata oluştu");
        return false;
      }
    } catch {
      toast.error("Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
      return false;
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  const onQuickAdd = (item: MenuItemDTO) => {
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setConfigItem(item);
      return;
    }
    cart.quickAdd(item);
  };

  const handleAddCustomLine = (line: {
    item: MenuItemDTO;
    quantity: number;
    variantId?: string | null;
    modifierItems?: readonly { optionId: string; optionName: string; price: number }[];
    notes?: string;
  }) => {
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
  };

  const busy = isOrderSubmitting || place.isPending;


  if (qrMenuTheme === "QSR_FASTFOOD") {
    return (
      <Theme2QsrView
        username={username}
        restaurantName={restaurantName}
        logoUrl={logoUrl}
        tableLabel={tableLabel}
        menu={menu}
        showItemImages={showItemImages}
        primaryColor={qrPrimaryColor}
        secondaryColor={qrSecondaryColor}
        slidersEnabled={qrSlidersEnabled}
        sliders={qrSliders}
        greetingTitle={qrGreetingTitle}
        greetingSubtitle={qrGreetingSubtitle}
        homeSections={qrHomeSections}
        wifiSsid={wifiSsid}
        wifiPassword={wifiPassword}
        cartItems={cart.cart}
        cartItemCount={itemCount}
        cartGrandTotal={bill.grandTotal}
        onQuickAdd={onQuickAdd}
        onAddCustomLine={handleAddCustomLine}
        onUpdateQuantity={(key, qty) => {
          const existing = cart.cart.find((c) => c.key === key);
          if (existing) {
            cart.changeQty(key, qty - existing.quantity);
          }
        }}
        onRemoveLine={cart.removeLine}
        onClearCart={cart.clear}
        onPlaceOrder={async () => {
          return await submitOrder();
        }}
        onRequestBill={async () => {
          await requestBill.execute({ username, tableId });
        }}
        tableId={tableId}
        onCallWaiter={async () => {
          await guestCallWaiterAction({ username, tableId });
        }}
        myOrders={myOrders}
        busy={busy}
        onCustomerIdentified={(c) => setCurrentCustomer(c)}
        tableSessionClosed={tableSessionClosed}
        qrAiEnabled={qrAiEnabled}
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
                {tableSessionClosed ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-black text-amber-900 shadow-2xs">
                    <span>🔒</span>
                    <span>Masa Kapandı</span>
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-2xs",
                      qrMenuTheme === "ELEGANT_DARK"
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                        : "border-primary/30 bg-primary/15 text-primary",
                    )}
                  >
                    <span>🍽️</span>
                    <span>Masa No : {tableLabel}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setProfileSheetOpen(true)}
              className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95",
                qrMenuTheme === "ELEGANT_DARK"
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                  : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              <UserIcon className="size-3.5" />
              <span>Profilim</span>
            </button>

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

        {tableSessionClosed && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-950 text-xs font-medium space-y-1 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-black text-amber-900">
              <span className="text-sm">🔒</span>
              <span>Masa Hesabı Kapatıldı</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Masa hesabınız kapatılmış olup oturumunuz sona ermiştir. Yeni bir sipariş vermek için lütfen masadaki QR kodu tekrar okutun.
            </p>
          </div>
        )}
      </div>

      <MenuBrowser
        menu={menu}
        onQuickAdd={onQuickAdd}
        onOpenDetail={setConfigItem}
        qrMenuTheme={qrMenuTheme}
        showItemImages={showItemImages}
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
                className="h-11 shrink-0 rounded-xl px-4 sm:px-5 font-bold shadow-sm whitespace-nowrap transition-all active:scale-95 cursor-pointer bg-primary text-primary-foreground disabled:opacity-50"
                disabled={busy || tableSessionClosed}
                onClick={() => setReviewOpen(true)}
              >
                {tableSessionClosed ? "Masa Kapandı" : busy ? "İletiliyor…" : "Sipariş Özeti →"}
              </Button>
            </div>
          </div>
        )
      ) : null}

      {configItem ? (
        <ItemConfigDialog
          item={configItem}
          showItemImages={showItemImages}
          onAdd={cart.addLine}
          onOpenChange={(open) => !open && setConfigItem(null)}
        />
      ) : null}

      {/* Review sheet (Sipariş Özeti - Fiş Stili) */}
      {reviewOpen ? (
        <Dialog open onOpenChange={setReviewOpen}>
          <DialogContent className="max-h-[90vh] w-[94vw] sm:max-w-md overflow-x-hidden overflow-y-auto rounded-3xl p-4 sm:p-5 space-y-3">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-2.5">
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                <ReceiptIcon className="size-4.5 text-primary" />
                <span>Sipariş Onayı</span>
              </DialogTitle>
            </DialogHeader>

            {cart.cart.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Sepetiniz henüz boş.
              </p>
            ) : (
              <div className="rounded-2xl bg-muted/30 border border-border/80 p-3.5 space-y-3">
                {/* Receipt Header */}
                <div className="text-center space-y-0.5 border-b border-dashed border-border/80 pb-2">
                  <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                    {restaurantName}
                  </h4>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium">
                    <span className="font-bold text-foreground">🍽️ Masa: {tableLabel}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {/* Categorized Order Items */}
                <div className="max-h-60 overflow-y-auto divide-y divide-border/60 pr-1 space-y-2">
                  {categorizedCartTema1.map((catGroup, cIdx) => (
                    <div key={cIdx} className="pt-2.5 first:pt-0 space-y-2">
                      {/* Category Header */}
                      <div className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                        <span>▪</span>
                        <span>{catGroup.categoryName}</span>
                      </div>

                      {/* Items in this category */}
                      <div className="space-y-2">
                        {catGroup.lines.map((l) => (
                          <div key={l.key} className="space-y-1 bg-background/60 p-2 rounded-xl border border-border/40">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground leading-snug">
                                  {l.name}
                                </p>
                                {l.variantName && (
                                  <p className="text-[11px] font-semibold text-primary">
                                    ↳ {l.variantName}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-mono font-black text-foreground tabular-nums shrink-0">
                                {linePrice(l).toFixed(0)} ₺
                              </span>
                            </div>

                            {/* Modifiers */}
                            {l.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {l.modifiers.map((m, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                  >
                                    + {m.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {l.lineNote && (
                              <p className="text-[10px] text-muted-foreground italic">
                                &ldquo;{l.lineNote}&rdquo;
                              </p>
                            )}

                            {/* Quantity Selector and Remove Button */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 shrink-0">
                                <button
                                  type="button"
                                  className="flex size-6 items-center justify-center rounded-md hover:bg-card active:scale-90 text-foreground transition-all cursor-pointer"
                                  onClick={() => cart.changeQty(l.key, -1)}
                                >
                                  <MinusIcon className="size-3 stroke-[2.5]" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold tabular-nums">
                                  {l.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="flex size-6 items-center justify-center rounded-md hover:bg-card active:scale-90 text-foreground transition-all cursor-pointer"
                                  onClick={() => cart.changeQty(l.key, 1)}
                                >
                                  <PlusIcon className="size-3 stroke-[2.5]" />
                                </button>
                              </div>

                              <button
                                type="button"
                                className="text-muted-foreground hover:text-destructive flex size-6 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                                onClick={() => cart.removeLine(l.key)}
                                title="Ürünü Çıkar"
                              >
                                <Trash2Icon className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Receipt Summary */}
                <div className="border-t border-dashed border-border/80 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Toplam Kalem</span>
                    <span>{itemCount} Adet</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>KDV</span>
                    <span>Dahil</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/80 pt-2 font-black text-sm">
                    <span className="text-foreground">Toplam Tutar</span>
                    <span className="text-base font-mono font-black text-primary tabular-nums">
                      {bill.grandTotal.toFixed(2)} ₺
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-1">
              <Button
                className="h-12 w-full rounded-2xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/25 text-sm tracking-wide whitespace-nowrap transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50"
                disabled={itemCount === 0 || busy || tableSessionClosed}
                onClick={submitOrder}
              >
                {tableSessionClosed ? "Masa Hesabı Kapandı" : busy ? "İletiliyor…" : "Sipariş Oluştur"}
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

      {/* CUSTOMER LOYALTY & PROFILE SHEET (TEMA 1 & GENEL) */}
      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] rounded-t-3xl p-0 overflow-hidden flex flex-col bg-white"
        >
          <SheetHeader className="p-4 pb-3 border-b text-left bg-zinc-50 flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-base font-black text-zinc-900 flex items-center gap-2">
                <UserIcon className="size-4.5 text-primary" />
                <span>Müşteri Profili & Masa</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400 font-medium">
                Masa servisleri, sadakat kulübü ve sipariş geçmişiniz
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => setProfileSheetOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
            >
              <span className="text-lg leading-none">✕</span>
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <CustomerLoyaltyPanel
              username={username}
              restaurantName={restaurantName}
              logoUrl={logoUrl}
              tableId={tableId}
              tableLabel={tableLabel}
              primaryColor={qrPrimaryColor || "#FF5500"}
              secondaryColor={qrSecondaryColor || "#FFF7ED"}
              wifiSsid={wifiSsid}
              wifiPassword={wifiPassword}
              activeOrders={myOrders}
              onRequestBill={async () => {
                await requestBill.execute({ username, tableId });
              }}
              onCallWaiter={async () => {
                await guestCallWaiterAction({ username, tableId });
              }}
              onCustomerIdentified={(c) => setCurrentCustomer(c)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* GUEST AI ASSISTANT (Yapay Zeka Menü Danışmanı) */}
      <GuestAiAssistant
        username={username}
        tableId={tableId}
        restaurantName={restaurantName}
        primaryColor={qrPrimaryColor}
        secondaryColor={qrSecondaryColor}
        menu={menu}
        onQuickAdd={onQuickAdd}
        onAddCustomLine={handleAddCustomLine}
        enabled={qrAiEnabled !== false}
      />
    </div>
  );
}
