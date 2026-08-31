"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  guestLogoutAction,
  guestMyOrdersAction,
  guestPlaceOrderAction,
  guestRequestOtpAction,
  guestVerifyOtpAction,
} from "@/actions/guest-order.actions";
import { PhoneInput } from "@/components/phone-input";
import { ItemConfigDialog } from "@/components/pos/item-config-dialog";
import { linePrice, toBillLine } from "@/components/pos/types";
import { useOrderCart } from "@/components/pos/use-order-cart";
import { MenuBrowser } from "@/components/waiter/menu-browser";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useServerAction } from "@/hooks/use-server-action";
import { computeBill } from "@/services/billing";
import { formatTime, maskPhone } from "@/lib/format";
import {
  clearGuestSession,
  guestSessionKey,
  readGuestSession,
  writeGuestSession,
} from "@/lib/guest-cart-storage";
import { uuid } from "@/lib/uuid";
import { phoneSchema } from "@/lib/validators/shared";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";
import type { GuestOrderSummaryDTO } from "@/types/order";

const ERRORS: Record<string, string> = {
  GUEST_OTP_RATE_LIMITED: "Lütfen yeni bir kod istemeden önce biraz bekleyin.",
  GUEST_OTP_EXPIRED: "Doğrulama kodunun süresi doldu — yeni bir kod isteyin.",
  GUEST_OTP_INVALID: "Hatalı kod girdiniz. Tekrar deneyin.",
  GUEST_OTP_TOO_MANY_ATTEMPTS: "Çok fazla hatalı deneme. Yeni bir kod isteyin.",
  GUEST_NOT_VERIFIED: "Lütfen önce telefon numaranızı doğrulayın.",
  GUEST_ORDER_DISABLED: "Sipariş alımı şu anda kapalıdır.",
  GUEST_ORDER_TABLE_INVALID: "Bu masa bağlantısı geçersiz. Lütfen garsonunuza danışın.",
  ITEM_UNAVAILABLE: "Sepetinizdeki bir ürünün stoğu tükendi. Lütfen sepetinizi kontrol edin.",
};
const toMessage = (m: string) => ERRORS[m] ?? m;

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/** Guest-facing status label + colour for one of their orders. */
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
  menu,
  initiallyVerified,
  verifiedPhoneMasked,
  verifiedExpiresAt,
  initialOrders,
}: {
  readonly username: string;
  readonly tableId: string;
  readonly tableLabel: string;
  readonly restaurantName: string;
  readonly menu: MenuDTO;
  readonly initiallyVerified: boolean;
  readonly verifiedPhoneMasked: string | null;
  readonly verifiedExpiresAt: number | null;
  readonly initialOrders: readonly GuestOrderSummaryDTO[];
}) {
  const cart = useOrderCart();
  const [configItem, setConfigItem] = useState<MenuItemDTO | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verified, setVerified] = useState(initiallyVerified);
  const [expiresAt, setExpiresAt] = useState<number | null>(verifiedExpiresAt);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [myOrders, setMyOrders] =
    useState<readonly GuestOrderSummaryDTO[]>(initialOrders);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const idempotencyKey = useRef(uuid());

  const storageKey = guestSessionKey(username, tableId);
  const { replaceAll } = cart;
  const restoredRef = useRef(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const saved = readGuestSession(storageKey);
      if (saved) {
        if (saved.lines.length > 0) {
          replaceAll(saved.lines);
        }
        if (saved.verified) {
          setVerified(true);
          if (saved.expiresAt) {
            setExpiresAt(saved.expiresAt);
          }
        }
      }
      restoredRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, [storageKey, replaceAll]);

  useEffect(() => {
    if (!restoredRef.current) {
      return;
    }
    writeGuestSession(storageKey, { lines: cart.cart, verified, expiresAt });
  }, [storageKey, cart.cart, verified, expiresAt]);

  const refreshOrders = useCallback(async () => {
    const res = await guestMyOrdersAction();
    if (res.success) {
      setMyOrders(res.data ?? []);
    }
  }, []);

  useEffect(() => {
    if (!verified) {
      return;
    }
    const id = setInterval(() => {
      void refreshOrders();
    }, 10000);
    return () => clearInterval(id);
  }, [verified, refreshOrders]);

  const logout = (expired = false) => {
    void guestLogoutAction();
    clearGuestSession(storageKey);
    cart.clear();
    setVerified(false);
    setExpiresAt(null);
    setMyOrders([]);
    setOrdersOpen(false);
    setOtpSent(false);
    setCode("");
    toast(expired ? "Oturum süresi doldu — sipariş için tekrar doğrulayın" : "Çıkış yapıldı");
  };

  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  });

  useEffect(() => {
    if (!verified || expiresAt === null) {
      return;
    }
    const id = setTimeout(
      () => logoutRef.current(true),
      Math.max(0, expiresAt - Date.now()),
    );
    return () => clearTimeout(id);
  }, [verified, expiresAt]);

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
      setVerifyOpen(false);
      cart.clear();
      idempotencyKey.current = uuid();
      setPlaced(true);
      void refreshOrders();
    },
    onError: (m) => {
      if (m === "GUEST_NOT_VERIFIED") {
        setVerified(false);
        setOtpSent(false);
        setVerifyOpen(true);
      }
      toast.error(toMessage(m));
    },
  });

  const submitOrder = () => {
    if (itemCount === 0) {
      return;
    }
    place.execute({
      username,
      tableId,
      idempotencyKey: idempotencyKey.current,
      items: items(),
    });
  };

  const sendCode = useServerAction(guestRequestOtpAction, {
    onSuccess: () => {
      setOtpSent(true);
      toast.success("Doğrulama kodu gönderildi");
    },
    onError: (m) => toast.error(toMessage(m)),
  });

  const verify = useServerAction(guestVerifyOtpAction, {
    onSuccess: () => {
      setVerified(true);
      setExpiresAt(Date.now() + TWO_HOURS_MS);
      void refreshOrders();
      submitOrder();
    },
    onError: (m) => toast.error(toMessage(m)),
  });

  const onPlaceTap = () => {
    if (verified) {
      submitOrder();
      return;
    }
    setReviewOpen(false);
    setVerifyOpen(true);
  };

  const phoneValid = phoneSchema.safeParse(phone).success;
  const codeValid = /^\d{6}$/.test(code);
  const busy = place.isPending || verify.isPending;

  const onQuickAdd = (item: MenuItemDTO) => {
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setConfigItem(item);
      return;
    }
    cart.quickAdd(item);
  };

  if (placed) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full text-3xl">
          ✓
        </div>
        <h1 className="text-xl font-semibold">Siparişiniz Alındı!</h1>
        <p className="text-muted-foreground text-sm">
          <span className="font-medium">{tableLabel}</span> için verdiğiniz sipariş mutfağa iletildi.
          Hazırlandığında servis personeli masanıza getirecektir.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button
            onClick={() => {
              setPlaced(false);
              setOrdersOpen(true);
            }}
          >
            Siparişlerimi Takip Et
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              cart.clear();
              idempotencyKey.current = uuid();
              setPlaced(false);
            }}
          >
            Daha Fazla Sipariş Ver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col p-4 pb-32">
      {/* Sleek Top Banner */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 p-3.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl font-bold">
            <UtensilsCrossedIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-foreground truncate">
              {restaurantName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                Masa {tableLabel}
              </span>
              {verified ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Doğrulandı
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {verified ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {myOrders.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs font-semibold"
                onClick={() => setOrdersOpen(true)}
              >
                Siparişler ({myOrders.length})
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => logout(false)}
            >
              Çıkış
            </Button>
          </div>
        ) : null}
      </div>

      <MenuBrowser menu={menu} onQuickAdd={onQuickAdd} onOpenDetail={setConfigItem} />

      {/* Floating Bottom Cart Pill */}
      {itemCount > 0 ? (
        <div className="fixed inset-x-0 bottom-4 z-30 px-4 pointer-events-none">
          <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-foreground text-background p-3.5 shadow-2xl backdrop-blur-xl pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
            <button
              type="button"
              className="flex items-center gap-3 text-left transition-transform active:scale-95 cursor-pointer select-none"
              onClick={() => setReviewOpen(true)}
            >
              <div className="relative flex size-10 items-center justify-center rounded-xl bg-background/15 text-background font-bold">
                <ShoppingBagIcon className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-black shadow-md">
                  {itemCount}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-background/70">
                  Toplam ({itemCount} Ürün)
                </span>
                <span className="text-base font-black tracking-tight text-background tabular-nums">
                  {bill.grandTotal.toFixed(0)} ₺
                </span>
              </div>
            </button>

            <Button
              size="lg"
              className="h-11 rounded-xl px-5 font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              disabled={busy}
              onClick={onPlaceTap}
            >
              {busy ? "İletiliyor…" : "Siparişi Ver →"}
            </Button>
          </div>
        </div>
      ) : null}

      {configItem ? (
        <ItemConfigDialog
          item={configItem}
          onAdd={cart.addLine}
          onOpenChange={(open) => !open && setConfigItem(null)}
        />
      ) : null}

      {/* Review sheet */}
      {reviewOpen ? (
        <Dialog open onOpenChange={setReviewOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sipariş Özeti</DialogTitle>
            </DialogHeader>
            {cart.cart.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Sepetiniz henüz boş.
              </p>
            ) : (
              <ul className="divide-y">
                {cart.cart.map((l) => (
                  <li key={l.key} className="flex items-start gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {l.name}
                        {l.variantName ? ` · ${l.variantName}` : ""}
                      </p>
                      {l.modifiers.length > 0 || l.lineNote ? (
                        <p className="text-muted-foreground truncate text-xs">
                          {[
                            l.modifiers.map((m) => m.name).join(", "),
                            l.lineNote,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => cart.changeQty(l.key, -1)}
                        >
                          <MinusIcon className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {l.quantity}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => cart.changeQty(l.key, 1)}
                        >
                          <PlusIcon className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground ml-auto size-7"
                          onClick={() => cart.removeLine(l.key)}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums font-medium">
                      {linePrice(l).toFixed(0)} ₺
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">Toplam Tutar</span>
              <span className="text-base font-semibold tabular-nums">
                {bill.grandTotal.toFixed(2)} ₺
              </span>
            </div>
            <DialogFooter>
              <Button
                className="h-12 w-full text-base"
                disabled={itemCount === 0 || busy}
                onClick={onPlaceTap}
              >
                {busy ? "İletiliyor…" : verified ? "Siparişi Onayla ve Gönder" : "Numaranı Doğrula & Gönder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Phone verification */}
      {verifyOpen ? (
        <Dialog open onOpenChange={(o) => !busy && setVerifyOpen(o)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Telefon Numaranızı Doğrulayın</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Siparişinizi teyit etmek için telefonunuza tek seferlik SMS kodu göndereceğiz.
            </p>
            <div className="flex flex-col gap-3">
              <PhoneInput onChange={setPhone} disabled={otpSent || busy} />
              {otpSent ? (
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6 haneli kod"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-11 text-center text-lg tracking-widest"
                />
              ) : null}
            </div>
            <DialogFooter>
              {otpSent ? (
                <Button
                  className="h-12 w-full text-base"
                  disabled={!codeValid || busy}
                  onClick={() =>
                    verify.execute({ username, tableId, phone, code })
                  }
                >
                  {busy ? "İletiliyor…" : "Doğrula ve Siparişi Ver"}
                </Button>
              ) : (
                <Button
                  className="h-12 w-full text-base"
                  disabled={!phoneValid || sendCode.isPending}
                  onClick={() =>
                    sendCode.execute({ username, tableId, phone })
                  }
                >
                  {sendCode.isPending ? "Gönderiliyor…" : "Doğrulama Kodu Gönder"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Your orders */}
      <Sheet open={ordersOpen} onOpenChange={setOrdersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Verdiğiniz Siparişler</SheetTitle>
          </SheetHeader>
          {myOrders.length === 0 ? (
            <p className="text-muted-foreground px-4 pb-6 text-sm">
              Henüz verilmiş bir siparişiniz bulunmuyor.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 px-4 pb-6">
              {myOrders.map((o) => {
                const st = orderStatus(o);
                return (
                  <li key={o.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {o.tableLabel ?? `#${o.orderNumber}`}
                        <span className="text-muted-foreground font-normal">
                          {" "}· {formatTime(o.createdAt)}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${st.className}`}
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
                            <span className="tabular-nums">{l.quantity}×</span>{" "}
                            {l.name}
                            {l.variantName ? ` · ${l.variantName}` : ""}
                          </span>
                          {l.state === "SERVED" ? <span>Servis Edildi</span> : null}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-between border-t pt-2 text-sm">
                      <span>
                        {o.itemCount} adet ürün
                      </span>
                      <span className="font-semibold tabular-nums">
                        {o.total.toFixed(2)} ₺
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
