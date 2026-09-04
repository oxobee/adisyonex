"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BanknoteIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CreditCardIcon,
  DeleteIcon,
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  PercentIcon,
  PlusIcon,
  PrinterIcon,
  ReceiptIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { quickCashierSaleAction } from "@/actions/cashier-sale.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { formatCurrency } from "@/lib/format";
import { uuid } from "@/lib/uuid";
import { cn } from "@/lib/utils";
import { computeBill, type DiscountInput } from "@/services/billing";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";
import type { TableDTO } from "@/types/table";
import type { PaymentInput } from "@/lib/validators/order";

import { ItemConfigDialog } from "./item-config-dialog";
import { toBillLine, type CartLine } from "./types";
import { useOrderCart } from "./use-order-cart";

export interface CashierSalesTerminalProps {
  readonly menu: MenuDTO;
  readonly tables: readonly TableDTO[];
  readonly cashierName?: string;
  readonly restaurantName?: string;
}

type PaymentMethodType = "CASH" | "CARD" | "MEAL_VOUCHER" | "SPLIT" | "QR";

interface MealVoucherBrand {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly border: string;
  readonly bg: string;
}

const MEAL_VOUCHERS: readonly MealVoucherBrand[] = [
  { id: "sodexo", name: "Sodexo (Pluxee)", color: "text-blue-600", border: "border-blue-300", bg: "bg-blue-50" },
  { id: "multinet", name: "Multinet", color: "text-emerald-600", border: "border-emerald-300", bg: "bg-emerald-50" },
  { id: "ticket", name: "Ticket Edenred", color: "text-red-600", border: "border-red-300", bg: "bg-red-50" },
  { id: "setcard", name: "Setcard", color: "text-amber-600", border: "border-amber-300", bg: "bg-amber-50" },
  { id: "metropol", name: "Metropol Card", color: "text-purple-600", border: "border-purple-300", bg: "bg-purple-50" },
];

