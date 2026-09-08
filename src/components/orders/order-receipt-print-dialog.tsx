"use client";

import { useState } from "react";
import {
  PrinterIcon,
  CheckCircle2Icon,
  UtensilsCrossedIcon,
  BikeIcon,
  ReceiptTextIcon,
  BuildingIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrinterClient } from "@/lib/printer/printer-client";
import {
  renderCustomerBill,
  renderCourierSlip,
  renderKitchenTicket,
  renderMerchantCopy,
  type ReceiptOrderMetadata,
  type ReceiptItemData,
} from "@/lib/printer/receipt-engine";
import {
  routeOrderToKitchenTickets,
  resolveCashierZone,
  type OrderRoutingMetadata,
  type RoutedItem,
} from "@/services/print-routing.service";
import type { RestaurantZoneDTO } from "@/types/staff";
import type { MenuCategoryDTO, MenuItemDTO } from "@/types/menu";
import type { OrderLineDTO } from "@/types/order";

export interface ReceiptSettingsConfig {
  receiptKitchenActive?: boolean;
  receiptCourierActive?: boolean;
  receiptCustomerActive?: boolean;
  receiptMerchantActive?: boolean;
}

interface OrderReceiptPrintDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly metadata: OrderRoutingMetadata;
  readonly items: readonly RoutedItem[];
  readonly rawLines?: readonly OrderLineDTO[];
  readonly categories?: readonly MenuCategoryDTO[];
  readonly menuItems?: readonly MenuItemDTO[];
  readonly zones?: readonly RestaurantZoneDTO[];
  readonly receiptSettings?: ReceiptSettingsConfig;
}

