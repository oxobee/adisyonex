"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MinusIcon,
  PlusCircleIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  ShoppingBagIcon,
  Trash2Icon,
  UtensilsIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { addItemsAction, createOrderAction } from "@/actions/order.actions";
import { ItemConfigDialog } from "@/components/pos/item-config-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOrderCart } from "@/components/pos/use-order-cart";
import { useServerAction } from "@/hooks/use-server-action";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";
import type { OrderDTO } from "@/types/order";
import type { TableDTO } from "@/types/table";

const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export function TablePosModal({
  table,
  orders,
  menu,
  open,
  onOpenChange,
  onAdded,
}: {
  table: TableDTO | null;
  orders: readonly OrderDTO[];
  menu: MenuDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const router = useRouter();
  const cart = useOrderCart();
  const [activeCategoryId, setActiveCategoryId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [configItem, setConfigItem] = useState<MenuItemDTO | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === "OPEN"),
    [orders],
  );
  const primaryOrder = activeOrders.length > 0 ? activeOrders[0] : null;
  const isOccupied = activeOrders.length > 0;

  // Categories list
  const categories = useMemo(() => menu?.categories ?? [], [menu]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    if (!menu) return [];
    let items = menu.items;
    if (activeCategoryId !== "ALL") {
      items = items.filter((i) => i.categoryId === activeCategoryId);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.shortDescription && i.shortDescription.toLowerCase().includes(q)),
      );
    }
    return items.filter((i) => i.available && i.isActive);
  }, [menu, activeCategoryId, search]);

  // Existing items on the table
  const existingLines = useMemo(() => {
    const lines: { name: string; qty: number; price: number; variant?: string | null }[] = [];
    for (const ord of activeOrders) {
      for (const l of ord.lines) {
        if (l.state === "VOID") continue;
        lines.push({
          name: l.name,
          qty: l.quantity,
          price: Number(l.unitPrice) * l.quantity,
          variant: l.variantName,
        });
      }
    }
    return lines;
  }, [activeOrders]);

  const existingTotal = useMemo(
    () => existingLines.reduce((s, l) => s + l.price, 0),
    [existingLines],
  );

  const newItemsTotal = useMemo(() => {
    return round2(
      cart.cart.reduce((sum, line) => {
        const item = menu?.items.find((i) => i.id === line.menuItemId);
        if (!item) return sum;
        const variantPrice = line.variantId
          ? item.variants.find((v) => v.id === line.variantId)?.price ?? item.price
          : item.price;
        const modsPrice = line.modifiers.reduce((s, m) => s + m.priceDelta, 0);
        return sum + (Number(variantPrice) + modsPrice) * line.quantity;
      }, 0),
    );
  }, [cart.cart, menu]);

  const addItems = useServerAction(addItemsAction, {
    onSuccess: () => {
      toast.success(`${table?.label} masasına yeni ürünler eklendi!`);
      cart.clear();
      onOpenChange(false);
      onAdded();
      router.refresh();
    },
    onError: (err) => toast.error(err || "Ürünler eklenemedi."),
  });

  const createOrder = useServerAction(createOrderAction, {
    onSuccess: () => {
      toast.success(`${table?.label} masasına sipariş açıldı ve ürünler eklendi!`);
      cart.clear();
      onOpenChange(false);
      onAdded();
      router.refresh();
    },
    onError: (err) => toast.error(err || "Sipariş oluşturulamadı."),
  });

  const handleTapItem = (item: MenuItemDTO) => {
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setConfigItem(item);
      return;
    }
    cart.quickAdd(item);
    toast.success(`${item.name} eklendi`, { duration: 1500 });
  };

  const handleSubmit = () => {
    if (!table || cart.cart.length === 0) return;

    const payloadItems = cart.cart.map((l) => ({
      menuItemId: l.menuItemId,
      variantId: l.variantId ?? undefined,
      quantity: l.quantity,
      lineNote: l.lineNote ?? undefined,
      isComp: l.isComp,
      modifierIds: l.modifiers.map((m) => m.id),
    }));

    if (primaryOrder) {
      // Add items to existing table order
      addItems.execute({
        orderId: primaryOrder.id,
        items: payloadItems,
      });
    } else {
      // Create fresh new order for this table
      createOrder.execute({
        orderType: "DINE_IN",
        tableId: table.id,
        tableLabel: table.label,
        idempotencyKey: `pos-${table.id}-${Date.now()}`,
        items: payloadItems,
      });
    }
  };

  const isPending = addItems.isPending || createOrder.isPending;

  if (!table) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl w-[96vw] max-h-[92vh] h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
          {/* Top Modal Header */}
          <div className="flex items-center justify-between border-b border-border/80 px-6 py-3.5 bg-muted/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <PlusCircleIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <span>{table.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                      isOccupied
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                    )}
                  >
                    {isOccupied ? `Dolu (${activeOrders.length} Sipariş)` : "Masa Boş"}
                  </span>
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Masaya eklenecek ürünleri seçin ve siparişi kaydedin.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          {/* Main 2-Column Split: Menu Selector + Cart / Existing Items */}
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_340px] overflow-hidden">
            {/* LEFT COLUMN: Menu Search & Items Grid */}
            <div className="flex min-h-0 flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-border/70 p-4">
              {/* Category Pills & Search */}
              <div className="flex flex-col gap-3 shrink-0 pb-3 border-b border-border/60">
                <div className="relative">
                  <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Menüde ürün ara (örn. Burger, Kola, Çorba)..."
                    className="h-10 rounded-xl pl-9 text-xs"
                  />
                </div>

                {/* Categories Horizontal Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId("ALL")}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                      activeCategoryId === "ALL"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Tümü ({menu?.items.length ?? 0})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                        activeCategoryId === cat.id
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {cat.name} ({menu?.items.filter((i) => i.categoryId === cat.id).length ?? 0})
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto pt-3">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <UtensilsIcon className="size-8 opacity-40 mb-2" />
                    <p className="text-xs font-medium">Bu kategoride ürün bulunamadı.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {filteredItems.map((item) => {
                      const hasOptions =
                        item.variants.length > 0 || item.modifierGroups.length > 0;
                      const primaryPhoto =
                        item.images.find((i) => i.isPrimary)?.url || item.images[0]?.url;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTapItem(item)}
                          className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-2.5 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] cursor-pointer"
                        >
                          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted mb-2">
                            {primaryPhoto ? (
                              <Image
                                src={primaryPhoto}
                                alt={item.name}
                                fill
                                sizes="160px"
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-muted-foreground/40">
                                <UtensilsIcon className="size-5" />
                              </div>
                            )}
                            {hasOptions && (
                              <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                Seçenekli
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-foreground line-clamp-1">
                              {item.name}
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {formatCurrency(Number(item.price))}
                              </span>
                              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <PlusIcon className="size-3.5" />
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Current Table State & New Cart */}
            <div className="flex min-h-0 flex-col bg-muted/20 overflow-hidden">
              {/* Existing Items Accordion/Preview if Occupied */}
              {isOccupied && existingLines.length > 0 && (
                <div className="border-b border-border/70 p-3 bg-muted/40 shrink-0 max-h-40 overflow-y-auto">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
                    <span>Masadaki Mevcut Ürünler</span>
                    <span className="tabular-nums text-foreground">{formatCurrency(existingTotal)}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    {existingLines.map((l, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span className="line-clamp-1">{l.qty}x {l.name}</span>
                        <span className="tabular-nums shrink-0">{formatCurrency(l.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW CART ITEMS LIST */}
              <div className="flex-1 min-h-0 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <ShoppingBagIcon className="size-3.5 text-primary" />
                    Yeni Eklenecekler ({cart.cart.reduce((s, l) => s + l.quantity, 0)})
                  </span>
                  {cart.cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => cart.clear()}
                      className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                    >
                      Sepeti Temizle
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
                  {cart.cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground my-auto">
                      <ShoppingBagIcon className="size-8 opacity-30 mb-2" />
                      <p className="text-xs font-medium">Henüz ürün seçilmedi</p>
                      <p className="text-[10px] mt-0.5">Soldaki menüden ürünlere tıklayarak ekleyin.</p>
                    </div>
                  ) : (
                    cart.cart.map((line, idx) => {
                      const item = menu?.items.find((i) => i.id === line.menuItemId);
                      const unit = item
                        ? Number(
                            line.variantId
                              ? item.variants.find((v) => v.id === line.variantId)?.price ?? item.price
                              : item.price,
                          ) + line.modifiers.reduce((s, m) => s + m.priceDelta, 0)
                        : 0;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card p-2 text-xs shadow-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-foreground truncate">{line.name}</div>
                            {line.modifiers.length > 0 && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                + {line.modifiers.map((m) => m.name).join(", ")}
                              </div>
                            )}
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatCurrency(unit * line.quantity)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (line.quantity <= 1) {
                                  cart.removeLine(line.key);
                                } else {
                                  cart.changeQty(line.key, -1);
                                }
                              }}
                              className="flex size-6 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                            >
                              <MinusIcon className="size-3" />
                            </button>
                            <span className="w-5 text-center font-bold tabular-nums">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => cart.changeQty(line.key, 1)}
                              className="flex size-6 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                            >
                              <PlusIcon className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => cart.removeLine(line.key)}
                              className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer ml-1"
                            >
                              <Trash2Icon className="size-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Totals & Submit */}
              <div className="border-t border-border/80 p-3 bg-card shrink-0 flex flex-col gap-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-muted-foreground">Eklenecek Tutar:</span>
                  <span className="font-bold text-foreground tabular-nums">{formatCurrency(newItemsTotal)}</span>
                </div>
                {isOccupied && (
                  <div className="flex justify-between items-baseline text-xs font-bold border-t pt-1">
                    <span>Masa Yeni Toplamı:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums text-sm font-black">
                      {formatCurrency(existingTotal + newItemsTotal)}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={cart.cart.length === 0 || isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer gap-2 mt-1"
                >
                  {isPending ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      <span>Kaydediliyor…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon className="size-4" />
                      <span>{isOccupied ? "Siparişi Masaya Ekle" : "Masayı Aç & Siparişi Gönder"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Variant / Modifier Dialog */}
      {configItem && (
        <ItemConfigDialog
          item={configItem}
          onOpenChange={(op) => !op && setConfigItem(null)}
          onAdd={(line) => {
            cart.addLine(line);
            setConfigItem(null);
            toast.success(`${line.name} eklendi`, { duration: 1500 });
          }}
        />
      )}
    </>
  );
}
