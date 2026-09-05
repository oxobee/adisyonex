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
  ReceiptTextIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
  WalletIcon,
  XIcon,
  ArmchairIcon,
  ShoppingBagIcon,
  BikeIcon,
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
  };

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const router = useRouter();

  // Main Tab State: "PRODUCTS" | "TABLES"
  const [activeMainTab, setActiveMainTab] = useState<"PRODUCTS" | "TABLES">("PRODUCTS");
  const [tableFilter, setTableFilter] = useState<"ALL" | "OCCUPIED" | "EMPTY">("ALL");
  const [tableSearch, setTableSearch] = useState("");

  // Search & Category Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [configItem, setConfigItem] = useState<MenuItemDTO | null>(null);

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<MenuItemDTO | null>(null);
  const [draggedTable, setDraggedTable] = useState<TableDTO | null>(null);
  const [isDragOverCart, setIsDragOverCart] = useState(false);
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
      else if (paymentMethod === "SPLIT") modeLabel = "Parçalı Ödeme";
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
        {/* SOL ALAN: TAB MENÜ (MASA | ÜRÜN) + İÇERİK */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] border-r border-gray-200/90 overflow-hidden">
          {/* Üst Sekme Çubuğu: Masa | Ürün ve Fiş 01 - Fiş 05 Sekmeleri */}
          <div className="p-2 sm:px-4 sm:py-2.5 bg-white border-b border-gray-200 shrink-0 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
            {/* Sol: Masalar | Ürünler */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/90 shadow-inner shrink-0">
              <button
                type="button"
                onClick={() => setActiveMainTab("TABLES")}
                className={cn(
                  "flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none",
                  activeMainTab === "TABLES"
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200/80 scale-[1.01]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                )}
              >
                <ArmchairIcon className="size-4 text-blue-600 shrink-0" />
                <span>Masalar</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-black tracking-tight",
                  activeMainTab === "TABLES"
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-slate-200 text-slate-600"
                )}>
                  {occupiedCount} Dolu
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("PRODUCTS")}
                className={cn(
                  "flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none",
                  activeMainTab === "PRODUCTS"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80 scale-[1.01]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                )}
              >
                <UtensilsCrossedIcon className="size-4 text-emerald-600 shrink-0" />
                <span>Ürünler</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-black tracking-tight",
                  activeMainTab === "PRODUCTS"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-slate-200 text-slate-600"
                )}>
                  {menu.items.length} Ürün
                </span>
              </button>
            </div>

            {/* Sağ / Yan: Fiş 01 - Fiş 05 Bekletilen Satış Tab Menüsü */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner overflow-x-auto no-scrollbar">
              {tickets.map((ticket) => {
                const isActive = ticket.id === activeTicketId;
                const itemCount = ticket.cart.reduce((s, l) => s + l.quantity, 0);
                const hasCart = itemCount > 0;
                const hasTable = !!ticket.selectedTableId;
                const tableName = hasTable ? tables.find(t => t.id === ticket.selectedTableId)?.label : null;

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setActiveTicketId(ticket.id)}
                    title={hasTable ? `${ticket.label} (${tableName})` : `${ticket.label} (${itemCount} Ürün)`}
                    className={cn(
                      "relative flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap",
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm border border-indigo-500/30 scale-[1.02]"
                        : hasCart || hasTable
                        ? "bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100/90 border border-indigo-200/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent"
                    )}
                  >
                    <ReceiptTextIcon className={cn("size-3.5", isActive ? "text-indigo-200" : hasCart ? "text-indigo-600" : "text-slate-400")} />
                    <span>{ticket.label}</span>
                    {(hasCart || hasTable) && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-black tracking-tight flex items-center gap-0.5",
                          isActive
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-indigo-600 text-white shadow-2xs"
                        )}
                      >
                        {hasTable && <span>🪑</span>}
                        {hasCart ? `${itemCount}` : tableName || ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: MASALAR (DOLU & BOŞ MASA KARTLARI) */}
          {activeMainTab === "TABLES" && (
            <>
              {/* Masa Arama ve Filtre Barı */}
              <div className="p-3 sm:p-4 bg-white border-b border-gray-200 flex flex-col gap-2.5 shrink-0 shadow-2xs">
                <div className="relative">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Masa ara (örn: Masa 1, Bahçe 2)..."
                    className="w-full pl-10 pr-9 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
                  />
                  {tableSearch && (
                    <button
                      type="button"
                      onClick={() => setTableSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
                    >
                      <XIcon className="size-4" />
                    </button>
                  )}
                </div>

                {/* Masa Filtre Sekmeleri */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setTableFilter("ALL")}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border",
                      tableFilter === "ALL"
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-102"
                        : "bg-gray-100/90 text-gray-700 hover:bg-gray-200 border-gray-200/80"
                    )}
                  >
                    Tüm Masalar ({tables.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTableFilter("OCCUPIED")}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5",
                      tableFilter === "OCCUPIED"
                        ? "bg-rose-600 text-white border-rose-600 shadow-md scale-102"
                        : "bg-gray-100/90 text-rose-700 hover:bg-rose-50 border-gray-200/80"
                    )}
                  >
                    <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Dolu Masalar ({occupiedCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTableFilter("EMPTY")}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5",
                      tableFilter === "EMPTY"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-102"
                        : "bg-gray-100/90 text-emerald-700 hover:bg-emerald-50 border-gray-200/80"
                    )}
                  >
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Boş Masalar ({tables.length - occupiedCount})</span>
                  </button>
                </div>
              </div>

              {/* 3D Material Masa Kartları Izgarası */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4.5">
                {filteredTables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                    <ArmchairIcon className="size-12 stroke-[1.5] mb-2 text-gray-300" />
                    <p className="text-sm font-bold text-gray-600">Aradığınız kriterde masa bulunamadı</p>
                    <span className="text-xs text-gray-400">Aramayı temizleyin veya başka bir filtre seçin</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4.5">
                    {filteredTables.map((table, idx) => {
                      const isOccupied = Boolean(occupied[table.id] || tableOrderMap.get(table.id));
                      const existingOrder = tableOrderMap.get(table.id) || (occupied[table.id] ? openOrders.find(o => o.id === occupied[table.id]) : undefined);
                      const isSelected = selectedTableId === table.id;
                      const lineCount = existingOrder ? existingOrder.lines.filter(l => l.state !== "VOID").reduce((s, l) => s + l.quantity, 0) : 0;
                      const activeLines = existingOrder ? existingOrder.lines.filter(l => l.state !== "VOID") : [];

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
                          className="animate-table-card-elastic"
                          style={{
                            animationDelay: `${Math.min(idx * 35, 700)}ms`,
                            animationFillMode: "both",
                          }}
                        >
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/pos-table", JSON.stringify(table));
                              e.dataTransfer.effectAllowed = "copy";
                              setDraggedTable(table);
                              setDraggedItem(null);
                            }}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleSelectTable(table)}
                          className={cn(
                            "group relative rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none flex flex-col justify-between transition-all duration-200 transform-gpu",
                            `bg-gradient-to-br ${gradient}`,
                            "border-t border-t-white/50 border-x border-white/15 border-b-[4px] border-b-black/45",
                            "shadow-[0_10px_24px_-4px_rgba(0,0,0,0.38),inset_0_1.5px_1px_rgba(255,255,255,0.45)]",
                            "hover:-translate-y-1.5 hover:shadow-2xl hover:brightness-105",
                            "active:translate-y-1 active:scale-[0.985] active:border-b-[2px]",
                            isSelected && "ring-4 ring-blue-400/90",
                            "min-h-[250px] sm:min-h-[275px]"
                          )}
                        >
                          {/* 3D Specular Highlight & Texture */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                            <svg
                              className="absolute -bottom-6 -right-6 w-36 h-36 opacity-15 text-white pointer-events-none"
                              viewBox="0 0 160 160"
                              fill="none"
                            >
                              <circle cx="80" cy="80" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                              <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="1.5" />
                              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                            </svg>
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 via-black/15 to-transparent pointer-events-none" />
                          </div>

                          {/* Üst Kısım: Masa Adı & Durum Rozeti */}
                          <div className="p-3.5 pb-2 flex items-center justify-between z-10">
                            <span className="text-xs font-black text-white bg-black/45 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1.5">
                              <ArmchairIcon className="size-3.5" />
                              <span>{table.label}</span>
                            </span>

                            {isOccupied ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-white bg-red-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-red-400/40 shadow-xs">
                                <span className="size-1.5 rounded-full bg-red-400 animate-ping" />
                                <span>DOLU</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-white bg-emerald-950/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/40 shadow-xs">
                                BOŞ
                              </span>
                            )}
                          </div>

                          {/* Orta Beyaz Gövde Alanı */}
                          <div className="relative m-2.5 my-0 rounded-2xl bg-white p-3.5 flex flex-col justify-between flex-1 border border-white/40 shadow-inner overflow-hidden">
                            {isOccupied && existingOrder ? (
                              <div className="flex flex-col justify-between h-full">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                                    <span>Adisyon Tutarı</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-black border border-rose-200">
                                      {lineCount} Kalem
                                    </span>
                                  </div>
                                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                                    {formatCurrency(getTableOrderTotal(existingOrder))}
                                  </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-0.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İçerik:</span>
                                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight font-semibold">
                                    {activeLines.map(l => `${l.quantity}x ${l.name}`).join(", ") || "Sipariş açık"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-100">
                                  <ArmchairIcon className="size-6 stroke-[1.5]" />
                                </div>
                                <span className="text-sm font-black text-slate-800">Masa Müsait</span>
                                <span className="text-xs text-slate-400 font-semibold mt-0.5">
                                  {table.seats ? `${table.seats} Kişilik` : "Sipariş Yok"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Alt Aksiyon Butonu */}
                          <div className="p-3 pt-2 z-10">
                            <div className={cn(
                              "w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md border border-white/20 transition-all",
                              isOccupied
                                ? "bg-white/25 text-white backdrop-blur-md group-hover:bg-white/35"
                                : "bg-white/20 text-white backdrop-blur-md group-hover:bg-white/30"
                            )}>
                              <span>{isOccupied ? "Adisyonu Aç & Ürün Ekle" : "Masayı Seç & Başlat"}</span>
                              <ChevronRightIcon className="size-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: ÜRÜNLER (MEVCUT ÜRÜN KATALOĞU) */}
          {activeMainTab === "PRODUCTS" && (
            <>
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
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4.5">
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
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleTapItem(item)}
                          className={cn(
                            "group relative rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none flex flex-col justify-between transition-all duration-200 transform-gpu",
                            `bg-gradient-to-br ${gradient}`,
                            "border-t border-t-white/50 border-x border-white/15 border-b-[4px] border-b-black/45",
                            "shadow-[0_10px_24px_-4px_rgba(0,0,0,0.38),inset_0_1.5px_1px_rgba(255,255,255,0.45)]",
                            "hover:-translate-y-1.5 hover:shadow-2xl hover:brightness-105",
                            "active:translate-y-1 active:scale-[0.985] active:border-b-[2px]",
                            draggedItem?.id === item.id && "opacity-50 scale-95 ring-4 ring-emerald-400/80",
                            showItemImages ? "min-h-[250px] sm:min-h-[275px]" : "min-h-[120px] sm:min-h-[135px]"
                          )}
                        >
                          {/* Subdued Eye-Friendly Texture Overlay & Concentric Rings */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                            {/* Concentric geometric rings in bottom corner */}
                            <svg
                              className="absolute -bottom-6 -right-6 w-36 h-36 opacity-15 text-white pointer-events-none"
                              viewBox="0 0 160 160"
                              fill="none"
                            >
                              <circle cx="80" cy="80" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                              <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="1.5" />
                              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                            </svg>

                            {/* Top Specular Bevel Highlight */}
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />

                            {/* Bottom Extrusion Shadow */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 via-black/15 to-transparent pointer-events-none" />
                          </div>

                          {/* Sepetteki Adet Rozeti (3D Tactile Pill) */}
                          {cartCount > 0 && (
                            <div className="absolute top-2.5 right-2.5 z-20 flex size-7 sm:size-8 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-black shadow-lg border-2 border-white animate-in zoom-in-75">
                              {cartCount}
                            </div>
                          )}

                          {/* Üst Alan: Görsel Alanı (showItemImages aktifse) veya Kompakt Rozet */}
                          {showItemImages ? (
                            <div className="relative m-2.5 mb-0 h-40 sm:h-44 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-3 border border-white/40">
                              {/* Kategori Rozeti (Üst Sol Pill) */}
                              <div className="absolute top-2 left-2 z-10">
                                <span className="text-[10px] font-bold text-white/95 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                                  {categoryMap.get(item.categoryId) || "Menü"}
                                </span>
                              </div>

                              {/* Ürün Görseli */}
                              {primaryImage ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <Image
                                    src={primaryImage}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                                    className="object-contain p-1 transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                                  />
                                </div>
                              ) : (
                                <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                  <UtensilsCrossedIcon className="size-7 stroke-[1.5]" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="pt-3 px-3.5 flex items-center justify-between z-10">
                              <span className="text-[10px] font-bold text-white/95 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                                {categoryMap.get(item.categoryId) || "Menü"}
                              </span>
                            </div>
                          )}

                          {/* Alt Metin ve Fiyat Alanı */}
                          <div className="p-3.5 pt-2.5 flex flex-col justify-between flex-1 z-10">
                            <div className="mb-2">
                              <h3 className="font-extrabold text-sm sm:text-base text-white line-clamp-1 leading-snug drop-shadow-xs">
                                {item.name}
                              </h3>
                              {item.shortDescription ? (
                                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5 font-medium">
                                  {item.shortDescription}
                                </p>
                              ) : (
                                <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5 font-medium">
                                  {categoryMap.get(item.categoryId) || "Özel Menü"}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                                {formatCurrency(item.price)}
                              </span>

                              {hasVariants ? (
                                <span className="text-xs font-black text-[#fef08a] bg-black/45 hover:bg-black/60 px-3 py-1 rounded-full border border-amber-400/40 shadow-xs transition-all tracking-wide">
                                  Seçenekli
                                </span>
                              ) : (
                                <div className="size-8 rounded-full bg-black/40 hover:bg-white hover:text-slate-900 border border-white/30 text-white flex items-center justify-center transition-all shadow-xs group-hover:scale-105 active:scale-95">
                                  <PlusIcon className="size-4 stroke-[3]" />
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
            </>
          )}
        </section>

        {/* SAĞ ALAN: ADİSYON TİCKET + FİNANSAL HESAPLAMA + ÖDEME & PARAÜSTÜ */}
        <aside
          onDragOver={handleDragOverCart}
          onDragLeave={handleDragLeaveCart}
          onDrop={handleDropOnCart}
          className={cn(
            "relative w-full lg:w-[420px] xl:w-[470px] shrink-0 flex flex-col bg-[#f8fafc] border-l border-slate-200 overflow-hidden shadow-2xl transition-all duration-200",
            isDragOverCart && "ring-4 ring-emerald-500/80 bg-emerald-50/20"
          )}
        >
          {/* Sürükle-Bırak Aktif Görsel Göstergesi (Overlay) */}
          {isDragOverCart && (
            <div className="absolute inset-0 z-50 pointer-events-none bg-emerald-500/10 backdrop-blur-[2px] border-4 border-dashed border-emerald-500 flex flex-col items-center justify-center gap-3 animate-in fade-in-50 duration-150">
              <div className="size-18 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-bounce">
                <PlusIcon className="size-10 stroke-[3]" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-emerald-950 bg-white/95 px-4 py-1.5 rounded-full shadow-md border border-emerald-200">
                  {draggedTable
                    ? `🪑 ${draggedTable.label} Masasını ve Adisyonunu Yükle`
                    : draggedItem
                    ? `${draggedItem.name} Ürününü Ekle`
                    : "Adisyona Eklemek İçin Bırakın"}
                </span>
                <span className="text-xs font-bold text-emerald-800 mt-1">
                  {draggedTable
                    ? "Bırakınca masanın açık siparişi ödeme alanına aktarılacaktır"
                    : "Ödeme alanına bırakınca sepete eklenecektir"}
                </span>
              </div>
            </div>
          )}

          {/* Adisyon Başlığı & Masa Seçimi (Taşma ve İç İçe Geçmeleri Önleyen 2 Kademeli Modern Düzen) */}
          <div className="p-3 sm:p-3.5 bg-white border-b border-slate-200 flex flex-col gap-2.5 shrink-0 shadow-2xs">
            {/* Üst Satır: Fiş Başlığı, Fiş Numarası, Kalem Sayısı & Temizle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center border border-slate-800 shadow-xs shrink-0">
                  <ReceiptIcon className="size-4.5" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="text-sm font-black text-slate-900 tracking-tight whitespace-nowrap">
                    Adisyon Fişi
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs whitespace-nowrap shrink-0">
                    {currentTicket.label}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0">
                    {cart.reduce((s, l) => s + l.quantity, 0)} Kalem
                  </span>
                </div>
              </div>

              {/* Sepet Temizle Butonu */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => clear()}
                  title="Sepeti Boşalt"
                  className="h-8 px-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Temizle</span>
                </button>
              )}
            </div>

            {/* Alt Satır: Masa Seçimi / Hizmet Türü Durumu */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/90 text-xs">
              {selectedTableId ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                      Seçili Masa:
                    </span>
                  </div>

                  <div className="inline-flex items-center rounded-xl bg-blue-50 border border-blue-200/90 text-blue-700 h-7.5 pl-2.5 pr-1 text-xs font-black shadow-2xs shrink-0 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setServiceType("DINE_IN");
                        setActiveMainTab("TABLES");
                      }}
                      title="Masayı Değiştir"
                      className="flex items-center gap-1 hover:text-blue-900 cursor-pointer whitespace-nowrap"
                    >
                      <span>🪑 {tables.find(t => t.id === selectedTableId)?.label || "Masa"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTableId(null)}
                      title="Masayı Kaldır (Hızlı Satışa Çevir)"
                      className="size-5.5 ml-1 rounded-md text-blue-400 hover:text-red-600 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <XIcon className="size-3.5" />
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
                      setServiceType("DINE_IN");
                      setActiveMainTab("TABLES");
                    }}
                    className="h-7.5 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <span>🪑 Masaya Bağla</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sepet Ürün Satırları (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[140px] max-h-[30vh] lg:max-h-[none]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center my-auto py-10 text-center text-slate-400">
                <div className="size-16 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-3 text-slate-300">
                  <ReceiptIcon className="size-8 stroke-[1.5]" />
                </div>
                <p className="text-sm font-bold text-slate-700">Sepetiniz Henüz Boş</p>
                <span className="text-xs text-slate-400 max-w-[220px] mt-1">
                  Menüden ürün ekleyerek hızlı satışa veya adisyona başlayabilirsiniz.
                </span>
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.key}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all gap-2.5"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-slate-800 truncate">
                        {line.name}
                      </span>
                      {line.variantName && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                          {line.variantName}
                        </span>
                      )}
                      {line.isComp && (
                        <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                          İkram
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium font-mono">
                      <span>Birim: {formatCurrency(line.unitPrice)}</span>
                      {line.modifiers.length > 0 && (
                        <span className="text-slate-400 font-sans truncate">
                          +{line.modifiers.map((m) => m.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Adet ve Tutar Kontrolleri */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => changeQty(line.key, -1)}
                        className="size-6 sm:size-7 flex items-center justify-center rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-2xs active:scale-95 cursor-pointer font-bold transition-all"
                      >
                        <MinusIcon className="size-3" />
                      </button>

                      <span className="w-6 sm:w-7 text-center text-xs sm:text-sm font-black tabular-nums text-slate-900 font-mono">
                        {line.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => changeQty(line.key, 1)}
                        className="size-6 sm:size-7 flex items-center justify-center rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-2xs active:scale-95 cursor-pointer font-bold transition-all"
                      >
                        <PlusIcon className="size-3" />
                      </button>
                    </div>

                    <span className="w-18 text-right text-xs sm:text-sm font-black tabular-nums text-slate-900 font-mono">
                      {line.isComp ? "0.00 ₺" : formatCurrency(line.unitPrice * line.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* İskonto & İndirim Çubuğu */}
          <div className="px-3.5 py-2 bg-slate-100/90 border-t border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <TagIcon className="size-3.5 text-slate-600" />
              <span className="text-xs font-bold text-slate-700">İndirim / İskonto:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDiscount({ type: "NONE", value: 0 })}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs",
                  discount.type === "NONE"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={() => setDiscount({ type: "PERCENT", value: 10 })}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs",
                  discount.type === "PERCENT" && discount.value === 10
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                %10
              </button>
              <button
                type="button"
                onClick={() => setDiscount({ type: "PERCENT", value: 20 })}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs",
                  discount.type === "PERCENT" && discount.value === 20
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs",
                  discount.type === "FLAT"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Özel ₺
              </button>
            </div>
          </div>

          {/* Şık Modern Hesap Özeti (Ferah Slate/Dark Design) */}
          <div className="p-4 bg-slate-900 text-white border-t border-slate-800 shadow-md shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1.5">
              <span>Ara Toplam: {formatCurrency(bill.subtotal)}</span>
              {bill.discountTotal > 0 && (
                <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  İndirim: -{formatCurrency(bill.discountTotal)}
                </span>
              )}
              <span>KDV: {formatCurrency(bill.taxTotal)}</span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-300">
                Ödenecek Tutar:
              </span>
              <span className="text-3xl font-black text-emerald-400 tracking-tight tabular-nums drop-shadow-sm font-mono">
                {formatCurrency(bill.grandTotal)}
              </span>
            </div>
          </div>

          {/* 3. ÖDEME YÖNTEMLERİ VE PARAÜSTÜ MODÜLÜ */}
          <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col gap-3 shrink-0">
            {/* Servis Türü Seçici (Masada Servis | Gel-Al / Paket | Paket Servis / Kurye) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setServiceType("DINE_IN");
                  if (!selectedTableId) {
                    setActiveMainTab("TABLES");
                  }
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer select-none",
                  serviceType === "DINE_IN"
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200/80 ring-1 ring-blue-500/20"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ArmchairIcon className="size-3.5 shrink-0 text-blue-600" />
                <span className="truncate">Masada Servis</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setServiceType("TAKEAWAY");
                  setSelectedTableId(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer select-none",
                  serviceType === "TAKEAWAY"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80 ring-1 ring-emerald-500/20"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ShoppingBagIcon className="size-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">Gel-Al / Paket</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setServiceType("DELIVERY");
                  setSelectedTableId(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer select-none",
                  serviceType === "DELIVERY"
                    ? "bg-white text-orange-700 shadow-sm border border-slate-200/80 ring-1 ring-orange-500/20"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <BikeIcon className="size-3.5 shrink-0 text-orange-600" />
                <span className="truncate">Paket Servis / Kurye</span>
              </button>
            </div>

            {/* Ödeme Türü Seçici Sekmeler (Modern Segmented Control) */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "CASH"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <BanknoteIcon className="size-3.5" />
                <span>Nakit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "CARD"
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <CreditCardIcon className="size-3.5" />
                <span>Kart</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("MEAL_VOUCHER")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "MEAL_VOUCHER"
                    ? "bg-white text-amber-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <WalletIcon className="size-3.5" />
                <span>Yemek Çeki</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("SPLIT")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                  paymentMethod === "SPLIT"
                    ? "bg-white text-purple-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <PercentIcon className="size-3.5" />
                <span>Parçalı</span>
              </button>
            </div>

            {/* A) NAKİT SEÇİLİYSE */}
            {paymentMethod === "CASH" && (
              <div className="flex flex-col gap-2.5">
                {/* Hızlı Banknot Tuşları */}
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNumpad("EXACT")}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer select-none"
                  >
                    Tam
                  </button>
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickBanknote(amt)}
                      className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer select-none font-mono"
                    >
                      {amt} ₺
                    </button>
                  ))}
                </div>

                {/* Alınan Nakit ve Kalan / Para Üstü Kutuları */}
                <div className="grid grid-cols-2 gap-2">
                  {/* ALINAN NAKİT KUTUSU */}
                  <div className="flex flex-col justify-center px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      ALINAN NAKİT
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashTenderedStr}
                      onChange={(e) => setCashTenderedStr(e.target.value)}
                      placeholder="0.00 ₺"
                      className="text-lg font-black text-slate-900 bg-transparent focus:outline-hidden font-mono tracking-tight"
                    />
                  </div>

                  {/* PARA ÜSTÜ / KALAN TUTAR */}
                  <div
                    className={cn(
                      "flex flex-col justify-center px-3.5 py-2 rounded-2xl border transition-all shadow-2xs",
                      cashTendered >= bill.grandTotal && bill.grandTotal > 0
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-amber-50 border-amber-300 text-amber-950"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {cashTendered >= bill.grandTotal && bill.grandTotal > 0
                        ? "PARA ÜSTÜ"
                        : "KALAN TUTAR"}
                    </span>
                    <span className="text-lg font-black tabular-nums font-mono tracking-tight">
                      {cashTendered >= bill.grandTotal && bill.grandTotal > 0
                        ? formatCurrency(changeDue)
                        : formatCurrency(cashRemaining)}
                    </span>
                  </div>
                </div>

                {/* Dokunsal POS Numpad */}
                <div className="grid grid-cols-6 gap-1.5 text-xs">
                  {["1", "2", "3", "4", "5", "6"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleNumpad(n)}
                      className="py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs active:scale-95 transition-all select-none cursor-pointer font-mono text-sm"
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
                        "py-2.5 rounded-xl font-bold border shadow-2xs active:scale-95 transition-all select-none cursor-pointer font-mono text-sm",
                        n === "BACK"
                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
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
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-center gap-3">
                <CreditCardIcon className="size-6 text-blue-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-black">Banka / Kredi Kartı POS Tahsilatı</span>
                  <span className="text-[11px] text-blue-700 font-medium">
                    POS cihazından {formatCurrency(bill.grandTotal)} çekim yapıp satışı onaylayın.
                  </span>
                </div>
              </div>
            )}

            {/* C) YEMEK ÇEKİ SEÇİLİYSE */}
            {paymentMethod === "MEAL_VOUCHER" && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-600">Yemek Kartı / Çeki Seçin:</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {MEAL_VOUCHERS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedMealVoucher(v.name)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-[10px] font-black border transition-all flex flex-col items-center justify-center cursor-pointer",
                        selectedMealVoucher === v.name
                          ? `${v.bg} ${v.border} ${v.color} shadow-xs ring-2 ring-primary/40`
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-purple-50/60 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-900">
                  Nakit ve Kredi Kartı Bölüştürme:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Nakit Tutar:</label>
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Kart Tutar:</label>
                    <input
                      type="number"
                      value={splitCardStr}
                      onChange={(e) => setSplitCardStr(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BÜYÜK MODERN 'Siparişi Tamamla' BUTONU */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitSale.isPending}
              className={cn(
                "w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base text-white tracking-wide transition-all select-none cursor-pointer",
                "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700",
                "shadow-lg shadow-emerald-600/25",
                "active:scale-[0.99] transition-transform",
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
    </div>
  );
}