export function OrderReceiptPrintDialog({
  open,
  onOpenChange,
  metadata,
  items,
  rawLines = [],
  categories = [],
  menuItems = [],
  zones = [],
  receiptSettings,
}: OrderReceiptPrintDialogProps) {
  const [paperWidth, setPaperWidth] = useState<58 | 80>(80);
  const [isPrinting, setIsPrinting] = useState(false);

  const isCustomerActive = receiptSettings?.receiptCustomerActive ?? true;
  const isCourierActive = (receiptSettings?.receiptCourierActive ?? true) && metadata.orderType === "DELIVERY";
  const isKitchenActive = receiptSettings?.receiptKitchenActive ?? true;
  const isMerchantActive = receiptSettings?.receiptMerchantActive ?? true;

  const getDefaultDoc = (): "CUSTOMER" | "COURIER" | "KITCHEN" | "MERCHANT" => {
    if (isCustomerActive) return "CUSTOMER";
    if (isCourierActive) return "COURIER";
    if (isKitchenActive) return "KITCHEN";
    if (isMerchantActive) return "MERCHANT";
    return "CUSTOMER";
  };

  const [activeDocType, setActiveDocType] = useState<
    "CUSTOMER" | "COURIER" | "KITCHEN" | "MERCHANT"
  >(getDefaultDoc);

  const cashierZone = resolveCashierZone(zones);
  const routedKitchenTickets =
    rawLines.length > 0 && categories.length > 0 && zones.length > 0
      ? routeOrderToKitchenTickets(rawLines, categories, menuItems, zones)
      : [];

  const engineMeta: ReceiptOrderMetadata = {
    orderId: metadata.orderId,
    orderNumber: metadata.orderNumber,
    orderType: metadata.orderType,
    tableLabel: metadata.tableLabel,
    createdAt: metadata.createdAt,
    customerName: metadata.customerName,
    customerPhone: metadata.customerPhone,
    customerAddress: metadata.customerAddress,
    customerNotes: metadata.customerNotes,
    note: metadata.note,
    paymentMode: metadata.paymentModeLabel || metadata.paymentMode,
    isPaid: metadata.isPaid,
    subtotal: metadata.subtotal,
    discountTotal: metadata.discountTotal,
    deliveryFee: metadata.deliveryFee,
    taxTotal: metadata.taxTotal,
    grandTotal: metadata.grandTotal,
    channel: metadata.channel,
    restaurantInfo: metadata.restaurantInfo,
  };

  const engineItems: ReceiptItemData[] = items.map((it) => ({
    name: it.name,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    totalPrice: it.lineTotal ?? it.totalPrice,
    variantName: it.variantName,
    modifiers: it.modifiers,
    lineNote: it.lineNote,
  }));

  const customerResult = renderCustomerBill(engineMeta, engineItems, { widthMm: paperWidth });
  const courierResult = renderCourierSlip(engineMeta, engineItems, { widthMm: paperWidth });
  const merchantResult = renderMerchantCopy(engineMeta, engineItems, { widthMm: paperWidth });
  const kitchenResult = renderKitchenTicket(engineMeta, engineItems, { widthMm: paperWidth, stationName: "MUTFAK" });

  // Get active text for 100% clean preview (NO ESC/POS junk characters)
  const getActivePreviewText = (): string => {
    if (activeDocType === "CUSTOMER") return customerResult.plainText;
    if (activeDocType === "COURIER") return courierResult.plainText;
    if (activeDocType === "MERCHANT") return merchantResult.plainText;
    if (activeDocType === "KITCHEN") {
      if (routedKitchenTickets.length > 0) {
        return routedKitchenTickets
          .map((t) => {
            const ticketItems: ReceiptItemData[] = t.items.map((it) => ({
              name: it.name,
              quantity: it.quantity,
              variantName: it.variantName,
              modifiers: it.modifiers,
              lineNote: it.lineNote,
            }));
            return renderKitchenTicket(engineMeta, ticketItems, { widthMm: paperWidth, stationName: t.zone.name }).plainText;
          })
          .join("\n" + "=".repeat(paperWidth === 58 ? 32 : 48) + "\n\n");
      }
      return kitchenResult.plainText;
    }
    return "";
  };

  const handlePrintDoc = async (type: "CUSTOMER" | "COURIER" | "KITCHEN" | "MERCHANT") => {
    setIsPrinting(true);
    try {
      if (type === "KITCHEN") {
        if (routedKitchenTickets.length > 0) {
          let sent = 0;
          for (const t of routedKitchenTickets) {
            const ticketItems: ReceiptItemData[] = t.items.map((it) => ({
              name: it.name,
              quantity: it.quantity,
              variantName: it.variantName,
              modifiers: it.modifiers,
              lineNote: it.lineNote,
            }));
            const raw = renderKitchenTicket(engineMeta, ticketItems, { widthMm: paperWidth, stationName: t.zone.name }).escposRaw;
            const res = await PrinterClient.printRaw(t.zone, raw);
            if (res.success) sent++;
          }
          toast.success(`${sent} mutfak yazıcısına fiş iletildi.`);
          return;
        } else {
          const raw = kitchenResult.escposRaw;
          const targetZone: RestaurantZoneDTO = cashierZone || {
            id: "virtual-cashier",
            restaurantId: "default",
            name: "Kasa / Mutfak Yazıcısı",
            code: "CASHIER",
            description: null,
            color: null,
            printerIp: null,
            printerPort: null,
            printerModel: null,
            printerEnabled: true,
            printerPaperWidth: paperWidth,
            printerConnectionType: "LOCAL_OS",
            isDefault: true,
            sortOrder: 1,
          };
          const res = await PrinterClient.printRaw(targetZone, raw);
          if (res.success) {
            toast.success("Mutfak fişi yazdırıldı.");
          } else {
            window.print();
          }
          return;
        }
      }

      const targetZone: RestaurantZoneDTO = cashierZone || {
        id: "virtual-cashier",
        restaurantId: "default",
        name: "Kasa Yazıcısı",
        code: "CASHIER",
        description: null,
        color: null,
        printerIp: null,
        printerPort: null,
        printerModel: null,
        printerEnabled: true,
        printerPaperWidth: paperWidth,
        printerConnectionType: "LOCAL_OS",
        isDefault: true,
        sortOrder: 1,
      };

      let rawContent = customerResult.escposRaw;
      let docName = "Paket Servis / Müşteri Fişi";
      if (type === "COURIER") {
        rawContent = courierResult.escposRaw;
        docName = "Kurye Fişi";
      } else if (type === "MERCHANT") {
        rawContent = merchantResult.escposRaw;
        docName = "İşletme Kopyası";
      }

      const res = await PrinterClient.printRaw(targetZone, rawContent);
      if (res.success) {
        toast.success(`${docName} yazdırıldı.`);
      } else {
        toast.info(`${docName} tarayıcı yazdırma penceresine aktarılıyor...`);
        window.print();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yazdırma hatası");
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintAll = async () => {
    setIsPrinting(true);
    try {
      const tasks: Promise<void>[] = [];
      if (isCustomerActive) tasks.push(handlePrintDoc("CUSTOMER"));
      if (isCourierActive) tasks.push(handlePrintDoc("COURIER"));
      if (isKitchenActive) tasks.push(handlePrintDoc("KITCHEN"));
      if (isMerchantActive) tasks.push(handlePrintDoc("MERCHANT"));

      if (tasks.length === 0) {
        toast.info("Yazdırılacak aktif fiş türü bulunmuyor.");
        return;
      }
      await Promise.all(tasks);
      toast.success("Aktif fişler yazıcılara gönderildi!");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-5">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                <PrinterIcon className="size-5 text-rose-600" />
                <span>Termal Fiş Yazdır & Önizle</span>
                <Badge variant="outline" className="text-xs">
                  Sipariş #{metadata.orderNumber}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                80mm veya 58mm termal rulo formatında kurye, mutfak ve müşteri fişlerini yazdırın.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setPaperWidth(80)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                  paperWidth === 80
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                80 mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth(58)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                  paperWidth === 58
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                58 mm
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Fiş Türü Seçim Sekmeleri */}
        <div className="pt-3 shrink-0">
          <Tabs
            value={activeDocType}
            onValueChange={(v) => setActiveDocType(v as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full h-9">
              <TabsTrigger
                value="CUSTOMER"
                disabled={!isCustomerActive}
                className="text-xs font-bold gap-1 relative"
              >
                <ReceiptTextIcon className="size-3.5" />
                <span className="truncate">Paket / Müşteri</span>
                {!isCustomerActive && (
                  <span className="text-[9px] text-muted-foreground ml-0.5">(Kapalı)</span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="COURIER"
                disabled={!isCourierActive}
                className="text-xs font-bold gap-1 relative"
              >
                <BikeIcon className="size-3.5" />
                <span className="truncate">Kurye Fişi</span>
                {!isCourierActive && (
                  <span className="text-[9px] text-muted-foreground ml-0.5">
                    {metadata.orderType !== "DELIVERY" ? "(Paket Değil)" : "(Kapalı)"}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="KITCHEN"
                disabled={!isKitchenActive}
                className="text-xs font-bold gap-1 relative"
              >
                <UtensilsCrossedIcon className="size-3.5" />
                <span className="truncate">Mutfak (KOT)</span>
                {!isKitchenActive && (
                  <span className="text-[9px] text-muted-foreground ml-0.5">(Kapalı)</span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="MERCHANT"
                disabled={!isMerchantActive}
                className="text-xs font-bold gap-1 relative"
              >
                <BuildingIcon className="size-3.5" />
                <span className="truncate">İşletme</span>
                {!isMerchantActive && (
                  <span className="text-[9px] text-muted-foreground ml-0.5">(Kapalı)</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Termal Fiş Önizleme Alanı */}
        <div className="flex-1 min-h-0 my-3 overflow-y-auto bg-slate-900 p-4 rounded-2xl flex justify-center items-start shadow-inner">
          <div
            style={{ width: paperWidth === 58 ? "260px" : "360px" }}
            className="bg-white text-slate-950 p-4 rounded shadow-2xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text transition-all duration-200 border border-slate-300"
          >
            {getActivePreviewText()}
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-semibold"
            onClick={() => window.print()}
          >
            Tarayıcıdan Yazdır (A4 / Web)
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="text-xs font-bold gap-1.5"
              disabled={isPrinting}
              onClick={() => handlePrintDoc(activeDocType)}
            >
              {isPrinting ? <Loader2Icon className="size-3.5 animate-spin" /> : <PrinterIcon className="size-3.5" />}
              <span>Seçili Fişi Yazdır</span>
            </Button>

            <Button
              size="sm"
              className="text-xs font-black bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              disabled={isPrinting}
              onClick={handlePrintAll}
            >
              {isPrinting ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckCircle2Icon className="size-3.5" />}
              <span>Tüm Aktif Fişleri Yazdır</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
