"use client";

import { useState } from "react";
import { PrinterIcon, CheckCircle2Icon, AlertCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PrinterClient } from "@/lib/printer/printer-client";
import {
  formatEscposKotTicket,
  type RoutedKotTicket,
  type OrderRoutingMetadata,
} from "@/services/print-routing.service";

export function KotPrintManager({
  tickets,
  metadata,
}: {
  readonly tickets: readonly RoutedKotTicket[];
  readonly metadata: OrderRoutingMetadata;
}) {
  const [printingZoneId, setPrintingZoneId] = useState<string | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const printSingleZone = async (ticket: RoutedKotTicket) => {
    setPrintingZoneId(ticket.zone.id);
    try {
      const rawEscPos = formatEscposKotTicket(ticket, metadata);
      const result = await PrinterClient.printRaw(ticket.zone, rawEscPos);
      if (result.success) {
        toast.success(result.message || `${ticket.zone.name} yazıcısına gönderildi.`);
      } else {
        toast.error(result.error || `${ticket.zone.name} yazıcısına gönderilemedi.`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Yazdırma sırasında bir hata oluştu."
      );
    } finally {
      setPrintingZoneId(null);
    }
  };

  const printAllZones = async () => {
    if (tickets.length === 0) {
      window.print();
      return;
    }
    setIsPrintingAll(true);
    let successCount = 0;
    for (const ticket of tickets) {
      try {
        const rawEscPos = formatEscposKotTicket(ticket, metadata);
        const result = await PrinterClient.printRaw(ticket.zone, rawEscPos);
        if (result.success) {
          successCount++;
        }
      } catch (err) {
        console.error("Zone print error:", err);
      }
    }
    setIsPrintingAll(false);
    if (successCount > 0) {
      toast.success(`${successCount} adet istasyon yazıcısına fişler iletildi.`);
    } else {
      // If thermal network/local failed or not configured, fallback to browser print dialog
      toast.info("Termal yazıcı yanıt vermedi, tarayıcı yazdırma ekranı açılıyor...");
      window.print();
    }
  };

  return (
    <div className="flex flex-col gap-2 print:hidden w-full">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="cursor-pointer"
        >
          Tarayıcıdan Yazdır
        </Button>

        {tickets.length > 0 && (
          <Button
            size="sm"
            onClick={printAllZones}
            disabled={isPrintingAll}
            className="bg-primary text-primary-foreground font-bold cursor-pointer"
          >
            {isPrintingAll ? (
              <Loader2Icon className="size-4 animate-spin mr-1.5" />
            ) : (
              <PrinterIcon className="size-4 mr-1.5" />
            )}
            <span>İstasyonlara Yazdır ({tickets.length} Bölge)</span>
          </Button>
        )}
      </div>

      {tickets.length > 1 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground self-center mr-1">Tekli Gönder:</span>
          {tickets.map((t) => (
            <button
              key={t.zone.id}
              type="button"
              onClick={() => printSingleZone(t)}
              disabled={printingZoneId === t.zone.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border border-border/60 bg-muted/30 hover:bg-muted active:scale-95 transition-all cursor-pointer"
              title={`${t.zone.name} İstasyonuna gönder`}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: t.zone.color || "#EF4444" }}
              />
              <span>{t.zone.name} ({t.items.length})</span>
              {printingZoneId === t.zone.id && (
                <Loader2Icon className="size-3 animate-spin text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
