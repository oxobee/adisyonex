"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BanknoteIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  DeleteIcon,
  MinusIcon,
  PercentIcon,
  PlusIcon,
  PrinterIcon,
  ReceiptIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
  WalletIcon,
  XCircleIcon,
  XIcon,
  ArmchairIcon,
  ShoppingBagIcon,
  BikeIcon,
  HeartIcon,
  QrCodeIcon,
  LayoutGridIcon,
  PizzaIcon,
  SandwichIcon,
  CupSodaIcon,
  CoffeeIcon,
  DessertIcon,
  SoupIcon,
  FlameIcon,
  UtensilsIcon,
  MoreHorizontalIcon,
  StarIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { toast } from "sonner";

import { quickCashierSaleAction } from "@/actions/cashier-sale.actions";
import { cancelCashierReceiptAction } from "@/actions/order.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { formatCurrency } from "@/lib/format";
import { uuid } from "@/lib/uuid";
import { cn } from "@/lib/utils";
import { computeBill, type DiscountInput } from "@/services/billing";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";
import type { TableDTO } from "@/types/table";
import type { PaymentInput } from "@/lib/validators/order";

import { ItemConfigDialog } from "./item-config-dialog";

const QUICK_RECEIPT_CANCEL_REASONS = [
  "Müşteri Vazgeçti",
  "Ödeme Yapılamadı (Kart Red / Bakiye)",
  "Nakit Yetersiz",
  "Hatalı Ürün / Yanlış Fiş",
  "Müşteri Ayrıldı",
  "Diğer",
] as const;
import { toBillLine, type CartLine } from "./types";
import { useOrderCart } from "./use-order-cart";

import type { OrderDTO, OrderType } from "@/types/order";

