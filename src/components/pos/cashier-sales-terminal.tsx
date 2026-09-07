"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BanknoteIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  DeleteIcon,
  MinusIcon,
  PercentIcon,
  PlusIcon,
  PrinterIcon,
  RadioIcon,
  ReceiptIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
  WalletIcon,
  WifiIcon,
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

export type PaymentMethodType = "CASH" | "CARD" | "MEAL_VOUCHER" | "QR" | "SPLIT";

export const MEAL_VOUCHERS = [
  { id: "multinet", name: "Multinet", color: "text-amber-600", border: "border-amber-300", bg: "bg-amber-50" },
  { id: "sodexo", name: "Sodexo (Pluxee)", color: "text-blue-600", border: "border-blue-300", bg: "bg-blue-50" },
  { id: "ticket", name: "Ticket Edenred", color: "text-red-600", border: "border-red-300", bg: "bg-red-50" },
  { id: "setcard", name: "Setcard", color: "text-emerald-600", border: "border-emerald-300", bg: "bg-emerald-50" },
  { id: "metropol", name: "Metropol Card", color: "text-purple-600", border: "border-purple-300", bg: "bg-purple-50" },
];

export interface ProcessedPayment {
  id: string;
  method: "CASH" | "CARD" | "MEAL_VOUCHER";
  amount: number;
  label: string;
  timestamp: string;
  slipNumber?: string;
  tendered?: number;
  changeDue?: number;
}

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
  paidPayments: ProcessedPayment[];
}