export function CashierSalesTerminal({
  menu,
  tables,
  cashierName = "Kasa Personeli",
  restaurantName = "Adisyoon",
}: CashierSalesTerminalProps) {
  const router = useRouter();
  const orderCart = useOrderCart();
  const { cart, quickAdd, addLine, changeQty, removeLine, toggleComp, clear } = orderCart;

  // Search & Category Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [configItem, setConfigItem] = useState<MenuItemDTO | null>(null);

  // Discount State
  const [discount, setDiscount] = useState<DiscountInput>({ type: "NONE", value: 0 });

  // Customer Details (Optional)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CASH");
  const [cashTenderedStr, setCashTenderedStr] = useState<string>("");
  const [selectedMealVoucher, setSelectedMealVoucher] = useState<string>(MEAL_VOUCHERS[0].name);
  
  // Split Payment State
  const [splitCashStr, setSplitCashStr] = useState<string>("");
  const [splitCardStr, setSplitCardStr] = useState<string>("");

  // Success Modal State
  const [completedSale, setCompletedSale] = useState<{
    orderId: string;
    orderNumber: number;
    grandTotal: number;
    paidAmount: number;
    tenderedAmount: number;
    changeAmount: number;
    paymentModeLabel: string;
    invoiceUrl: string;
    kotUrl: string;
  } | null>(null);

  // Bill Computation
  const bill = useMemo(
    () => computeBill(cart.map(toBillLine), discount),
    [cart, discount],
  );

  // Auto-suggest cash tendered when grandTotal changes if empty
  const cashTendered = Number(cashTenderedStr) || 0;
  const changeDue = Math.max(0, cashTendered - bill.grandTotal);
  const cashRemaining = Math.max(0, bill.grandTotal - cashTendered);

  const categoryMap = useMemo(
    () => new Map(menu.categories.map((c) => [c.id, c.name])),
    [menu.categories],
  );

  // Categories list
  const categories = useMemo(() => {
    return menu.categories.filter((c) => c.isActive);
  }, [menu]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menu.items.filter((item) => {
      if (!item.isActive) return false;
      if (selectedCategory !== "ALL" && item.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const catName = categoryMap.get(item.categoryId)?.toLowerCase() || "";
        const matchesCat = catName.includes(query);
        return matchesName || matchesCat;
      }
      return true;
    });
  }, [menu, selectedCategory, searchQuery, categoryMap]);

  // Item counts in cart map
  const cartItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const line of cart) {
      counts[line.menuItemId] = (counts[line.menuItemId] || 0) + line.quantity;
    }
    return counts;
  }, [cart]);



  // Tap Item Handler
  const handleTapItem = (item: MenuItemDTO) => {
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setConfigItem(item);
      return;
    }
    quickAdd(item);
  };

  // Numpad key input for cash tendered
  const handleNumpad = (val: string) => {
    if (val === "C") {
      setCashTenderedStr("");
      return;
    }
    if (val === "BACK") {
      setCashTenderedStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === "EXACT") {
      setCashTenderedStr(String(bill.grandTotal));
      return;
    }
    if (val === ".") {
      if (!cashTenderedStr.includes(".")) {
        setCashTenderedStr((prev) => (prev ? `${prev}.` : "0."));
      }
      return;
    }
    setCashTenderedStr((prev) => `${prev}${val}`);
  };

  // Quick Banknote Click
  const handleQuickBanknote = (amount: number) => {
    setCashTenderedStr(String(amount));
  };

  // Server Action for Quick Sale
  const submitSale = useServerAction(quickCashierSaleAction, {
    onSuccess: (res) => {
      if (!res) return;
      let modeLabel = "Nakit";
      if (paymentMethod === "CARD") modeLabel = "Kredi Kartı";
      else if (paymentMethod === "MEAL_VOUCHER") modeLabel = `Yemek Kartı (${selectedMealVoucher})`;
      else if (paymentMethod === "SPLIT") modeLabel = "Parçalı Ödeme";
      else if (paymentMethod === "QR") modeLabel = "FAST / QR Kod";

      setCompletedSale({
        orderId: res.orderId,
        orderNumber: res.orderNumber,
        grandTotal: res.grandTotal,
        paidAmount: res.paidAmount,
        tenderedAmount: res.tenderedAmount,
        changeAmount: res.changeAmount,
        paymentModeLabel: modeLabel,
        invoiceUrl: res.invoiceUrl,
        kotUrl: res.kotUrl,
      });

      // Clear terminal state for next sale
      clear();
      setDiscount({ type: "NONE", value: 0 });
      setCashTenderedStr("");
      setCustomerName("");
      setCustomerPhone("");
      toast.success(`Satış Tamamlandı! Fiş #${res.orderNumber}`, {
        description: `Tutar: ${formatCurrency(res.grandTotal)} | Paraüstü: ${formatCurrency(res.changeAmount)}`,
      });
    },
    onError: (msg) => {
      toast.error(msg || "Satış işlemi sırasında bir hata oluştu");
    },
  });

  // Execute Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.error("Sepetinizde ürün bulunmuyor!");
      return;
    }

    if (bill.grandTotal <= 0) {
      toast.error("Ödenecek tutar 0'dan büyük olmalıdır!");
      return;
    }

    // Build Payments array
    let payments: PaymentInput[] = [];

    if (paymentMethod === "CASH") {
      const tendered = Number(cashTenderedStr) || bill.grandTotal;
      if (tendered < bill.grandTotal) {
        toast.error(`Verilen nakit tutar yetersiz! Kalan: ${formatCurrency(bill.grandTotal - tendered)}`);
        return;
      }
      payments = [
        {
          mode: "CASH",
          amount: bill.grandTotal,
          tendered,
          reference: "Nakit Kasa Satışı",
        },
      ];
    } else if (paymentMethod === "CARD") {
      payments = [
        {
          mode: "CARD",
          amount: bill.grandTotal,
          reference: "Kredi Kartı / POS",
        },
      ];
    } else if (paymentMethod === "MEAL_VOUCHER") {
      payments = [
        {
          mode: "OTHER",
          amount: bill.grandTotal,
          reference: `Yemek Kartı: ${selectedMealVoucher}`,
        },
      ];
    } else if (paymentMethod === "QR") {
      payments = [
        {
          mode: "UPI",
          amount: bill.grandTotal,
          reference: "FAST / QR / Havale",
        },
      ];
    } else if (paymentMethod === "SPLIT") {
      const cAmount = Number(splitCashStr) || 0;
      const kAmount = Number(splitCardStr) || 0;
      if (cAmount + kAmount < bill.grandTotal) {
        toast.error("Parçalı ödemeler toplamı hesap tutarını karşılamıyor!");
        return;
      }
      payments = [
        { mode: "CASH", amount: cAmount, reference: "Parçalı Nakit" },
        { mode: "CARD", amount: kAmount, reference: "Parçalı Kart" },
      ];
    }

    const payload = {
      idempotencyKey: uuid(),
      orderType: "TAKEAWAY" as const,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      discountType: discount.type,
      discountValue: discount.value,
      discountReason: discount.type !== "NONE" ? "Kasa İskontosu" : undefined,
      payments,
      items: cart.map((l) => ({
        menuItemId: l.menuItemId,
        variantId: l.variantId ?? undefined,
        quantity: l.quantity,
        lineNote: l.lineNote ?? undefined,
        isComp: l.isComp,
        compReason: l.isComp ? "Kasa İkramı" : undefined,
        modifierIds: l.modifiers.map((m) => m.id),
      })),
    };

    submitSale.execute(payload);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#f1f5f9] select-none">
      {/* 1. ÜST KASA KONTROL ÇUBUĞU (HEADER) */}
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 bg-white border-b-2 border-b-gray-200/90 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_6px_rgba(16,185,129,0.3)] border border-emerald-400">
            <CalculatorIcon className="size-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                POS Kasa Satış Terminali
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Canlı Satış
              </span>
            </div>
            <span className="text-[11px] font-semibold text-gray-500">
              👤 Kasa: <span className="text-gray-900 font-bold">{cashierName}</span> • {restaurantName}
            </span>
          </div>
        </div>

        {/* Sağ Butonlar: Sepeti Boşalt */}
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Sepeti temizlemek istediğinize emin misiniz?")) {
                  clear();
                  setCashTenderedStr("");
                }
              }}
              className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Trash2Icon className="size-3.5" />
              <span className="hidden sm:inline">Sepeti Boşalt</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. ANA GÖVDE: SOL ÜRÜN KATALOĞU (60%) + SAĞ ADİSYON & ÖDEME (40%) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* SOL ALAN: KATEGORİLER + ARAMA + 3D ÜRÜN KARTLARI */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] border-r border-gray-200/90 overflow-hidden">
          {/* Arama ve Kategori Barı */}
          <div className="p-3 sm:p-4 bg-white border-b border-gray-200 flex flex-col gap-2.5 shrink-0 shadow-2xs">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hızlı ürün ara veya barkod okutun..."
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>

            {/* Yatay Kategori Çubuğu (Scrollable Pills) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={cn(
                  "shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border",
                  selectedCategory === "ALL"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-102"
                    : "bg-gray-100/90 text-gray-700 hover:bg-gray-200 border-gray-200/80"
                )}
              >
                Tümü ({menu.items.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-102"
                      : "bg-gray-100/90 text-gray-700 hover:bg-gray-200 border-gray-200/80"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Material Ürün Izgarası */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4.5">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                <UtensilsCrossedIcon className="size-12 stroke-[1.5] mb-2 text-gray-300" />
                <p className="text-sm font-bold text-gray-600">Aradığınız kriterde ürün bulunamadı</p>
                <span className="text-xs text-gray-400">Aramayı temizleyin veya başka bir kategori seçin</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredItems.map((item, idx) => {
                  const cartCount = cartItemCounts[item.id] || 0;
                  const hasVariants = item.variants.length > 0 || item.modifierGroups.length > 0;
                  const primaryImage = item.images?.find((img) => img.isPrimary)?.url || item.images?.[0]?.url;

                  // 3D Material vibrant color themes matching reference Image 1
                  const cardGradients = [
                    "from-[#1d4ed8] via-[#2563eb] to-[#1e40af]", // Blue (Image 1, Card 01)
                    "from-[#c2410c] via-[#ea580c] to-[#9a3412]", // Orange (Image 1, Card 02)
                    "from-[#047857] via-[#059669] to-[#065f46]", // Emerald (Image 1, Card 03)
                    "from-[#6d28d9] via-[#7c3aed] to-[#5b21b6]", // Purple (Image 1, Card 04)
                    "from-[#be123c] via-[#e11d48] to-[#9f1239]", // Rose (Image 1, Card 05)
                    "from-[#334155] via-[#475569] to-[#1e293b]", // Slate (Image 1, Card 06)
                  ];
                  const gradient = cardGradients[idx % cardGradients.length];

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleTapItem(item)}
                      className={cn(
                        "group relative rounded-2xl overflow-hidden cursor-pointer select-none flex flex-col justify-between transition-all duration-150 transform-gpu",
                        `bg-gradient-to-br ${gradient}`,
                        "border-t border-t-white/50 border-x border-white/15 border-b-[3.5px] border-b-black/40",
                        "shadow-[0_8px_20px_-4px_rgba(0,0,0,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.4)]",
                        "hover:-translate-y-1.5 hover:shadow-2xl hover:brightness-105",
                        "active:translate-y-1 active:scale-[0.98] active:border-b-[1.5px]",
                        "min-h-[175px] sm:min-h-[195px]"
                      )}
                    >
                      {/* Subdued Eye-Friendly Texture Overlay & Concentric Rings */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                        {/* Concentric rings in corner */}
                        <svg
                          className="absolute -bottom-6 -right-6 w-32 h-32 opacity-15 text-white pointer-events-none"
                          viewBox="0 0 160 160"
                          fill="none"
                        >
                          <circle cx="80" cy="80" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                        </svg>

                        {/* Top Specular Bevel Highlight */}
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />

                        {/* Bottom Extrusion Shadow */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 via-black/15 to-transparent pointer-events-none" />
                      </div>

                      {/* Sepetteki Adet Rozeti (3D Tactile Pill) */}
                      {cartCount > 0 && (
                        <div className="absolute top-2 right-2 z-20 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-black shadow-lg border-2 border-white animate-in zoom-in-75">
                          {cartCount}
                        </div>
                      )}

                      {/* Üst Alan: Ürün Fotoğrafı veya 3D İkon Küresi */}
                      <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-black/25">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            {/* 3D Tactile Sphere Icon from reference style */}
                            <div className="size-12 rounded-full bg-white/20 backdrop-blur-xs border border-white/40 shadow-[inset_0_2px_3px_rgba(255,255,255,0.7),0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center text-white transition-transform group-hover:scale-110">
                              <UtensilsCrossedIcon className="size-6" />
                            </div>
                          </div>
                        )}

                        {/* Gradient shade over image to seamlessly transition to card */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        {/* Category Label Chip */}
                        <div className="absolute bottom-1.5 left-2 z-10">
                          <span className="text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
                            {categoryMap.get(item.categoryId) || "Genel"}
                          </span>
                        </div>
                      </div>

                      {/* Alt Alan: Ürün Adı & 3D Fiyat Paneli */}
                      <div className="relative z-10 p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                        <span className="text-xs sm:text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                          {item.name}
                        </span>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                          <span className="text-xs sm:text-sm font-black text-white tabular-nums tracking-tight font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                            {formatCurrency(item.price)}
                          </span>

                          {hasVariants ? (
                            <span className="text-[10px] font-black text-amber-200 bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-400/40">
                              Seçenekli
                            </span>
                          ) : (
                            <div className="size-6 rounded-full bg-white/25 backdrop-blur-xs text-white border border-white/40 flex items-center justify-center group-hover:bg-white group-hover:text-slate-950 transition-colors shadow-xs">
                              <PlusIcon className="size-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SAĞ ALAN: ADİSYON TİCKET + FİNANSAL HESAPLAMA + ÖDEME & PARAÜSTÜ */}
        <aside className="w-full lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col bg-white overflow-hidden shadow-lg border-l border-gray-200">
          {/* Adisyon Başlığı */}
          <div className="p-3 sm:p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="size-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-black text-gray-900">
                Adisyon Fişi ({cart.reduce((s, l) => s + l.quantity, 0)} Ürün)
              </span>
            </div>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              ⚡ Hızlı Satış
            </span>
          </div>

          {/* Sepet Ürün Satırları (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 flex flex-col gap-2 min-h-[140px] max-h-[30vh] lg:max-h-[none]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center my-auto py-8 text-center text-gray-400">
                <ReceiptIcon className="size-10 stroke-[1.5] mb-2 text-gray-300" />
                <p className="text-xs sm:text-sm font-bold text-gray-700">Sepetiniz Boş</p>
                <span className="text-[11px] text-gray-400 max-w-[200px]">
                  Sol taraftaki menüden ürün seçerek hızlı satışa başlayın.
                </span>
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.key}
                  className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl border border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 transition-colors gap-2"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
                        {line.name}
                      </span>
                      {line.variantName && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                          {line.variantName}
                        </span>
                      )}
                      {line.isComp && (
                        <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
                          İkram
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 font-semibold">
                      <span>{formatCurrency(line.unitPrice)}</span>
                      {line.modifiers.length > 0 && (
                        <span className="text-gray-400">
                          +{line.modifiers.map((m) => m.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Adet Kontrolleri */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => changeQty(line.key, -1)}
                      className="size-7 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 active:scale-95 cursor-pointer font-bold"
                    >
                      <MinusIcon className="size-3" />
                    </button>

                    <span className="w-7 text-center text-xs sm:text-sm font-black tabular-nums text-gray-900">
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => changeQty(line.key, 1)}
                      className="size-7 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 active:scale-95 cursor-pointer font-bold"
                    >
                      <PlusIcon className="size-3" />
                    </button>

                    <span className="w-16 text-right text-xs sm:text-sm font-black tabular-nums text-gray-900 pl-1">
                      {line.isComp ? "0.00 ₺" : formatCurrency(line.unitPrice * line.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="size-7 ml-1 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* İskonto & İndirim Çubuğu */}
          <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <TagIcon className="size-3.5 text-gray-500" />
              <span className="text-xs font-bold text-gray-700">İndirim / İskonto:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDiscount({ type: "NONE", value: 0 })}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  discount.type === "NONE"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-gray-600 border-gray-200"
                )}
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={() => setDiscount({ type: "PERCENT", value: 10 })}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  discount.type === "PERCENT" && discount.value === 10
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200"
                )}
              >
                %10
              </button>
              <button
                type="button"
                onClick={() => setDiscount({ type: "PERCENT", value: 20 })}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  discount.type === "PERCENT" && discount.value === 20
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200"
                )}
              >
                %20
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = prompt("İndirim tutarı girin (₺):", "50");
                  if (val && !isNaN(Number(val))) {
                    setDiscount({ type: "FLAT", value: Number(val) });
                  }
                }}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  discount.type === "FLAT"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200"
                )}
              >
                Özel ₺
              </button>
            </div>
          </div>

          {/* 3D Recessed LCD Toplam Paneli */}
          <div className="p-3 sm:p-3.5 bg-slate-950 text-white border-t border-slate-800 shadow-[inset_0_3px_6px_rgba(0,0,0,0.5)] shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Ara Toplam: {formatCurrency(bill.subtotal)}</span>
              {bill.discountTotal > 0 && (
                <span className="text-amber-400 font-bold">
                  İndirim: -{formatCurrency(bill.discountTotal)}
                </span>
              )}
              <span>KDV: {formatCurrency(bill.taxTotal)}</span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800">
              <span className="text-xs uppercase tracking-widest font-black text-slate-400">
                Ödenecek Tutar:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight tabular-nums drop-shadow-[0_2px_8px_rgba(52,211,153,0.4)] font-mono">
                {formatCurrency(bill.grandTotal)}
              </span>
            </div>
          </div>

          {/* 3. ÖDEME YÖNTEMLERİ VE PARAÜSTÜ MODÜLÜ */}
          <div className="p-3 sm:p-3.5 bg-white border-t border-gray-200 flex flex-col gap-3 shrink-0">
            {/* Ödeme Türü Seçici Sekmeler */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={cn(
                  "flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "CASH"
                    ? "bg-white text-emerald-700 shadow-sm border border-gray-200/80"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <BanknoteIcon className="size-3.5" />
                <span>Nakit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={cn(
                  "flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "CARD"
                    ? "bg-white text-blue-700 shadow-sm border border-gray-200/80"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <CreditCardIcon className="size-3.5" />
                <span>Kart</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("MEAL_VOUCHER")}
                className={cn(
                  "flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "MEAL_VOUCHER"
                    ? "bg-white text-amber-700 shadow-sm border border-gray-200/80"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <WalletIcon className="size-3.5" />
                <span>Yemek Çeki</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("SPLIT")}
                className={cn(
                  "flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "SPLIT"
                    ? "bg-white text-purple-700 shadow-sm border border-gray-200/80"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <PercentIcon className="size-3.5" />
                <span>Parçalı</span>
              </button>
            </div>

            {/* A) NAKİT SEÇİLİYSE: 3D HIZLI BANKNOTLAR + 3D GÖMÜLÜ LCD PANEL + 3D TACTILE NUMPAD */}
            {paymentMethod === "CASH" && (
              <div className="flex flex-col gap-2.5">
                {/* 3D Dokunsal Banknot Tuşları */}
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNumpad("EXACT")}
                    className="py-2 rounded-xl bg-slate-900 text-white font-black text-xs border-t border-t-white/30 border-b-[3px] border-b-black shadow-md hover:bg-slate-800 active:translate-y-0.5 active:border-b transition-all cursor-pointer select-none"
                  >
                    Tam
                  </button>
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickBanknote(amt)}
                      className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border-t border-t-white/80 border-b-[3px] border-b-slate-300 shadow-xs active:translate-y-0.5 active:border-b transition-all cursor-pointer select-none font-mono"
                    >
                      {amt} ₺
                    </button>
                  ))}
                </div>

                {/* 3D Gömülü LCD Alınan Nakit ve Paraüstü / Kalan Tutar Kutuları (Matching Image 2) */}
                <div className="grid grid-cols-2 gap-2">
                  {/* ALINAN NAKİT KUTUSU */}
                  <div className="flex flex-col justify-center p-2.5 rounded-2xl bg-white border border-gray-200/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      ALINAN NAKİT:
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashTenderedStr}
                      onChange={(e) => setCashTenderedStr(e.target.value)}
                      placeholder="0.00 ₺"
                      className="text-base sm:text-lg font-black text-gray-900 bg-transparent focus:outline-hidden font-mono tracking-tight"
                    />
                  </div>

                  {/* KALAN TUTAR / PARA ÜSTÜ KUTUSU */}
                  <div
                    className={cn(
                      "flex flex-col justify-center p-2.5 rounded-2xl border transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]",
                      cashTendered >= bill.grandTotal && bill.grandTotal > 0
                        ? "bg-emerald-50/80 border-emerald-400 text-emerald-900"
                        : "bg-amber-50/90 border-amber-300 text-amber-950"
                    )}
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider">
                      {cashTendered >= bill.grandTotal && bill.grandTotal > 0
                        ? "PARA ÜSTÜ:"
                        : "KALAN TUTAR:"}
                    </span>
                    <span className="text-base sm:text-lg font-black tabular-nums font-mono tracking-tight">
                      {cashTendered >= bill.grandTotal && bill.grandTotal > 0
                        ? formatCurrency(changeDue)
                        : formatCurrency(cashRemaining)}
                    </span>
                  </div>
                </div>

                {/* 3D Tactile POS Numpad */}
                <div className="grid grid-cols-6 gap-1.5 text-xs">
                  {["1", "2", "3", "4", "5", "6"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleNumpad(n)}
                      className="py-2 sm:py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold border-t border-t-white border-x border-gray-200 border-b-[3px] border-b-gray-300 shadow-xs active:translate-y-0.5 active:border-b active:shadow-inner transition-all select-none cursor-pointer font-mono text-sm"
                    >
                      {n}
                    </button>
                  ))}
                  {["7", "8", "9", "0", "00", "BACK"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleNumpad(n)}
                      className={cn(
                        "py-2 sm:py-2.5 rounded-xl font-bold border-t border-x border-b-[3px] shadow-xs active:translate-y-0.5 active:border-b active:shadow-inner transition-all select-none cursor-pointer font-mono text-sm",
                        n === "BACK"
                          ? "bg-red-50 text-red-700 border-t-red-200 border-x-red-200 border-b-red-300 hover:bg-red-100"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-900 border-t-white border-gray-200 border-b-gray-300"
                      )}
                    >
                      {n === "BACK" ? "⌫" : n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* B) KREDİ KARTI SEÇİLİYSE */}
            {paymentMethod === "CARD" && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center gap-3">
                <CreditCardIcon className="size-6 text-blue-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-black">Banka / Kredi Kartı POS Tahsilatı</span>
                  <span className="text-[11px] text-blue-700">
                    POS cihazından {formatCurrency(bill.grandTotal)} çekim yapıp satışı onaylayın.
                  </span>
                </div>
              </div>
            )}

            {/* C) YEMEK ÇEKİ SEÇİLİYSE */}
            {paymentMethod === "MEAL_VOUCHER" && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-gray-600">Yemek Kartı / Çeki Seçin:</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {MEAL_VOUCHERS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedMealVoucher(v.name)}
                      className={cn(
                        "py-1.5 px-1 rounded-xl text-[10px] font-black border transition-all flex flex-col items-center justify-center cursor-pointer",
                        selectedMealVoucher === v.name
                          ? `${v.bg} ${v.border} ${v.color} shadow-sm ring-2 ring-primary/40`
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <span>{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* D) PARÇALI ÖDEME SEÇİLİYSE */}
            {paymentMethod === "SPLIT" && (
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-900">
                  Nakit ve Kredi Kartı Bölüştürme:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Nakit Tutar:</label>
                    <input
                      type="number"
                      value={splitCashStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSplitCashStr(val);
                        const num = Number(val) || 0;
                        setSplitCardStr(String(Math.max(0, bill.grandTotal - num)));
                      }}
                      placeholder="0"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Kart Tutar:</label>
                    <input
                      type="number"
                      value={splitCardStr}
                      onChange={(e) => setSplitCardStr(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BÜYÜK 3D TACTILE 'Siparişi Tamamla' BUTONU */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitSale.isPending}
              className={cn(
                "w-full py-3.5 sm:py-4 px-4 rounded-2xl font-black text-sm sm:text-base text-white tracking-wide transition-all select-none cursor-pointer",
                "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600",
                "border-t border-t-emerald-300/80 border-x border-emerald-600",
                "border-b-[4px] border-b-emerald-950",
                "shadow-[0_12px_24px_-4px_rgba(16,185,129,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.6)]",
                "hover:-translate-y-0.5 hover:shadow-xl hover:brightness-105",
                "active:translate-y-1 active:scale-[0.985] active:border-b-[2px] active:shadow-md",
                "disabled:opacity-50 disabled:pointer-events-none",
                "flex items-center justify-center gap-2"
              )}
            >
              {submitSale.isPending ? (
                <>
                  <RefreshCwIcon className="size-5 animate-spin" />
                  <span>Sipariş Tamamlanıyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-5" />
                  <span>Siparişi Tamamla</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* 4. SEÇENEKLİ ÜRÜN MODALI (VARYANT & MODIFIER SEÇİCİ) */}
      {configItem && (
        <ItemConfigDialog
          item={configItem}
          onAdd={(line) => {
            addLine(line);
            setConfigItem(null);
          }}
          onOpenChange={(open) => {
            if (!open) setConfigItem(null);
          }}
        />
      )}

      {/* 5. SATIŞ BAŞARI VE FİŞ YAZDIRMA POPUP'I */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-t border-t-white border-b-[4px] border-b-gray-300 flex flex-col items-center text-center animate-in zoom-in-90 duration-200">
            {/* Onay İkonu */}
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border-4 border-emerald-50 mb-3 shadow-inner">
              <CheckCircle2Icon className="size-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Satış Başarıyla Tamamlandı!
            </h2>
            <span className="text-xs font-bold text-gray-500 mt-0.5">
              Fiş / Adisyon #{completedSale.orderNumber}
            </span>

            {/* Özet Kartı */}
            <div className="w-full my-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-2 text-xs">
              <div className="flex justify-between font-bold text-gray-600">
                <span>Ödeme Yöntemi:</span>
                <span className="text-gray-900 font-black">{completedSale.paymentModeLabel}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-600">
                <span>Toplam Tutar:</span>
                <span className="text-gray-900 font-black text-sm">{formatCurrency(completedSale.grandTotal)}</span>
              </div>
              {completedSale.tenderedAmount > completedSale.grandTotal && (
                <>
                  <div className="flex justify-between font-bold text-gray-600">
                    <span>Alınan Nakit:</span>
                    <span className="text-gray-900 font-black">{formatCurrency(completedSale.tenderedAmount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-800 bg-emerald-100/70 p-2 rounded-xl border border-emerald-200 text-sm">
                    <span>PARA ÜSTÜ:</span>
                    <span className="font-mono">{formatCurrency(completedSale.changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Fiş Yazdırma Butonları */}
            <div className="grid grid-cols-2 gap-2 w-full mb-3">
              <a
                href={completedSale.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <PrinterIcon className="size-3.5" />
                <span>Kasa Fişi Yazdır</span>
              </a>

              <a
                href={completedSale.kotUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-200 active:scale-95 transition-all"
              >
                <UtensilsCrossedIcon className="size-3.5" />
                <span>Mutfak Fişi (KOT)</span>
              </a>
            </div>

            {/* Yeni Satış Yap Butonu */}
            <button
              type="button"
              onClick={() => setCompletedSale(null)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              + Yeni Satışa Geç (Tamam)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