export interface CashierSalesTerminalProps {
  readonly menu: MenuDTO;
  readonly tables: readonly TableDTO[];
  readonly occupied?: Record<string, string>;
  readonly openOrders?: readonly OrderDTO[];
  readonly cashierName?: string;
  readonly restaurantName?: string;
  readonly showItemImages?: boolean;
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

export interface ParkedTicketState {
  readonly id: string; // "1" .. "5"
  readonly label: string; // "Fiş 01" .. "Fiş 05"
  cart: CartLine[];
  selectedTableId: string | null;
  existingOrderId: string | null;
  serviceType: OrderType;
  discount: DiscountInput;
  customerName: string;
  customerPhone: string;
  cashTenderedStr: string;
  paymentMethod: PaymentMethodType;
}

const DEFAULT_TICKETS: ParkedTicketState[] = [
  { id: "1", label: "Fiş 01", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH" },
  { id: "2", label: "Fiş 02", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH" },
  { id: "3", label: "Fiş 03", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH" },
  { id: "4", label: "Fiş 04", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH" },
  { id: "5", label: "Fiş 05", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH" },
];

export const getTableOrderTotal = (order?: OrderDTO): number => {
  if (!order) return 0;
  if (order.grandTotal > 0) return order.grandTotal;
  return order.lines
    .filter((l) => l.state !== "VOID" && !l.isComp)
    .reduce((sum, l) => {
      const modDelta = l.modifiers.reduce((ms, m) => ms + m.priceDelta, 0);
      return sum + (l.unitPrice + modDelta) * l.quantity;
    }, 0);
};

export function CashierSalesTerminal({
  menu,
  tables,
  occupied = {},
  openOrders = [],
  cashierName = "Kasa Personeli",
  restaurantName = "Adisyoon",
  showItemImages = true,
}: CashierSalesTerminalProps) {
  // Çoklu Fiş Sistemi (Fiş 01 - Fiş 05)
  const [tickets, setTickets] = useState<ParkedTicketState[]>(DEFAULT_TICKETS);
  const [activeTicketId, setActiveTicketId] = useState<string>("1");
  const isHydratedRef = useRef(false);

  // Load tickets from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("pos_cashier_multi_tickets_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTickets(parsed);
        }
      }
      const savedActive = localStorage.getItem("pos_cashier_active_ticket_id");
      if (savedActive) {
        setActiveTicketId(savedActive);
      }
    } catch {
      // ignore
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  // Save tickets to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined" || !isHydratedRef.current) return;
    try {
      localStorage.setItem("pos_cashier_multi_tickets_v1", JSON.stringify(tickets));
      localStorage.setItem("pos_cashier_active_ticket_id", activeTicketId);
    } catch {
      // ignore
    }
  }, [tickets, activeTicketId]);

  const currentTicket = tickets.find((t) => t.id === activeTicketId) || tickets[0];
  const cart = currentTicket.cart;
  const selectedTableId = currentTicket.selectedTableId;
  const serviceType = currentTicket.serviceType;
  const discount = currentTicket.discount;
  const customerName = currentTicket.customerName;
  const customerPhone = currentTicket.customerPhone;
  const cashTenderedStr = currentTicket.cashTenderedStr;
  const paymentMethod = currentTicket.paymentMethod;

  const updateActiveTicket = (updater: Partial<ParkedTicketState> | ((prev: ParkedTicketState) => ParkedTicketState)) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== activeTicketId) return t;
        if (typeof updater === "function") {
          return updater(t);
        }
        return { ...t, ...updater };
      })
    );
  };

  const setSelectedTableId = (id: string | null) =>
    updateActiveTicket((t) => ({
      ...t,
      selectedTableId: id,
      existingOrderId: id ? t.existingOrderId : null,
    }));
  const setServiceType = (st: OrderType) => updateActiveTicket({ serviceType: st });
  const setDiscount = (d: DiscountInput) => updateActiveTicket({ discount: d });
  const setCustomerName = (n: string) => updateActiveTicket({ customerName: n });
  const setCustomerPhone = (p: string) => updateActiveTicket({ customerPhone: p });
  const setCashTenderedStr = (s: string | ((prev: string) => string)) => {
    if (typeof s === "function") {
      updateActiveTicket((t) => ({ ...t, cashTenderedStr: s(t.cashTenderedStr) }));
    } else {
      updateActiveTicket({ cashTenderedStr: s });
    }
  };
  const setPaymentMethod = (pm: PaymentMethodType) => updateActiveTicket({ paymentMethod: pm });

  const addLine = (line: CartLine) => updateActiveTicket((t) => ({ ...t, cart: [...t.cart, line] }));
  const quickAdd = (item: MenuItemDTO) => {
    updateActiveTicket((t) => {
      const existing = t.cart.find(
        (l) => l.menuItemId === item.id && !l.variantId && l.modifiers.length === 0 && !l.isComp
      );
      if (existing) {
        return {
          ...t,
          cart: t.cart.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l)),
        };
      }
      const newLine: CartLine = {
        key: uuid(),
        menuItemId: item.id,
        name: item.name,
        variantId: null,
        variantName: null,
        unitPrice: item.price,
        taxRate: item.tax.rate,
        taxInclusive: item.tax.inclusive,
        modifiers: [],
        quantity: 1,
        lineNote: null,
        isComp: false,
      };
      return { ...t, cart: [...t.cart, newLine] };
    });
  };
  const changeQty = (key: string, delta: number) => {
    updateActiveTicket((t) => ({
      ...t,
      cart: t.cart
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    }));
  };
  const removeLine = (key: string) => {
    updateActiveTicket((t) => ({ ...t, cart: t.cart.filter((l) => l.key !== key) }));
  };
  const toggleComp = (key: string) => {
    updateActiveTicket((t) => ({
      ...t,
      cart: t.cart.map((l) => (l.key === key ? { ...l, isComp: !l.isComp } : l)),
    }));
  };
  const replaceAll = (lines: CartLine[]) => {
    updateActiveTicket({ cart: lines });
  };
  const clear = () => {
    updateActiveTicket({
      cart: [],
      selectedTableId: null,
      existingOrderId: null,
      serviceType: "TAKEAWAY",
      discount: { type: "NONE", value: 0 },
      customerName: "",
      customerPhone: "",
      cashTenderedStr: "",
      paymentMethod: "CASH",
    });
    setSplitPayments([]);
    setSplitInputAmount("");
  };

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const router = useRouter();

  // Main Tab & Catalog Drawer State
  const [activeMainTab, setActiveMainTab] = useState<"PRODUCTS" | "TABLES">("PRODUCTS");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [mobileSalesView, setMobileSalesView] = useState<"CART" | "PAYMENT">("CART");
  const [tableFilter, setTableFilter] = useState<"ALL" | "OCCUPIED" | "EMPTY">("ALL");
  const [tableSearch, setTableSearch] = useState("");

  // Search & Category Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [configItem, setConfigItem] = useState<MenuItemDTO | null>(null);

  // Favorites state persisted to localStorage
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("pos_cashier_favorites");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleFavorite = (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem("pos_cashier_favorites", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Category horizontal scroll ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const scrollCategories = (dir: "left" | "right") => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: dir === "right" ? 220 : -220,
        behavior: "smooth",
      });
    }
  };

  // Keyboard shortcut: Escape closes catalog drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCatalogOpen) {
        setIsCatalogOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCatalogOpen]);

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<MenuItemDTO | null>(null);
  const [draggedTable, setDraggedTable] = useState<TableDTO | null>(null);
  const [isDragOverCart, setIsDragOverCart] = useState(false);
  const [selectedMealVoucher, setSelectedMealVoucher] = useState<string>(MEAL_VOUCHERS[0].name);

  // Enhanced Multi-Tender Split Payment State
  const [splitPayments, setSplitPayments] = useState<{
    id: string;
    mode: "CASH" | "CARD" | "OTHER";
    methodLabel: string;
    amount: number;
    reference?: string;
  }[]>([]);
  const [splitInputAmount, setSplitInputAmount] = useState<string>("");
  const [splitSelectedMethod, setSplitSelectedMethod] = useState<"CASH" | "CARD" | "OTHER">("CASH");
  const [splitMealVoucher, setSplitMealVoucher] = useState<string>(MEAL_VOUCHERS[0].name);

  // Cancel Receipt State
  const [cancelReceiptOpen, setCancelReceiptOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("Müşteri Vazgeçti");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");

  // Success Modal State
  const [completedSale, setCompletedSale] = useState<{
    orderId: string;
    orderNumber: number;
    grandTotal: number;
    paidAmount: number;
    tenderedAmount: number;
    changeAmount: number;
    paymentModeLabel: string;
    serviceTypeLabel?: string;
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

  // Split payments calculations
  const totalPaidSplit = useMemo(
    () => Math.round((splitPayments.reduce((s, p) => s + p.amount, 0) + Number.EPSILON) * 100) / 100,
    [splitPayments],
  );
  const remainingSplit = useMemo(
    () => Math.max(0, Math.round(((bill.grandTotal - totalPaidSplit) + Number.EPSILON) * 100) / 100),
    [bill.grandTotal, totalPaidSplit],
  );
  const changeSplit = useMemo(
    () => Math.max(0, Math.round(((totalPaidSplit - bill.grandTotal) + Number.EPSILON) * 100) / 100),
    [bill.grandTotal, totalPaidSplit],
  );
  const isSplitComplete = totalPaidSplit >= bill.grandTotal && bill.grandTotal > 0;

  const handleAddSplitPayment = (customAmt?: number) => {
    const rawAmt = customAmt !== undefined ? customAmt : (Number(splitInputAmount) || remainingSplit);
    const amt = Math.round((rawAmt + Number.EPSILON) * 100) / 100;
    if (amt <= 0) {
      toast.error("Lütfen 0'dan büyük bir ödeme tutarı girin!");
      return;
    }

    const label =
      splitSelectedMethod === "CASH"
        ? "Nakit"
        : splitSelectedMethod === "CARD"
          ? "Kredi Kartı"
          : `Yemek Kartı (${splitMealVoucher})`;

    const ref =
      splitSelectedMethod === "OTHER"
        ? `Yemek Kartı: ${splitMealVoucher}`
        : splitSelectedMethod === "CASH"
          ? "Parçalı Nakit"
          : "Parçalı Kart";

    const newItem = {
      id: uuid(),
      mode: splitSelectedMethod,
      methodLabel: label,
      amount: amt,
      reference: ref,
    };

    setSplitPayments((prev) => {
      const updated = [...prev, newItem];
      const newTotal = updated.reduce((s, p) => s + p.amount, 0);
      const newRem = Math.max(0, Math.round(((bill.grandTotal - newTotal) + Number.EPSILON) * 100) / 100);
      setSplitInputAmount(newRem > 0 ? String(newRem) : "");
      return updated;
    });
  };

  const handleRemoveSplitPayment = (id: string) => {
    setSplitPayments((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      const newTotal = updated.reduce((s, p) => s + p.amount, 0);
      const newRem = Math.max(0, Math.round(((bill.grandTotal - newTotal) + Number.EPSILON) * 100) / 100);
      setSplitInputAmount(newRem > 0 ? String(newRem) : "");
      return updated;
    });
  };

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
      if (selectedCategory === "FAVORITES") {
        if (!favorites.has(item.id)) return false;
      } else if (selectedCategory !== "ALL" && item.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const catName = categoryMap.get(item.categoryId)?.toLowerCase() || "";
        const matchesCat = catName.includes(query);
        const matchesDesc = (item.shortDescription || "").toLowerCase().includes(query);
        return matchesName || matchesCat || matchesDesc;
      }
      return true;
    });
  }, [menu, selectedCategory, searchQuery, categoryMap, favorites]);

  const getCategoryIconComponent = (catName: string) => {
    const n = catName.toLowerCase();
    if (n.includes("pizza")) return PizzaIcon;
    if (n.includes("burger") || n.includes("sandviç") || n.includes("dürüm")) return SandwichIcon;
    if (n.includes("menü") || n.includes("avantaj") || n.includes("fırsat")) return SparklesIcon;
    if (n.includes("içecek") || n.includes("kola") || n.includes("ayran") || n.includes("meşrubat")) return CupSodaIcon;
    if (n.includes("kahve") || n.includes("çay") || n.includes("sıcak")) return CoffeeIcon;
    if (n.includes("tatlı") || n.includes("pasta") || n.includes("dondurma")) return DessertIcon;
    if (n.includes("çorba")) return SoupIcon;
    if (n.includes("popüler") || n.includes("ateş") || n.includes("sıcak")) return FlameIcon;
    return UtensilsIcon;
  };

  // Item counts in cart map
  const cartItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const line of cart) {
      counts[line.menuItemId] = (counts[line.menuItemId] || 0) + line.quantity;
    }
    return counts;
  }, [cart]);



  // Map of tableId -> active open order
  const tableOrderMap = useMemo(() => {
    const map = new Map<string, OrderDTO>();
    for (const order of openOrders) {
      if (order.tableId) {
        map.set(order.tableId, order);
      }
    }
    return map;
  }, [openOrders]);

  // Occupied table count
  const occupiedCount = useMemo(() => {
    return tables.filter((t) => Boolean(occupied[t.id] || tableOrderMap.get(t.id))).length;
  }, [tables, occupied, tableOrderMap]);

  // Filtered & sorted tables for TABLES tab
  const filteredTables = useMemo(() => {
    return tables
      .filter((table) => {
        const isOccupied = Boolean(occupied[table.id] || tableOrderMap.get(table.id));
        if (tableFilter === "OCCUPIED" && !isOccupied) return false;
        if (tableFilter === "EMPTY" && isOccupied) return false;
        if (tableSearch.trim()) {
          const q = tableSearch.toLowerCase().trim();
          return table.label.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const aOcc = Boolean(occupied[a.id] || tableOrderMap.get(a.id));
        const bOcc = Boolean(occupied[b.id] || tableOrderMap.get(b.id));
        if (aOcc && !bOcc) return -1;
        if (!aOcc && bOcc) return 1;
        return a.label.localeCompare(b.label, undefined, { numeric: true });
      });
  }, [tables, occupied, tableOrderMap, tableFilter, tableSearch]);

  // Handle table selection & load items if table has open order
  const handleSelectTable = (table: TableDTO) => {
    const existingOrder = tableOrderMap.get(table.id) || (occupied[table.id] ? openOrders.find(o => o.id === occupied[table.id]) : undefined);
    
    if (existingOrder && existingOrder.lines.length > 0) {
      // Map existing lines to CartLine with real menuItemId from menu
      const mappedLines: CartLine[] = existingOrder.lines
        .filter(l => l.state !== "VOID")
        .map(l => {
          const matchedItem = menu.items.find(
            mi => mi.id === l.menuItemId || mi.name.toLowerCase().trim() === l.name.toLowerCase().trim()
          );
          const resolvedMenuItemId = l.menuItemId || matchedItem?.id || (menu.items[0]?.id ?? l.id);
          const matchedVariant = matchedItem?.variants.find(
            v => v.id === l.variantId || (l.variantName && v.name.toLowerCase() === l.variantName.toLowerCase())
          );

          return {
            key: l.id || uuid(),
            menuItemId: resolvedMenuItemId,
            name: l.name,
            variantId: matchedVariant?.id ?? l.variantId ?? null,
            variantName: l.variantName,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            taxInclusive: l.taxInclusive,
            modifiers: l.modifiers.map(m => {
              const matchedMod = matchedItem?.modifierGroups.flatMap(g => g.modifiers).find(
                mod => mod.id === m.modifierId || mod.name.toLowerCase() === m.name.toLowerCase()
              );
              return {
                id: matchedMod?.id || m.modifierId || m.id,
                name: m.name,
                priceDelta: m.priceDelta,
              };
            }),
            quantity: l.quantity,
            lineNote: l.lineNote,
            isComp: l.isComp,
          };
        });

      updateActiveTicket({
        selectedTableId: table.id,
        existingOrderId: existingOrder.id,
        serviceType: "DINE_IN",
        cart: mappedLines,
      });
      toast.info(`${table.label} içeriği ve tutarı yüklendi!`, {
        description: `Mevcut Tutar: ${formatCurrency(getTableOrderTotal(existingOrder))}`,
      });
    } else {
      updateActiveTicket({
        selectedTableId: table.id,
        existingOrderId: null,
        serviceType: "DINE_IN",
      });
      toast.success(`${table.label} seçildi.`);
    }
    setIsTableModalOpen(false);
    setActiveMainTab("PRODUCTS");
  };

  // Tap Item Handler
  const handleTapItem = (item: MenuItemDTO) => {
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setConfigItem(item);
      return;
    }
    quickAdd(item);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: MenuItemDTO) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
    
    // Always use the whole card element as the drag ghost image
    const cardEl = e.currentTarget as HTMLElement;
    if (cardEl && e.dataTransfer.setDragImage) {
      const rect = cardEl.getBoundingClientRect();
      // Center the drag image on pointer or use standard 40px offset
      const offsetX = Math.min(e.clientX - rect.left, rect.width / 2);
      const offsetY = Math.min(e.clientY - rect.top, 50);
      e.dataTransfer.setDragImage(cardEl, offsetX, offsetY);
    }

    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedTable(null);
    setIsDragOverCart(false);
  };

  const handleDragOverCart = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOverCart) {
      setIsDragOverCart(true);
    }
  };

  const handleDragLeaveCart = (e: React.DragEvent<HTMLElement>) => {
    // Only deactivate if leaving the container itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverCart(false);
  };

  const handleDropOnCart = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOverCart(false);

    // 1. Masa Sürükle-Bırak Kontrolü
    const rawTable = e.dataTransfer.getData("application/pos-table");
    if (rawTable || draggedTable) {
      try {
        const table: TableDTO = rawTable ? JSON.parse(rawTable) : draggedTable;
        if (table) {
          handleSelectTable(table);
          toast.success(`${table.label} masası ve adisyonu yüklendi!`);
          return;
        }
      } catch {
        if (draggedTable) {
          handleSelectTable(draggedTable);
          toast.success(`${draggedTable.label} masası ve adisyonu yüklendi!`);
          return;
        }
      } finally {
        setDraggedTable(null);
      }
    }

    // 2. Ürün Sürükle-Bırak Kontrolü
    try {
      const raw = e.dataTransfer.getData("application/json");
      const item: MenuItemDTO = raw ? JSON.parse(raw) : draggedItem;
      if (item) {
        if (item.variants.length > 0 || item.modifierGroups.length > 0) {
          setConfigItem(item);
        } else {
          quickAdd(item);
          toast.success(`${item.name} adisyona eklendi!`, {
            duration: 1500,
          });
        }
      }
    } catch (err) {
      if (draggedItem) {
        if (draggedItem.variants.length > 0 || draggedItem.modifierGroups.length > 0) {
          setConfigItem(draggedItem);
        } else {
          quickAdd(draggedItem);
          toast.success(`${draggedItem.name} adisyona eklendi!`, {
            duration: 1500,
          });
        }
      }
    } finally {
      setDraggedItem(null);
      setDraggedTable(null);
    }
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
      else if (paymentMethod === "SPLIT") {
        modeLabel = splitPayments.length > 0
          ? `Parçalı Ödeme (${splitPayments.map((p) => `${p.methodLabel}: ${formatCurrency(p.amount)}`).join(", ")})`
          : "Parçalı Ödeme";
      }
      else if (paymentMethod === "QR") modeLabel = "FAST / QR Kod";

      let currentServiceTypeLabel = "Gel-Al / Paket";
      if (selectedTableId || serviceType === "DINE_IN") {
        const tbl = tables.find((t) => t.id === selectedTableId);
        currentServiceTypeLabel = tbl ? `Masada Servis (${tbl.label})` : "Masada Servis";
      } else if (serviceType === "DELIVERY") {
        currentServiceTypeLabel = "Paket Servis / Kurye";
      }

      setCompletedSale({
        orderId: res.orderId,
        orderNumber: res.orderNumber,
        grandTotal: res.grandTotal,
        paidAmount: res.paidAmount,
        tenderedAmount: res.tenderedAmount,
        changeAmount: res.changeAmount,
        paymentModeLabel: modeLabel,
        serviceTypeLabel: currentServiceTypeLabel,
        invoiceUrl: res.invoiceUrl,
        kotUrl: res.kotUrl,
      });

      // Clear terminal state for next sale
      clear();
      setSplitPayments([]);
      setSplitInputAmount("");
      setDiscount({ type: "NONE", value: 0 });
      setCashTenderedStr("");
      setCustomerName("");
      setCustomerPhone("");
      toast.success(`Satış Tamamlandı! Fiş #${res.orderNumber}`, {
        description: `Tutar: ${formatCurrency(res.grandTotal)} | Paraüstü: ${formatCurrency(res.changeAmount)}`,
      });
      router.refresh();
    },
    onError: (msg) => {
      toast.error(msg || "Satış işlemi sırasında bir hata oluştu");
    },
  });

  // Server Action for Receipt Cancellation
  const cancelReceipt = useServerAction(cancelCashierReceiptAction, {
    onSuccess: () => {
      toast.success("Fiş başarıyla iptal edildi ve Z Raporu / Analitik kayıtlarına işlendi.");
      clear();
      setSelectedTableId(null);
      setDiscount({ type: "NONE", value: 0 });
      setCashTenderedStr("");
      setSplitPayments([]);
      setSplitInputAmount("");
      setCustomerName("");
      setCustomerPhone("");
      setCancelReceiptOpen(false);
      setCancelReason("Müşteri Vazgeçti");
      setCustomCancelReason("");
      router.refresh();
    },
    onError: (msg) => {
      toast.error(msg || "Fiş iptal edilirken bir hata oluştu");
    },
  });

  const handleConfirmCancelReceipt = () => {
    const finalReason =
      cancelReason === "Diğer"
        ? customCancelReason.trim() || "Diğer"
        : customCancelReason.trim()
          ? `${cancelReason} (${customCancelReason.trim()})`
          : cancelReason;

    cancelReceipt.execute({
      orderId: currentTicket.existingOrderId ?? undefined,
      tableId: selectedTableId ?? undefined,
      reason: finalReason,
      items: cart.map((l) => ({
        menuItemId: l.menuItemId,
        variantId: l.variantId ?? undefined,
        quantity: l.quantity,
        lineNote: l.lineNote ?? undefined,
        isComp: l.isComp,
        compReason: l.isComp ? "Kasa İkramı" : undefined,
        modifierIds: l.modifiers.map((m) => m.id),
      })),
    });
  };

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
      if (splitPayments.length === 0) {
        toast.error("Henüz parçalı ödeme kalemi eklenmedi! Lütfen en az bir ödeme parçası ekleyin.");
        return;
      }
      if (totalPaidSplit < bill.grandTotal) {
        toast.error(
          `Parçalı ödemeler toplamı (${formatCurrency(totalPaidSplit)}) hesap tutarını (${formatCurrency(bill.grandTotal)}) karşılamıyor! Kalan: ${formatCurrency(bill.grandTotal - totalPaidSplit)}`
        );
        return;
      }
      payments = splitPayments.map((p) => ({
        mode: p.mode,
        amount: p.amount,
        reference: p.reference || p.methodLabel,
      }));
    }

    const payload = {
      idempotencyKey: uuid(),
      orderId: currentTicket.existingOrderId ?? undefined,
      orderType: selectedTableId ? ("DINE_IN" as const) : serviceType,
      tableId: selectedTableId ?? undefined,
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
    <div className="fixed inset-0 z-40 flex flex-col h-screen max-h-screen w-screen max-w-screen overflow-hidden bg-[#f8fafc] select-none">
      {/* 1. ÜST KASA KONTROL ÇUBUĞU (HEADER) */}
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-4.5 py-2.5 bg-white border-b border-slate-200 shadow-2xs z-20 gap-2 sm:gap-3">
        {/* Sol: Ürünler & Masalar Ok Butonu + Arama Girişi */}
        <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-md">
          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0 group"
            title="Ürünler ve Masalar Panelini Aç"
          >
            <ChevronRightIcon className="size-4 text-rose-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Ürünler & Masalar</span>
            <span className="sm:hidden">Katalog</span>
          </button>

          <div className="relative flex-1 min-w-0">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (!isCatalogOpen) setIsCatalogOpen(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isCatalogOpen) setIsCatalogOpen(true);
              }}
              placeholder="Ürün veya barkod ara..."
              className="w-full pl-8.5 pr-8 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-slate-50/90 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-300 focus:bg-white transition-all shadow-inner"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCatalogOpen(true);
                    toast.info("Barkod / QR okuyucu aktif");
                  }}
                  title="Barkod / QR Okut"
                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  <QrCodeIcon className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orta: Fiş 01 - Fiş 05 Sekmeleri */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {tickets.map((ticket) => {
            const isActive = ticket.id === activeTicketId;
            const itemCount = ticket.cart.reduce((s, l) => s + l.quantity, 0);
            const hasCart = itemCount > 0;
            const hasTable = !!ticket.selectedTableId;
            const tableName = hasTable ? tables.find((t) => t.id === ticket.selectedTableId)?.label : null;

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setActiveTicketId(ticket.id)}
                title={hasTable ? `${ticket.label} (${tableName})` : `${ticket.label} (${itemCount} Kalem)`}
                className={cn(
                  "px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1 sm:gap-1.5",
                  isActive
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <span>{ticket.label}</span>
                {(hasCart || hasTable) && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {hasTable ? `🪑 ${tableName || ""}` : `${itemCount}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sağ: Panele Dön & Kasiyer / Restoran Profili */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            title="Yönetim Paneline Dön"
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeftIcon className="size-3.5 text-slate-500" />
            <span className="hidden md:inline">Panele Dön</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="size-8 sm:size-9 rounded-full bg-rose-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
              {cashierName ? cashierName.charAt(0).toUpperCase() : "K"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {cashierName}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 leading-tight">
                Kasa: {restaurantName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SOL KENARDA SABİT OK BUTONU (ÇEKMECEYİ TETİKLEYEN HIZLI ERİŞİM) */}
      {!isCatalogOpen && (
        <button
          type="button"
          onClick={() => setIsCatalogOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 py-4 pl-2 pr-3 bg-slate-900 hover:bg-rose-600 text-white rounded-r-2xl shadow-2xl border-y border-r border-slate-700 hover:border-rose-500 cursor-pointer transition-all hover:pl-3 group select-none"
          title="Ürünler ve Masalar Panelini Aç"
        >
          <ChevronRightIcon className="size-5 text-rose-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
          <div className="flex flex-col text-left leading-none pr-0.5">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 group-hover:text-rose-100">Katalog</span>
            <span className="text-xs font-black tracking-tight">Ürün & Masa</span>
          </div>
        </button>
      )}

      {/* 3. SOLDAN AÇILAN ÇEKMECE PANELİ (MASALAR VE ÜRÜNLER EKRANI) */}
      {isCatalogOpen && (
        <div
          onClick={() => setIsCatalogOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-full sm:w-[580px] md:w-[700px] lg:w-[840px] xl:w-[940px] max-w-[96vw] bg-white shadow-2xl border-r border-slate-200 flex flex-col transition-transform duration-300 ease-out",
          isCatalogOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        {/* Panel Üst Başlığı (Paneli Daralt Butonu + Sekmeler + Arama) */}
        <div className="p-3 sm:p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 shadow-2xs">
          {/* Sol: Paneli Daralt Butonu */}
          <button
            type="button"
            onClick={() => setIsCatalogOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs sm:text-sm border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer shrink-0"
            title="Paneli Daralt ve Satış Ekranına Dön"
          >
            <ChevronLeftIcon className="size-4" />
            <span>Paneli Daralt</span>
          </button>

          {/* Orta: Ürünler / Masalar Geçiş Sekmeleri */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveMainTab("PRODUCTS")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                activeMainTab === "PRODUCTS"
                  ? "bg-white text-rose-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <UtensilsCrossedIcon className="size-3.5" />
              <span>Ürünler ({menu.items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("TABLES")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                activeMainTab === "TABLES"
                  ? "bg-white text-rose-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ArmchairIcon className="size-3.5" />
              <span>Masalar ({tables.length})</span>
            </button>
          </div>

          {/* Sağ: Kapat Çarpı Butonu */}
          <button
            type="button"
            onClick={() => setIsCatalogOpen(false)}
            className="size-8 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
            title="Kapat"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Panel İçi: A) ÜRÜNLER SEÇİLİYSE */}
        {activeMainTab === "PRODUCTS" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f8fafc]">
            {/* Yatay Kategori Çubuğu */}
            <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80 flex items-center gap-2 shrink-0 shadow-2xs">
              <div
                ref={categoryScrollRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
              >
                {/* Tümü */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={cn(
                    "shrink-0 flex flex-col justify-between p-2 rounded-xl min-w-[95px] sm:min-w-[110px] transition-all cursor-pointer border select-none text-left",
                    selectedCategory === "ALL"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-2xs"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <div
                      className={cn(
                        "size-6 rounded-lg flex items-center justify-center",
                        selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <LayoutGridIcon className="size-3.5" />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                        selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {menu.items.length}
                    </span>
                  </div>
                  <span className="text-xs font-bold tracking-tight block truncate">Tümü</span>
                </button>

                {/* FAVORİLER BUTONU (YENİ & FARKLI TASARIM) */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("FAVORITES")}
                  className={cn(
                    "shrink-0 relative overflow-hidden flex flex-col justify-between p-2 rounded-xl min-w-[115px] sm:min-w-[130px] transition-all cursor-pointer border select-none text-left group",
                    selectedCategory === "FAVORITES"
                      ? "bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40"
                      : "bg-gradient-to-br from-amber-50 via-yellow-50/80 to-white border-amber-200 text-amber-950 hover:border-amber-400 hover:shadow-xs"
                  )}
                >
                  <div className="absolute -top-4 -right-4 size-12 bg-amber-400/20 rounded-full blur-md pointer-events-none group-hover:scale-125 transition-transform" />
                  <div className="flex items-center justify-between w-full mb-0.5 z-10">
                    <div
                      className={cn(
                        "size-6 rounded-lg flex items-center justify-center transition-colors",
                        selectedCategory === "FAVORITES"
                          ? "bg-white/25 text-white"
                          : "bg-amber-100 text-amber-600 group-hover:bg-amber-200"
                      )}
                    >
                      <StarIcon className="size-3.5 fill-current" />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-black px-1.5 py-0.2 rounded-full border tracking-tight",
                        selectedCategory === "FAVORITES"
                          ? "bg-black/20 text-white border-white/20"
                          : "bg-amber-100/80 text-amber-800 border-amber-200"
                      )}
                    >
                      ★ {favorites.size}
                    </span>
                  </div>
                  <div className="z-10">
                    <span className="text-xs font-black tracking-tight block truncate">Favoriler</span>
                    <span
                      className={cn(
                        "text-[9px] font-bold block truncate",
                        selectedCategory === "FAVORITES" ? "text-amber-100" : "text-amber-700/80"
                      )}
                    >
                      {favorites.size} Özel Ürün
                    </span>
                  </div>
                </button>

                {/* Dinamik Kategoriler */}
                {menu.categories.map((cat) => {
                  const isCatActive = selectedCategory === cat.id;
                  const count = menu.items.filter((i) => i.categoryId === cat.id).length;
                  const Icon = getCategoryIconComponent(cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "shrink-0 flex flex-col justify-between p-2 rounded-xl min-w-[95px] sm:min-w-[110px] transition-all cursor-pointer border select-none text-left",
                        isCatActive
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-2xs"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-0.5">
                        <div
                          className={cn(
                            "size-6 rounded-lg flex items-center justify-center",
                            isCatActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                            isCatActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {count}
                        </span>
                      </div>
                      <span className="text-xs font-bold tracking-tight block truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollCategories("right")}
                className="size-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                title="Daha fazla kategori"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>

            {/* Ürün Kartları Izgarası */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0 bg-[#f8fafc]">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
                  <UtensilsCrossedIcon className="size-12 stroke-[1.5] mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">Aradığınız kriterde ürün bulunamadı</p>
                  <span className="text-xs text-slate-400">Aramayı temizleyin veya başka bir kategori seçin</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map((item, idx) => {
                    const cartCount = cartItemCounts[item.id] || 0;
                    const hasVariants = item.variants.length > 0 || item.modifierGroups.length > 0;
                    const primaryImage = item.images?.find((img) => img.isPrimary)?.url || item.images?.[0]?.url;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleTapItem(item)}
                        className="group relative rounded-2xl border border-slate-200/90 bg-white hover:border-rose-300 hover:shadow-md transition-all duration-150 select-none flex flex-col justify-between overflow-hidden cursor-pointer active:scale-[0.985]"
                      >
                        {/* Görsel Alanı (showItemImages aktif ve görsel varsa) */}
                        {showItemImages && primaryImage ? (
                          <div className="relative w-full aspect-[16/10] bg-slate-50 overflow-hidden border-b border-slate-100">
                            <Image
                              src={primaryImage}
                              alt={item.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                            />
                            <div className="absolute top-2 left-2 z-10">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs backdrop-blur-xs",
                                  idx % 3 === 0
                                    ? "bg-rose-500/90 text-white"
                                    : idx % 3 === 1
                                    ? "bg-amber-500/90 text-white"
                                    : "bg-emerald-500/90 text-white"
                                )}
                              >
                                {idx % 3 === 0 ? "★ En Çok Satan" : idx % 3 === 1 ? "★ Popüler" : "★ Şefin Seçimi"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(item.id, e)}
                              title="Favorilere Ekle / Çıkar"
                              className="absolute top-2 right-2 z-10 size-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:bg-white transition-colors cursor-pointer"
                            >
                              <HeartIcon
                                className={cn(
                                  "size-3.5 transition-colors",
                                  favorites.has(item.id)
                                    ? "fill-rose-600 text-rose-600"
                                    : "text-slate-400 hover:text-rose-600"
                                )}
                              />
                            </button>
                          </div>
                        ) : (
                          /* Görsel yoksa veya kapalıysa: Temiz kompakt rozet */
                          <div className="p-2.5 pb-0 flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {categoryMap.get(item.categoryId) || "Menü"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(item.id, e)}
                              title="Favorilere Ekle / Çıkar"
                              className="size-6 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <HeartIcon
                                className={cn(
                                  "size-3.5 transition-colors",
                                  favorites.has(item.id)
                                    ? "fill-rose-600 text-rose-600"
                                    : "text-slate-400 hover:text-rose-600"
                                )}
                              />
                            </button>
                          </div>
                        )}

                        {/* Alt Gövde */}
                        <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                              {item.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel İçi: B) MASALAR SEÇİLİYSE */}
        {activeMainTab === "TABLES" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f8fafc]">
            {/* Masa Durum Filtreleri */}
            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTableFilter("ALL")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    tableFilter === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  )}
                >
                  Tüm Masalar ({tables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter("OCCUPIED")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    tableFilter === "OCCUPIED"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                  )}
                >
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Dolu Masalar ({occupiedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter("EMPTY")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    tableFilter === "EMPTY"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                  )}
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Boş Masalar ({tables.length - occupiedCount})</span>
                </button>
              </div>
            </div>

            {/* Masa Kartları Izgarası */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 min-h-0">
              {filteredTables.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                  <ArmchairIcon className="size-12 stroke-[1.5] mb-2 text-gray-300" />
                  <p className="text-sm font-bold text-gray-600">Aradığınız kriterde masa bulunamadı</p>
                  <span className="text-xs text-gray-400">Aramayı temizleyin veya başka bir filtre seçin</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredTables.map((table, idx) => {
                    const isOccupied = Boolean(occupied[table.id] || tableOrderMap.get(table.id));
                    const existingOrder = tableOrderMap.get(table.id) || (occupied[table.id] ? openOrders.find(o => o.id === occupied[table.id]) : undefined);
                    const isSelected = selectedTableId === table.id;
                    const lineCount = existingOrder ? existingOrder.lines.filter(l => l.state !== "VOID").reduce((s, l) => s + l.quantity, 0) : 0;

                    const occupiedGradients = [
                      "from-[#be123c] via-[#e11d48] to-[#881337]",
                      "from-[#c2410c] via-[#ea580c] to-[#9a3412]",
                      "from-[#b91c1c] via-[#dc2626] to-[#7f1d1d]",
                    ];
                    const emptyGradients = [
                      "from-[#047857] via-[#059669] to-[#065f46]",
                      "from-[#1d4ed8] via-[#2563eb] to-[#1e40af]",
                      "from-[#334155] via-[#475569] to-[#1e293b]",
                    ];

                    const gradient = isOccupied
                      ? occupiedGradients[idx % occupiedGradients.length]
                      : emptyGradients[idx % emptyGradients.length];

                    return (
                      <div
                        key={table.id}
                        onClick={() => {
                          handleSelectTable(table);
                          setIsCatalogOpen(false);
                        }}
                        className={cn(
                          "group relative rounded-2xl overflow-hidden cursor-pointer select-none flex flex-col justify-between transition-all duration-200 transform-gpu p-3.5",
                          `bg-gradient-to-br ${gradient}`,
                          "border-t border-t-white/40 border-x border-white/10 border-b-[3px] border-b-black/40",
                          "shadow-md hover:-translate-y-1 hover:shadow-lg",
                          isSelected && "ring-4 ring-blue-400/90",
                          "min-h-[160px]"
                        )}
                      >
                        <div className="flex items-center justify-between z-10">
                          <span className="text-xs font-black text-white bg-black/45 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1.5">
                            <ArmchairIcon className="size-3.5" />
                            <span>{table.label}</span>
                          </span>

                          {isOccupied ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-white bg-red-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-red-400/40 shadow-xs">
                              <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                              <span>DOLU</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-200 bg-emerald-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/30 shadow-xs">
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                              <span>BOŞ</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between z-10">
                          {isOccupied && existingOrder ? (
                            <div className="flex flex-col">
                              <span className="text-[11px] text-white/80 font-semibold">
                                {lineCount} Ürün • Sipariş Açık
                              </span>
                              <span className="text-sm font-black text-white font-mono">
                                {formatCurrency(getTableOrderTotal(existingOrder))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-white/80 font-medium">
                              {table.seats ? `${table.seats} Kişilik Masa` : "Kullanıma Hazır"}
                            </span>
                          )}

                          <span className="px-2.5 py-1 rounded-xl bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold transition-colors">
                            {isOccupied ? "Adisyonu Aç →" : "Masayı Seç →"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel Alt Bilgi & Kapatma Çubuğu */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
              {currentTicket.label}
            </span>
            <span className="text-xs font-bold text-slate-600">
              {cart.reduce((s, l) => s + l.quantity, 0)} Kalem
            </span>
            <span className="text-sm font-black text-rose-600 font-mono">
              {formatCurrency(bill.grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCatalogOpen(false)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Satış & Ödeme Ekranına Dön</span>
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </aside>

      {/* 4. MOBİL EKRAN SEÇİM GEÇİŞİ (< 768px İÇİN ADİSYON vs ÖDEME) */}
      <div className="md:hidden flex items-center justify-between p-2 bg-white border-b border-slate-200 shrink-0">
        <div className="grid grid-cols-2 gap-1 w-full p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileSalesView("CART")}
            className={cn(
              "py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
              mobileSalesView === "CART" ? "bg-white text-rose-600 shadow-xs" : "text-slate-600"
            )}
          >
            📝 Adisyon ({cart.reduce((s, l) => s + l.quantity, 0)} Kalem)
          </button>
          <button
            type="button"
            onClick={() => setMobileSalesView("PAYMENT")}
            className={cn(
              "py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
              mobileSalesView === "PAYMENT" ? "bg-white text-rose-600 shadow-xs" : "text-slate-600"
            )}
          >
            💳 Ödeme ({formatCurrency(bill.grandTotal)})
          </button>
        </div>
      </div>

      {/* 5. ANA SATIŞ ÇALIŞMA ALANI (ASLA TAŞMAZ, 2 DENGELİ KOLON) */}
      <main className="flex-1 flex flex-col md:flex-row gap-3.5 p-3 sm:p-4 overflow-hidden min-h-0 bg-[#f8fafc]">
        {/* SOL KOLON: ADİSYON DETAYI & SEPET KALEMLERİ */}
        <section
          onDragOver={handleDragOverCart}
          onDragLeave={handleDragLeaveCart}
          onDrop={handleDropOnCart}
          className={cn(
            "flex-1 flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-0",
            mobileSalesView === "PAYMENT" ? "hidden md:flex" : "flex",
            isDragOverCart && "ring-4 ring-emerald-500/80 bg-emerald-50/20"
          )}
        >
          {/* Adisyon Üst Başlığı */}
          <div className="p-3 sm:p-3.5 border-b border-slate-200 bg-white flex flex-col gap-2.5 shrink-0 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-8 sm:size-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ReceiptIcon className="size-4 sm:size-4.5" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight whitespace-nowrap">
                    Adisyon Fişi
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap">
                    {currentTicket.label}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                    {cart.reduce((s, l) => s + l.quantity, 0)} Kalem
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="h-7.5 sm:h-8 px-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <PlusIcon className="size-3.5" />
                  <span>Ürün Ekle</span>
                </button>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clear()}
                    title="Sepeti Boşalt"
                    className="h-7.5 sm:h-8 px-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Masa Durumu & Masaya Bağla */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              {selectedTableId ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500">Seçili Masa:</span>
                  </div>

                  <div className="inline-flex items-center rounded-xl bg-blue-50 border border-blue-200/90 text-blue-700 h-7 pl-2.5 pr-1 text-xs font-black shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMainTab("TABLES");
                        setIsCatalogOpen(true);
                      }}
                      title="Masayı Değiştir"
                      className="flex items-center gap-1 hover:text-blue-900 cursor-pointer"
                    >
                      <span>🪑 {tables.find((t) => t.id === selectedTableId)?.label || "Masa"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTableId(null)}
                      title="Masayı Kaldır"
                      className="size-5 ml-1 rounded-md text-blue-400 hover:text-red-600 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 truncate">
                    {serviceType === "TAKEAWAY"
                      ? "🛍️ Gel-Al / Paket Satışı"
                      : serviceType === "DELIVERY"
                      ? "🛵 Paket Servis / Kurye"
                      : "⚡ Hızlı Satış (Masasız)"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMainTab("TABLES");
                      setIsCatalogOpen(true);
                    }}
                    className="h-7 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50/50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer transition-colors"
                  >
                    <span>🪑 Masaya Bağla</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Servis Türü Seçici */}
          <div className="p-2.5 pb-1 bg-white shrink-0">
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setServiceType("TAKEAWAY");
                  setSelectedTableId(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-black transition-all cursor-pointer select-none",
                  serviceType === "TAKEAWAY"
                    ? "bg-white text-rose-700 shadow-sm border border-slate-200/80 ring-1 ring-rose-500/20"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ShoppingBagIcon className="size-3.5 shrink-0 text-rose-600" />
                <span className="truncate">Gel-Al / Paket</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setServiceType("DINE_IN");
                  if (!selectedTableId) {
                    setActiveMainTab("TABLES");
                    setIsCatalogOpen(true);
                  }
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-black transition-all cursor-pointer select-none",
                  serviceType === "DINE_IN"
                    ? "bg-white text-rose-700 shadow-sm border border-slate-200/80 ring-1 ring-rose-500/20"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ArmchairIcon className="size-3.5 shrink-0 text-rose-600" />
                <span className="truncate">Masada Servis</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setServiceType("DELIVERY");
                  setSelectedTableId(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-black transition-all cursor-pointer select-none",
                  serviceType === "DELIVERY"
                    ? "bg-white text-rose-700 shadow-sm border border-slate-200/80 ring-1 ring-rose-500/20"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <BikeIcon className="size-3.5 shrink-0 text-rose-600" />
                <span className="truncate">Paket Servis</span>
              </button>
            </div>
          </div>

          {/* Sepet Ürün Satırları (SADECE BURASI İÇTEN KAYDIRILIR) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center my-auto py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-6">
                <div className="size-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-2.5 text-rose-500">
                  <ReceiptIcon className="size-7 stroke-[1.5]" />
                </div>
                <p className="text-sm font-bold text-slate-800">Adisyonda Henüz Ürün Yok</p>
                <span className="text-xs text-slate-500 max-w-[260px] mt-1 mb-4">
                  Sol menüdeki oka tıklayarak veya aşağıdaki butondan ürün ekleyebilirsiniz.
                </span>
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <PlusIcon className="size-4" />
                  <span>Ürün & Masa Kataloğunu Aç</span>
                </button>
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.key}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all gap-2"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-slate-800 truncate">
                        {line.name}
                      </span>
                    </div>
                  </div>

                  {/* Adet Kontrolleri */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => changeQty(line.key, -1)}
                        className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      >
                        <MinusIcon className="size-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-black text-slate-900 font-mono">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQty(line.key, 1)}
                        className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      >
                        <PlusIcon className="size-3" />
                      </button>
                    </div>

                    {/* Satır Toplamı */}
                    <span className="w-18 text-right font-black text-xs sm:text-sm text-slate-900 font-mono">
                      {line.isComp ? "0.00 ₺" : formatCurrency((line.unitPrice + line.modifiers.reduce((s, m) => s + m.priceDelta, 0)) * line.quantity)}
                    </span>

                    {/* Satır Sil */}
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="size-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SAĞ KOLON: ÖDEME & FİNANSAL KASA PANELİ */}
        <section
          className={cn(
            "flex-1 flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-0 justify-between",
            mobileSalesView === "CART" ? "hidden md:flex" : "flex"
          )}
        >
          {/* 1. İndirim / İskonto Çubuğu (Kompakt) */}
          <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <TagIcon className="size-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">İndirim / İskonto:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDiscount({ type: "NONE", value: 0 })}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  discount.type === "NONE" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={() => setDiscount({ type: "PERCENT", value: 10 })}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  discount.type === "PERCENT" && discount.value === 10 ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                %10
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
                  "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  discount.type === "FLAT" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                Özel ₺
              </button>
            </div>
          </div>

          {/* 2. Finansal Özet & Büyük Ödenecek Tutar (Kompakt) */}
          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Ara Toplam: {formatCurrency(bill.subtotal)}</span>
              {bill.discountTotal > 0 && (
                <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  İndirim: -{formatCurrency(bill.discountTotal)}
                </span>
              )}
              <span>KDV (%10): {formatCurrency(bill.taxTotal)}</span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700">
                ÖDENECEK TUTAR:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight tabular-nums font-mono">
                {formatCurrency(bill.grandTotal)}
              </span>
            </div>
          </div>

          {/* 3. Ödeme Yöntemi Sekmeleri */}
          <div className="p-3 pb-1 bg-white shrink-0">
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={cn(
                  "py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                  paymentMethod === "CASH" ? "bg-rose-600 text-white" : "text-slate-600"
                )}
              >
                💵 Nakit
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={cn(
                  "py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                  paymentMethod === "CARD" ? "bg-rose-600 text-white" : "text-slate-600"
                )}
              >
                💳 Kart
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("MEAL_VOUCHER")}
                className={cn(
                  "py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                  paymentMethod === "MEAL_VOUCHER" ? "bg-rose-600 text-white" : "text-slate-600"
                )}
              >
                <WalletIcon className="size-3.5" />
                <span className="truncate">Yemek</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("SPLIT")}
                className={cn(
                  "py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                  paymentMethod === "SPLIT" ? "bg-rose-600 text-white" : "text-slate-600"
                )}
              >
                <PercentIcon className="size-3.5" />
                <span>Parçalı</span>
              </button>
            </div>
          </div>

          {/* 4. Ödeme Yöntemi Detay Alanı (SADECE BURASI İÇTEN KAYDIRILIR) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 flex flex-col gap-3">
            {/* A) NAKİT SEÇİLİYSE */}
            {paymentMethod === "CASH" && (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNumpad("EXACT")}
                    className="py-2 rounded-xl bg-slate-900 text-white font-black text-[10px] cursor-pointer"
                  >
                    Tam
                  </button>
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickBanknote(amt)}
                      className="py-2 rounded-xl bg-slate-50 border text-slate-800 font-bold text-[10px] cursor-pointer"
                    >
                      {amt} ₺
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-slate-50 border">
                    <span className="text-[9px] font-bold text-slate-500">ALINAN</span>
                    <input
                      type="text"
                      value={cashTenderedStr}
                      onChange={(e) => setCashTenderedStr(e.target.value)}
                      className="w-full bg-transparent font-black text-sm font-mono"
                    />
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[9px] font-bold text-emerald-700">PARA ÜSTÜ</span>
                    <div className="font-black text-sm text-emerald-950 font-mono">
                      {formatCurrency(changeDue)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "00", "CLEAR"].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleNumpad(key)}
                      className="py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold shadow-sm active:scale-95"
                    >
                      {key === "CLEAR" ? "Sil" : key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Sabit Alt Butonlar (HER ZAMAN GÖRÜNÜR, ASLA TAŞMAZ, EN ALTTA) */}
          <div className="p-3 sm:p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                if (cart.length === 0 && !selectedTableId && !currentTicket.existingOrderId) {
                  toast.error("İptal edilecek bir fiş veya sepet bulunmuyor!");
                  return;
                }
                setCancelReceiptOpen(true);
              }}
              className="py-3.5 px-3 sm:px-4 rounded-2xl font-bold text-xs text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1.5 shrink-0"
            >
              <XCircleIcon className="size-4" />
              <span>Fiş İptal</span>
            </button>

            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitSale.isPending}
              className="flex-1 py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2"
            >
              <CheckCircle2Icon className="size-5" />
              <span>Siparişi Tamamla</span>
            </button>
          </div>
        </section>
      </main>

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
                <span>Servis Türü:</span>
                <span className="text-gray-900 font-black">{completedSale.serviceTypeLabel || "Gel-Al / Paket"}</span>
              </div>
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
      {/* 6. MASAYA EKLEME VE İÇERİĞİ YÜKLEME MODALI */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
                  <UtensilsCrossedIcon className="size-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Masaya Sipariş Bağla / İçeriği Çek</h3>
                  <p className="text-xs text-gray-500">Dolu bir masa seçerseniz mevcut adisyonu satış ekranına yüklenir.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Masa Listesi */}
            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {tables.map((table) => {
                const isOccupied = Boolean(occupied[table.id] || tableOrderMap.get(table.id));
                const existingOrder = tableOrderMap.get(table.id) || (occupied[table.id] ? openOrders.find(o => o.id === occupied[table.id]) : undefined);
                const isSelected = selectedTableId === table.id;

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => handleSelectTable(table)}
                    className={cn(
                      "p-3 rounded-2xl flex flex-col justify-between text-left transition-all border cursor-pointer select-none relative",
                      isOccupied
                        ? "bg-gradient-to-br from-red-500 to-red-700 text-white border-red-600 shadow-sm hover:brightness-105 active:scale-95"
                        : "bg-white hover:bg-emerald-50 text-gray-900 border-gray-200 hover:border-emerald-300 shadow-2xs active:scale-95",
                      isSelected && "ring-3 ring-blue-500 ring-offset-2"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn("text-sm font-black truncate", isOccupied ? "text-white" : "text-gray-900")}>
                        {table.label}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                          isOccupied
                            ? "bg-black/30 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        )}
                      >
                        {isOccupied ? "DOLU" : "BOŞ"}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/20 flex flex-col">
                      {isOccupied && existingOrder ? (
                        <>
                          <span className="text-[10px] text-white/80 font-medium">
                            {existingOrder.lines.filter(l => l.state !== "VOID").reduce((s, l) => s + l.quantity, 0)} Ürün
                          </span>
                          <span className="text-xs font-black text-white font-mono">
                            {formatCurrency(getTableOrderTotal(existingOrder))}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-semibold">
                          {table.seats ? `${table.seats} Kişilik` : "Müsait"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. FİŞ İPTAL / VAZGEÇİLDİ MODALI */}
      {cancelReceiptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <XCircleIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Fiş İptal / Satıştan Vazgeçildi</h3>
                  <span className="text-xs text-slate-500">Bu işlem Z Raporu ve Analitik kayıtlarına işlenir.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelReceiptOpen(false)}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="my-3.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs">
              <span className="text-rose-900 font-bold">İptal Edilecek Tutar:</span>
              <span className="text-base font-black text-rose-700 font-mono">
                {formatCurrency(bill.grandTotal > 0 ? bill.grandTotal : 0)}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-700">Lütfen İptal Nedenini Seçin:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_RECEIPT_CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCancelReason(r)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer",
                      cancelReason === r
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[11px] font-semibold text-slate-500">
                  {cancelReason === "Diğer" ? "İptal Açıklaması (Zorunlu):" : "Ek Açıklama / Not (İsteğe bağlı):"}
                </label>
                <input
                  type="text"
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder={cancelReason === "Diğer" ? "İptal gerekçesini yazın..." : "Örn: Müşteri ödemeden vazgeçti..."}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelReceiptOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelReceipt}
                disabled={cancelReceipt.isPending || (cancelReason === "Diğer" && !customCancelReason.trim())}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all cursor-pointer",
                  "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-sm",
                  "disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                )}
              >
                {cancelReceipt.isPending ? (
                  <>
                    <RefreshCwIcon className="size-3.5 animate-spin" />
                    <span>İptal Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="size-3.5" />
                    <span>Fişi İptal Et</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
