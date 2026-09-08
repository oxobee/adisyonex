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
  EyeIcon,
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
  formatEscposCustomerBill,
  formatEscposCourierSlip,
  formatEscposMerchantCopy,
  formatEscposKotTicket,
  routeOrderToKitchenTickets,
  resolveCashierZone,
  type OrderRoutingMetadata,
  type RoutedItem,
} from "@/services/print-routing.service";
import type { RestaurantZoneDTO } from "@/types/staff";
import type { MenuCategoryDTO, MenuItemDTO } from "@/types/menu";
import type { OrderLineDTO } from "@/types/order";

interface OrderReceiptPrintDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly metadata: OrderRoutingMetadata;
  readonly items: readonly RoutedItem[];
  readonly rawLines?: readonly OrderLineDTO[];
  readonly categories?: readonly MenuCategoryDTO[];
  readonly menuItems?: readonly MenuItemDTO[];
  readonly zones?: readonly RestaurantZoneDTO[];
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
}: OrderReceiptPrintDialogProps) {
  const [paperWidth, setPaperWidth] = useState<58 | 80>(80);
  const [activeDocType, setActiveDocType] = useState<
    "CUSTOMER" | "COURIER" | "KITCHEN" | "MERCHANT"
  >("CUSTOMER");
  const [isPrinting, setIsPrinting] = useState(false);

  const cashierZone = resolveCashierZone(zones);
  const routedKitchenTickets =
    rawLines.length > 0 && categories.length > 0 && zones.length > 0
      ? routeOrderToKitchenTickets(rawLines, categories, menuItems, zones)
      : [];

  // Generate ESC/POS raw strings
  const customerBillRaw = formatEscposCustomerBill(metadata, items, paperWidth);
  const courierSlipRaw = formatEscposCourierSlip(metadata, paperWidth);
  const merchantCopyRaw = formatEscposMerchantCopy(metadata, items, paperWidth);

  // Get active text for preview
  const getActivePreviewText = (): string => {
    if (activeDocType === "CUSTOMER") return customerBillRaw;
    if (activeDocType === "COURIER") return courierSlipRaw;
    if (activeDocType === "MERCHANT") return merchantCopyRaw;
    if (activeDocType === "KITCHEN") {
      if (routedKitchenTickets.length > 0) {
        return routedKitchenTickets
          .map((t) => formatEscposKotTicket(t, metadata))
          .join("\n----------------------------------------\n\n");
      }
      return "Mutfak istasyonu bulunamadı veya mutfağa gönderilecek ürün yok.";
    }
    return "";
  };

  const handlePrintDoc = async (type: "CUSTOMER" | "COURIER" | "KITCHEN" | "MERCHANT") => {
    setIsPrinting(true);
    try {
      if (type === "KITCHEN") {
        if (routedKitchenTickets.length === 0) {
          toast.info("Mutfak yazıcısına yönlendirilecek ürün bulunamadı.");
          return;
        }
        let sent = 0;
        for (const t of routedKitchenTickets) {
          const raw = formatEscposKotTicket(t, metadata);
          const res = await PrinterClient.printRaw(t.zone, raw);
          if (res.success) sent++;
        }
        toast.success(`${sent} mutfak yazıcısına fiş iletildi.`);
        return;
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

      let rawContent = customerBillRaw;
      let docName = "Paket Servis / Müşteri Fişi";
      if (type === "COURIER") {
        rawContent = courierSlipRaw;
        docName = "Kurye Fişi";
      } else if (type === "MERCHANT") {
        rawContent = merchantCopyRaw;
        docName = "İşletme Kopyası";
      }

      const res = await PrinterClient.printRaw(targetZone, rawContent);
      if (res.success) {
        toast.success(`${docName} yazdırıldı.`);
      } else {
        toast.error(res.error || "Yazıcı çevrimdışı. Tarayıcıdan yazdırmayı deneyebilirsiniz.");
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
      await handlePrintDoc("CUSTOMER");
      if (metadata.orderType === "DELIVERY") {
        await handlePrintDoc("COURIER");
      }
      if (routedKitchenTickets.length > 0) {
        await handlePrintDoc("KITCHEN");
      }
      toast.success("Tüm fişler yazıcılara gönderildi!");
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
              <TabsTrigger value="CUSTOMER" className="text-xs font-bold gap-1">
                <ReceiptTextIcon className="size-3.5" />
                <span className="truncate">Paket / Müşteri</span>
              </TabsTrigger>
              <TabsTrigger value="COURIER" className="text-xs font-bold gap-1">
                <BikeIcon className="size-3.5" />
                <span className="truncate">Kurye Fişi</span>
              </TabsTrigger>
              <TabsTrigger value="KITCHEN" className="text-xs font-bold gap-1">
                <UtensilsCrossedIcon className="size-3.5" />
                <span className="truncate">Mutfak (KOT)</span>
              </TabsTrigger>
              <TabsTrigger value="MERCHANT" className="text-xs font-bold gap-1">
                <BuildingIcon className="size-3.5" />
                <span className="truncate">İşletme</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Termal Fiş Önizleme Alanı */}
        <div className="flex-1 min-h-0 my-3 overflow-y-auto bg-slate-900 p-4 rounded-2xl flex justify-center items-start shadow-inner">
          <div
            style={{ width: paperWidth === 58 ? "240px" : "320px" }}
            className="bg-white text-slate-950 p-4 rounded shadow-2xl font-mono text-[11px] leading-snug whitespace-pre-wrap select-text transition-all duration-200 border border-slate-300"
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
            Tarayıcıdan Yazdır (Browser Print)
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
              <span>Tümünü Yazdır (Paket + Kurye + Mutfak)</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