const DEFAULT_TICKETS: ParkedTicketState[] = [
  { id: "1", label: "Fiş 01", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH", paidPayments: [] },
  { id: "2", label: "Fiş 02", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH", paidPayments: [] },
  { id: "3", label: "Fiş 03", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH", paidPayments: [] },
  { id: "4", label: "Fiş 04", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH", paidPayments: [] },
  { id: "5", label: "Fiş 05", cart: [], selectedTableId: null, existingOrderId: null, serviceType: "TAKEAWAY", discount: { type: "NONE", value: 0 }, customerName: "", customerPhone: "", cashTenderedStr: "", paymentMethod: "CASH", paidPayments: [] },
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
  restaurantName = "Oxonom POS",
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
      paidPayments: [],
    });
    setTenderAmountStr("");
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

  // Active virtual numpad tender input
  const [tenderAmountStr, setTenderAmountStr] = useState<string>("");

  // Cancel Receipt State
  const [cancelReceiptOpen, setCancelReceiptOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("Müşteri Vazgeçti");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");

  // Bill Computation
  const bill = useMemo(
    () => computeBill(cart.map(toBillLine), discount),
    [cart, discount],
  );

  // Paid payments on active ticket
  const paidPayments = currentTicket.paidPayments || [];
  const totalPaid = useMemo(
    () => Math.round((paidPayments.reduce((s, p) => s + p.amount, 0) + Number.EPSILON) * 100) / 100,
    [paidPayments]
  );
  const remainingBalance = useMemo(
    () => Math.max(0, Math.round(((bill.grandTotal - totalPaid) + Number.EPSILON) * 100) / 100),
    [bill.grandTotal, totalPaid]
  );

  // Live amount entered on numpad (defaults to remainingBalance if cashier hasn't typed anything)
  const enteredAmount = useMemo(() => {
    if (!tenderAmountStr) return remainingBalance;
    const clean = tenderAmountStr.replace(",", ".");
    const val = parseFloat(clean);
    return isNaN(val) ? remainingBalance : val;
  }, [tenderAmountStr, remainingBalance]);

  // Remaining balance after this entered amount
  const remainingAfterEntered = useMemo(() => {
    return Math.max(0, Math.round(((remainingBalance - enteredAmount) + Number.EPSILON) * 100) / 100);
  }, [remainingBalance, enteredAmount]);

  // Live change due if cash tendered > remaining balance
  const liveChangeDue = useMemo(() => {
    return Math.max(0, Math.round(((enteredAmount - remainingBalance) + Number.EPSILON) * 100) / 100);
  }, [remainingBalance, enteredAmount]);

  // Categorized cart items for print receipt
  const categorizedCartItems = useMemo(() => {
    const categoryMap = new Map(menu.categories.map((c) => [c.id, c.name.toUpperCase()]));
    const itemMap = new Map(menu.items.map((it) => [it.id, it.categoryId]));
    const groups: Record<string, CartLine[]> = {};

    for (const item of cart) {
      const catId = itemMap.get(item.menuItemId);
      const catName = (catId && categoryMap.get(catId)) || "DİĞER ÜRÜNLER";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    }
    return groups;
  }, [cart, menu.categories, menu.items]);

  // Success Modal State (Categorized Customer Receipt)
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
    categorizedItems?: Record<string, CartLine[]>;
    paymentsList?: ProcessedPayment[];
  } | null>(null);

  // POS Card Terminal Modal State
  const [posCardModal, setPosCardModal] = useState<{
    isOpen: boolean;
    amount: number;
    status: "CONNECTING" | "READING" | "APPROVED";
    slipNumber: string;
  } | null>(null);

  // Meal Voucher Modal State
  const [mealVoucherModal, setMealVoucherModal] = useState<{
    isOpen: boolean;
    amount: number;
    selectedBrand: string;
    slipNumber: string;
  } | null>(null);

  // Cancel & Refund Slip Modal State
  const [cancelSlipModal, setCancelSlipModal] = useState<{
    isOpen: boolean;
    ticketLabel: string;
    totalBill: number;
    totalPaid: number;
    remainingAmount: number;
    refundPayments: ProcessedPayment[];
    reason: string;
    timestamp: string;
  } | null>(null);

  // POS Card Simulation Flow Effect
  useEffect(() => {
    if (!posCardModal || !posCardModal.isOpen) return;
    if (posCardModal.status === "CONNECTING") {
      const timer = setTimeout(() => {
        setPosCardModal((prev) => (prev ? { ...prev, status: "READING" } : null));
      }, 700);
      return () => clearTimeout(timer);
    }
    if (posCardModal.status === "READING") {
      const timer = setTimeout(() => {
        setPosCardModal((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [posCardModal?.status, posCardModal?.isOpen]);

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

  // Numpad key input for cash/card/meal tender
  const handleNumpad = (val: string) => {
    if (val === "C" || val === "CLEAR") {
      setTenderAmountStr("");
      return;
    }
    if (val === "BACK" || val === "⌫") {
      setTenderAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === "EXACT" || val === "TAMAMI") {
      setTenderAmountStr(String(remainingBalance));
      return;
    }
    if (val === "." || val === ",") {
      if (!tenderAmountStr.includes(".") && !tenderAmountStr.includes(",")) {
        setTenderAmountStr((prev) => (prev ? `${prev},` : "0,"));
      }
      return;
    }
    if (val === "00") {
      if (tenderAmountStr) {
        setTenderAmountStr((prev) => `${prev}00`);
      }
      return;
    }
    setTenderAmountStr((prev) => `${prev}${val}`);
  };

  // Quick Banknote Click
  const handleQuickBanknote = (amount: number) => {
    setTenderAmountStr(String(amount));
  };

  // Server Action for Quick Sale
  const submitSale = useServerAction(quickCashierSaleAction, {
    onSuccess: (res) => {
      if (!res) return;

      let currentServiceTypeLabel = "Gel-Al / Paket";
      if (selectedTableId || serviceType === "DINE_IN") {
        const tbl = tables.find((t) => t.id === selectedTableId);
        currentServiceTypeLabel = tbl ? `Masada Servis (${tbl.label})` : "Masada Servis";
      } else if (serviceType === "DELIVERY") {
        currentServiceTypeLabel = "Paket Servis / Kurye";
      }

      const allPaymentsSnapshot = [...paidPayments];
      setCompletedSale({
        orderId: res.orderId,
        orderNumber: res.orderNumber,
        grandTotal: res.grandTotal,
        paidAmount: res.paidAmount,
        tenderedAmount: res.tenderedAmount,
        changeAmount: res.changeAmount,
        paymentModeLabel:
          allPaymentsSnapshot.length > 1
            ? `Parçalı (${allPaymentsSnapshot.length} Ödeme)`
            : allPaymentsSnapshot[0]?.label || "Nakit",
        serviceTypeLabel: currentServiceTypeLabel,
        invoiceUrl: res.invoiceUrl,
        kotUrl: res.kotUrl,
        categorizedItems: categorizedCartItems,
        paymentsList: allPaymentsSnapshot,
      });

      // Clear terminal state for next sale
      clear();
      setSelectedTableId(null);
      setDiscount({ type: "NONE", value: 0 });
      setCustomerName("");
      setCustomerPhone("");
      setCashTenderedStr("");
      setTenderAmountStr("");
      updateActiveTicket({ paidPayments: [] });
      toast.success(`Satış Tamamlandı! Fiş #${res.orderNumber}`, {
        description: `Tutar: ${formatCurrency(res.grandTotal)} | Paraüstü: ${formatCurrency(res.changeAmount)}`,
      });
      router.refresh();
    },
    onError: (msg) => {
      toast.error(msg || "Satış işlemi sırasında bir hata oluştu");
    },
  });

  // Finalize full order settlement
  const executeFinalSale = (finalPayments: ProcessedPayment[]) => {
    if (cart.length === 0) {
      toast.error("Sepetinizde ürün bulunmuyor!");
      return;
    }

    const paymentsPayload: PaymentInput[] = finalPayments.map((p) => ({
      mode: p.method === "CASH" ? "CASH" : p.method === "CARD" ? "CARD" : "OTHER",
      amount: p.amount,
      tendered: p.tendered ?? p.amount,
      reference: p.slipNumber ? `${p.label} (${p.slipNumber})` : p.label,
    }));

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
      payments: paymentsPayload,
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

  // Payment method handler (Nakit, Kart, Yemek Kartı)
  const handleProcessPayment = (method: "CASH" | "CARD" | "MEAL_VOUCHER") => {
    if (cart.length === 0) {
      toast.error("Sepetinizde ürün bulunmuyor!");
      return;
    }
    if (remainingBalance <= 0) {
      toast.info("Hesabın tamamı zaten ödendi!");
      return;
    }

    const payAmt = enteredAmount <= 0 ? remainingBalance : enteredAmount;
    if (payAmt <= 0) {
      toast.error("Lütfen geçerli bir ödeme tutarı girin!");
      return;
    }

    if (method === "CASH") {
      const effectivePay = Math.min(payAmt, remainingBalance);
      const change = Math.max(0, payAmt - remainingBalance);
      const newPayment: ProcessedPayment = {
        id: uuid(),
        method: "CASH",
        amount: effectivePay,
        tendered: payAmt,
        changeDue: change,
        label: "Nakit",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };

      const nextPayments = [...paidPayments, newPayment];
      updateActiveTicket({ paidPayments: nextPayments });
      setTenderAmountStr("");

      if (remainingBalance - effectivePay <= 0) {
        executeFinalSale(nextPayments);
      } else {
        toast.success(`Nakit ${formatCurrency(effectivePay)} tahsil edildi.`, {
          description: `Kalan Tutar: ${formatCurrency(remainingBalance - effectivePay)}`,
        });
      }
      return;
    }

    if (method === "CARD") {
      const effectivePay = Math.min(payAmt, remainingBalance);
      const randomSlip = `POS-${Math.floor(100000 + Math.random() * 900000)}`;
      setPosCardModal({
        isOpen: true,
        amount: effectivePay,
        status: "CONNECTING",
        slipNumber: randomSlip,
      });
      return;
    }

    if (method === "MEAL_VOUCHER") {
      const effectivePay = Math.min(payAmt, remainingBalance);
      const randomSlip = `YMK-${Math.floor(100000 + Math.random() * 900000)}`;
      setMealVoucherModal({
        isOpen: true,
        amount: effectivePay,
        selectedBrand: MEAL_VOUCHERS[0].name,
        slipNumber: randomSlip,
      });
      return;
    }
  };

  const handleConfirmCardPayment = () => {
    if (!posCardModal) return;
    const modalAmt = posCardModal.amount;
    const newPayment: ProcessedPayment = {
      id: uuid(),
      method: "CARD",
      amount: modalAmt,
      label: "Kredi Kartı",
      slipNumber: posCardModal.slipNumber,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    const nextPayments = [...paidPayments, newPayment];
    updateActiveTicket({ paidPayments: nextPayments });
    setPosCardModal(null);
    setTenderAmountStr("");

    if (remainingBalance - modalAmt <= 0) {
      executeFinalSale(nextPayments);
    } else {
      toast.success(`Kredi Kartı ile ${formatCurrency(modalAmt)} tahsil edildi.`, {
        description: `Kalan Tutar: ${formatCurrency(remainingBalance - modalAmt)}`,
      });
    }
  };

  const handleConfirmMealVoucherPayment = () => {
    if (!mealVoucherModal) return;
    const modalAmt = mealVoucherModal.amount;
    const newPayment: ProcessedPayment = {
      id: uuid(),
      method: "MEAL_VOUCHER",
      amount: modalAmt,
      label: `Yemek Kartı (${mealVoucherModal.selectedBrand})`,
      slipNumber: mealVoucherModal.slipNumber,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    const nextPayments = [...paidPayments, newPayment];
    updateActiveTicket({ paidPayments: nextPayments });
    setMealVoucherModal(null);
    setTenderAmountStr("");

    if (remainingBalance - modalAmt <= 0) {
      executeFinalSale(nextPayments);
    } else {
      toast.success(`${newPayment.label} ile ${formatCurrency(modalAmt)} tahsil edildi.`, {
        description: `Kalan Tutar: ${formatCurrency(remainingBalance - modalAmt)}`,
      });
    }
  };

  const handleRemovePayment = (paymentId: string) => {
    const removed = paidPayments.find((p) => p.id === paymentId);
    updateActiveTicket({
      paidPayments: paidPayments.filter((p) => p.id !== paymentId),
    });
    if (removed) {
      toast.info(`Ödeme kaydı silindi (${formatCurrency(removed.amount)}).`);
    }
  };

  // Server Action for Receipt Cancellation
  const cancelReceipt = useServerAction(cancelCashierReceiptAction, {
    onSuccess: () => {
      toast.success("Fiş başarıyla iptal edildi ve Z Raporu / Analitik kayıtlarına işlendi.");
      clear();
      setSelectedTableId(null);
      setDiscount({ type: "NONE", value: 0 });
      setCustomerName("");
      setCustomerPhone("");
      setCashTenderedStr("");
      setTenderAmountStr("");
      updateActiveTicket({ paidPayments: [] });
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

    const fullReason =
      paidPayments.length > 0
        ? `KISMİ ÖDEME İPTALİ / İADE (İade Edilen: ${formatCurrency(totalPaid)}, Kalan: ${formatCurrency(remainingBalance)}) - ${finalReason}`
        : finalReason;

    const snapshotPayments = [...paidPayments];
    const snapshotTotalPaid = totalPaid;
    const snapshotRemaining = remainingBalance;
    const snapshotBill = bill.grandTotal;

    cancelReceipt.execute({
      orderId: currentTicket.existingOrderId ?? undefined,
      tableId: selectedTableId ?? undefined,
      reason: fullReason,
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

    if (snapshotPayments.length > 0) {
      setCancelSlipModal({
        isOpen: true,
        ticketLabel: currentTicket.label,
        totalBill: snapshotBill,
        totalPaid: snapshotTotalPaid,
        remainingAmount: snapshotRemaining,
        refundPayments: snapshotPayments,
        reason: finalReason,
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      });
    }
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

    if (remainingBalance > 0) {
      // Prompt or automatically process remaining balance with CASH
      handleProcessPayment("CASH");
      return;
    }

    executeFinalSale(paidPayments);
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

      {/* 2. SOLDAN AÇILAN ÇEKMECE PANELİ (MASALAR VE ÜRÜNLER EKRANI) */}
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
        {/* Panel Üst Başlığı (Paneli Daralt Butonu + Ürün Arama + Sağa Kaydırılmış Sekmeler + Kapat) */}
        <div className="p-3 sm:p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-3 shrink-0 shadow-2xs">
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

          {/* Orta/Sağ: Ürün Arama Input Alanı + Sağa Kaydırılmış Masa ve Ürün Seç Alanı */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {/* Arama Input Alanı */}
            <div className="relative flex-1 max-w-xs sm:max-w-sm min-w-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={activeMainTab === "PRODUCTS" ? searchQuery : tableSearch}
                onChange={(e) => {
                  if (activeMainTab === "PRODUCTS") {
                    setSearchQuery(e.target.value);
                  } else {
                    setTableSearch(e.target.value);
                  }
                }}
                placeholder={activeMainTab === "PRODUCTS" ? "Ürün veya barkod ara..." : "Masa ara..."}
                className="w-full pl-8.5 pr-8 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-slate-50/90 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-300 focus:bg-white transition-all shadow-inner"
              />
              {(activeMainTab === "PRODUCTS" ? searchQuery : tableSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeMainTab === "PRODUCTS") setSearchQuery("");
                    else setTableSearch("");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            {/* Sağa Kaydırılmış Masa ve Ürün Seç Sekmeleri */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
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

                        {/* Masa Simgesi Rozeti */}
                        <div className="my-auto py-2 flex items-center justify-center z-10">
                          <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                            <ArmchairIcon className="size-6 stroke-[2.2]" />
                          </div>
                        </div>

                        <div className="mt-2 pt-2.5 border-t border-white/20 flex items-center justify-between z-10">
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

          {/* 2. Finansal Özet & Büyük Ödenecek Tutar + Parçalı Ödeme Listesi */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Ara Toplam: {formatCurrency(bill.subtotal)}</span>
              {bill.discountTotal > 0 && (
                <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  İndirim: -{formatCurrency(bill.discountTotal)}
                </span>
              )}
              <span>KDV (%10): {formatCurrency(bill.taxTotal)}</span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700">
                TOPLAM HESAP:
              </span>
              <span className="text-2xl font-black text-rose-600 tracking-tight tabular-nums font-mono">
                {formatCurrency(bill.grandTotal)}
              </span>
            </div>

            {/* Parçalı Ödeme Kayıtları ve Kalan Borç Şeridi */}
            {paidPayments.length > 0 && (
              <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700">
                    Tahsil Edilen: <span className="font-mono font-black">{formatCurrency(totalPaid)}</span>
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-md font-mono font-black", remainingBalance > 0 ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-900")}>
                    Kalan: {formatCurrency(remainingBalance)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {paidPayments.map((p) => (
                    <div
                      key={p.id}
                      className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold shadow-2xs"
                    >
                      <span className="text-slate-800">{p.label}:</span>
                      <span className="text-slate-950 font-mono font-black">{formatCurrency(p.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(p.id)}
                        className="text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer p-0.5 rounded hover:bg-red-50 transition-colors"
                        title="Ödemeyi İptal Et / Sil"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Tutar Girişi & Kalan Tutar / Para Üstü Ekranı (Dokunmatik LCD Ekran) */}
          <div className="p-3 bg-white border-b border-slate-200 shrink-0">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-inner flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">ÖDEME TUTARI GİRİŞİ</span>
                <span className="text-[11px] font-mono font-semibold text-slate-300">
                  {tenderAmountStr ? "Özel Tutar Girildi" : "Kalanın Tümü Seçili"}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  GİRİLEN:
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-1">
                  <span>{tenderAmountStr ? tenderAmountStr : formatCurrency(remainingBalance)}</span>
                  {tenderAmountStr && <span className="text-xs font-bold text-slate-400">₺</span>}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                {enteredAmount < remainingBalance ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <span>⚠️ Kalan Bakiye:</span>
                    <span className="font-mono font-black text-amber-300">{formatCurrency(remainingAfterEntered)}</span>
                  </span>
                ) : liveChangeDue > 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span>💰 PARA ÜSTÜ:</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">{formatCurrency(liveChangeDue)}</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckIcon className="size-3.5 text-emerald-400" />
                    <span>Bu işlem ile hesap tamamen kapanacak</span>
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  Kalan: {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. SABİT SANAL KLAVYE & HIZLI BANKNOTLAR (DOKUNMATİK EKRANLAR İÇİN ESTETİK NUMPAD) */}
          <div className="flex-1 min-h-0 p-3 pt-2 bg-white flex flex-col justify-between">
            {/* Hızlı Banknotlar Satırı */}
            <div className="grid grid-cols-6 gap-1.5 mb-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleNumpad("EXACT")}
                className="py-2 px-1 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-[10px] sm:text-xs text-center shadow-xs transition-all cursor-pointer"
                title="Kalan Borcun Tamamı"
              >
                Tamamı
              </button>
              {[20, 50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickBanknote(amt)}
                  className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-black text-[10px] sm:text-xs text-center border border-slate-200/80 transition-all cursor-pointer"
                >
                  +{amt}₺
                </button>
              ))}
            </div>

            {/* Dokunmatik Numpad Rakamları */}
            <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpad(digit)}
                  className="rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-900 font-mono font-black text-base sm:text-lg border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleNumpad("CLEAR")}
                className="rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 active:scale-95 text-rose-700 font-black text-xs sm:text-sm border border-rose-200 shadow-2xs flex items-center justify-center transition-all cursor-pointer select-none"
              >
                C (Sil)
              </button>
              <button
                type="button"
                onClick={() => handleNumpad("0")}
                className="rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-900 font-mono font-black text-base sm:text-lg border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleNumpad("BACK")}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-700 font-black text-sm border border-slate-300 shadow-2xs flex items-center justify-center transition-all cursor-pointer select-none"
                title="Geri Sil"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* 5. ÖDEME YÖNTEMLERİ (NUMPAD ALTINDA YER ALIR) */}
          <div className="px-3 pb-2 pt-1 bg-white shrink-0 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleProcessPayment("CASH")}
                disabled={remainingBalance <= 0}
                className="py-2.5 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <BanknoteIcon className="size-5" />
                <span>💵 Nakit</span>
              </button>

              <button
                type="button"
                onClick={() => handleProcessPayment("CARD")}
                disabled={remainingBalance <= 0}
                className="py-2.5 px-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <CreditCardIcon className="size-5" />
                <span>💳 Kredi Kartı</span>
              </button>

              <button
                type="button"
                onClick={() => handleProcessPayment("MEAL_VOUCHER")}
                disabled={remainingBalance <= 0}
                className="py-2.5 px-2 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <WalletIcon className="size-5" />
                <span>🎫 Yemek Kartı</span>
              </button>
            </div>
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

      {/* 5. SATIŞ BAŞARI VE KATEGORİZE MÜŞTERİ FİŞİ POPUP'I */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Üst Onay & Başlık */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <CheckCircle2Icon className="size-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Ödeme Başarıyla Tamamlandı!
                  </h2>
                  <span className="text-xs font-bold text-slate-500">
                    Fiş #{completedSale.orderNumber} • {completedSale.serviceTypeLabel || "Gel-Al / Paket"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Termal Müşteri Fişi Görünümü (Kategorize) */}
            <div className="my-3 flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 flex flex-col gap-2.5 select-text text-left shadow-inner">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-black text-sm text-slate-900 tracking-wider uppercase">{restaurantName}</div>
                <div className="text-[11px] text-slate-500">Kasa Satış & Tahsilat Belgesi</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Tarih: {new Date().toLocaleDateString("tr-TR")} {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-[10px] text-slate-500">Kasiyer: {cashierName}</div>
              </div>

              {/* Kategorize Ürün Listesi */}
              <div className="flex flex-col gap-2">
                {completedSale.categorizedItems && Object.entries(completedSale.categorizedItems).map(([cat, items]) => (
                  <div key={cat} className="flex flex-col">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider py-0.5 border-b border-slate-200">
                      [ {cat} ]
                    </div>
                    {items.map((line) => (
                      <div key={line.key} className="flex justify-between py-1 border-b border-slate-100 text-[11px]">
                        <span className="font-semibold text-slate-900">
                          {line.quantity}x {line.name} {line.variantName ? `(${line.variantName})` : ""}
                        </span>
                        <span className="font-bold font-mono">
                          {formatCurrency((line.unitPrice + line.modifiers.reduce((s, m) => s + m.priceDelta, 0)) * line.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Finansal Toplam */}
              <div className="pt-2 border-t-2 border-slate-900 flex flex-col gap-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span>ÖDENECEK GENEL TOPLAM:</span>
                  <span className="font-black font-mono text-sm">{formatCurrency(completedSale.grandTotal)}</span>
                </div>
              </div>

              {/* Ödeme Dökümü (Kategorize / Parçalı) */}
              <div className="pt-2 border-t border-dashed border-slate-300 flex flex-col gap-1 text-[11px]">
                <span className="font-black uppercase text-slate-600 tracking-wide">TAHSİLAT DÖKÜMÜ:</span>
                {completedSale.paymentsList && completedSale.paymentsList.length > 0 ? (
                  completedSale.paymentsList.map((p, idx) => (
                    <div key={p.id || idx} className="flex justify-between font-semibold text-slate-700">
                      <span>{idx + 1}. {p.label} {p.slipNumber ? `(${p.slipNumber})` : ""}</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{completedSale.paymentModeLabel}</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(completedSale.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>TOPLAM TAHSİLAT:</span>
                  <span className="font-mono">{formatCurrency(completedSale.paidAmount || completedSale.grandTotal)}</span>
                </div>
                {completedSale.changeAmount > 0 && (
                  <div className="flex justify-between font-black text-emerald-800 bg-emerald-100 px-2 py-1 rounded">
                    <span>PARA ÜSTÜ:</span>
                    <span className="font-mono font-bold">{formatCurrency(completedSale.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                *** BİLGİ FİŞİDİR - MALİ DEĞERİ YOKTUR ***
              </div>
            </div>

            {/* Fiş Yazdırma ve Yeni Satış Butonları */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="grid grid-cols-2 gap-2 w-full">
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
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 active:scale-95 transition-all"
                >
                  <UtensilsCrossedIcon className="size-3.5" />
                  <span>Mutfak Fişi (KOT)</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                + Yeni Satışa Geç (Tamam)
              </button>
            </div>
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
                      <span className={cn("text-sm font-black truncate flex items-center gap-1.5", isOccupied ? "text-white" : "text-gray-900")}>
                        <ArmchairIcon className="size-4 shrink-0 opacity-80" />
                        <span>{table.label}</span>
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

                    <div className="my-2 flex items-center justify-center">
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center border",
                        isOccupied 
                          ? "bg-white/20 border-white/30 text-white" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      )}>
                        <ArmchairIcon className="size-5 stroke-[2]" />
                      </div>
                    </div>

                    <div className="mt-1 pt-2 border-t border-white/20 flex flex-col">
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
                <div className="text-left">
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

            {/* KISMİ ÖDEME UYARISI (Eğer parça parça ödeme yapıldıysa) */}
            {paidPayments.length > 0 ? (
              <div className="my-3.5 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col gap-2 text-left">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <AlertTriangleIcon className="size-5 text-amber-600 animate-pulse" />
                  <span>KISMİ ÖDEME YAPILDI!</span>
                </div>
                <p className="text-xs text-amber-800 leading-snug">
                  Bu fişte kısmi ödeme alınmıştır. Fiş iptal edildiğinde yapılan tahsilat tutarı müşteriye iade edilecek ve POS iptal fişi kesilecektir.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-white border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Yapılan Ödeme (İade)</span>
                    <div className="text-sm font-black text-rose-600 font-mono">{formatCurrency(totalPaid)}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Kalan Ödenmemiş Tutar</span>
                    <div className="text-sm font-black text-slate-700 font-mono">{formatCurrency(remainingBalance)}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] font-bold text-amber-950 uppercase">İade Edilecek Tahsilat Kalemleri:</span>
                  {paidPayments.map((p, idx) => (
                    <div key={p.id} className="text-xs bg-amber-100/70 px-2 py-1 rounded-lg flex justify-between font-semibold text-amber-900">
                      <span>{idx + 1}. {p.label} {p.slipNumber ? `(${p.slipNumber})` : ""}</span>
                      <span className="font-mono font-black">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="my-3.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs">
                <span className="text-rose-900 font-bold">İptal Edilecek Tutar:</span>
                <span className="text-base font-black text-rose-700 font-mono">
                  {formatCurrency(bill.grandTotal > 0 ? bill.grandTotal : 0)}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-3 text-left">
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
                    <span>Fişi İptal Et {paidPayments.length > 0 ? "ve İadeyi Başlat" : ""}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. POS İPTAL / İADE FİŞİ MODALI */}
      {cancelSlipModal && cancelSlipModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col text-center animate-in zoom-in-95 duration-200">
            <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 mb-3">
              <PrinterIcon className="size-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              POS İptal & İade Fişi Çıktı
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              İşlem kaydedildi ve termal pos yazıcıdan iptal slibi basıldı.
            </p>

            {/* Termal İade Fişi Görünümü */}
            <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 flex flex-col gap-2 select-text text-left shadow-inner">
              <div className="text-center pb-2 border-b border-dashed border-slate-300 font-bold">
                <div className="text-xs font-black uppercase tracking-wider text-slate-900">*** T.C. İPTAL / İADE SLİBİ ***</div>
                <div className="text-[10px] text-slate-600 uppercase mt-0.5">{restaurantName}</div>
                <div className="text-[9px] text-slate-500">BEKO-POS-0042 • BATCH #008</div>
                <div className="text-[9px] text-slate-500">Tarih: {cancelSlipModal.timestamp}</div>
              </div>

              <div className="py-1 border-b border-dashed border-slate-300 flex flex-col gap-1">
                <div className="text-xs font-black text-rose-800 bg-rose-100 px-2 py-1 rounded text-center">
                  DURUM: KISMİ ÖDEME YAPILDI (İPTAL)
                </div>
                <div className="flex justify-between text-[11px] font-bold pt-1">
                  <span>TOPLAM HESAP:</span>
                  <span className="font-mono">{formatCurrency(cancelSlipModal.totalBill)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-rose-700">
                  <span>MÜŞTERİYE İADE EDİLEN:</span>
                  <span className="font-mono">{formatCurrency(cancelSlipModal.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>KALAN ÖDENMEMİŞ TUTAR:</span>
                  <span className="font-mono">{formatCurrency(cancelSlipModal.remainingAmount)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[10px] py-1 border-b border-dashed border-slate-300">
                <span className="font-bold text-slate-600 uppercase">İADE EDİLEN KALEMLER:</span>
                {cancelSlipModal.refundPayments.map((p, idx) => (
                  <div key={p.id} className="flex justify-between font-semibold">
                    <span>{idx + 1}. {p.label} {p.slipNumber ? `(${p.slipNumber})` : ""}:</span>
                    <span className="font-mono font-bold text-rose-700">-{formatCurrency(p.amount)} İADE</span>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-600">
                <span className="font-bold">Gerekçe: </span>
                <span>{cancelSlipModal.reason}</span>
              </div>

              <div className="pt-2 text-center text-[9px] text-slate-400">
                MÜŞTERİ NÜSHASI - İŞLEM TAMAMEN İPTAL EDİLMİŞTİR
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  toast.success("İptal fişi yazdırıldı.");
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <PrinterIcon className="size-3.5" />
                <span>Fişi Yazdır</span>
              </button>

              <button
                type="button"
                onClick={() => setCancelSlipModal(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                Tamam (Kapat)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. BANKA POS CİHAZI SİMÜLASYONU MODALI */}
      {posCardModal && posCardModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-5 sm:p-6 shadow-2xl border-4 border-slate-700 flex flex-col text-white animate-in zoom-in-95 duration-200">
            {/* POS Üst Durum Çubuğu */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <WifiIcon className="size-3.5 animate-pulse" />
                <span>GPRS / Wi-Fi Aktif</span>
              </div>
              <span className="font-bold text-slate-300">BEKO 300TR POS</span>
              <span>%100 🔋</span>
            </div>

            {/* POS LCD Ekranı */}
            <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-2 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                TAHSİLAT TUTARI
              </span>
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {formatCurrency(posCardModal.amount)}
              </span>

              {/* Temassız Kart İkonu ve Animasyon */}
              <div className="my-2 flex items-center justify-center size-14 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 relative">
                <RadioIcon className="size-7 animate-ping opacity-40 absolute" />
                <CreditCardIcon className="size-7" />
              </div>

              {/* Durum Mesajı */}
              <div className="w-full py-1.5 px-3 rounded-xl text-xs font-bold">
                {posCardModal.status === "CONNECTING" && (
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <RefreshCwIcon className="size-3.5 animate-spin" />
                    <span>Banka Bağlantısı Kuruluyor...</span>
                  </div>
                )}
                {posCardModal.status === "READING" && (
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <RefreshCwIcon className="size-3.5 animate-spin" />
                    <span>Temassız Kart Okundu, Onay Alınıyor...</span>
                  </div>
                )}
                {posCardModal.status === "APPROVED" && (
                  <div className="flex flex-col items-center gap-0.5 text-emerald-400">
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <CheckCircle2Icon className="size-4" />
                      <span>✓ İŞLEM ONAYLANDI</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Provizyon Kodu: {posCardModal.slipNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* POS Alt Butonları */}
            <div className="flex flex-col gap-2">
              {posCardModal.status === "APPROVED" ? (
                <button
                  type="button"
                  onClick={handleConfirmCardPayment}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2Icon className="size-4" />
                  <span>Fişi Kes & Tahsilatı Onayla</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPosCardModal((prev) => prev ? { ...prev, status: "APPROVED" } : null)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚡ Hızlı Kart Onayı (Simülasyon)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPosCardModal(null)}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                İptal Et / Geri Dön
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. YEMEK KARTI SEÇİMİ VE ONAY MODALI */}
      {mealVoucherModal && mealVoucherModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <WalletIcon className="size-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-900">Yemek Kartı / Kupon Tahsilatı</h3>
                  <span className="text-[11px] text-slate-500">Tutar: {formatCurrency(mealVoucherModal.amount)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMealVoucherModal(null)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="my-4 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 text-left">Yemek Kartı Markasını Seçin:</label>
              <div className="grid grid-cols-1 gap-1.5">
                {MEAL_VOUCHERS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setMealVoucherModal((prev) => prev ? { ...prev, selectedBrand: v.name } : null)}
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all border cursor-pointer",
                      mealVoucherModal.selectedBrand === v.name
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    )}
                  >
                    <span>{v.name}</span>
                    <span className="text-[10px] font-mono opacity-80">{formatCurrency(mealVoucherModal.amount)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between text-xs mb-4">
              <span className="text-purple-900 font-bold">Terminal Onay Kodu:</span>
              <span className="font-mono font-black text-purple-700">{mealVoucherModal.slipNumber}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMealVoucherModal(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmMealVoucherPayment}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs shadow-sm cursor-pointer transition-all"
              >
                ✓ Onayla & Fişi Kes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
