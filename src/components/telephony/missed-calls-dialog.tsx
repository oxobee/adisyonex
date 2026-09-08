"use client";

import { PhoneMissedIcon, UserCheckIcon, ShoppingBagIcon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MissedCallDTO } from "@/services/telephony.service";
import type { OnStartOrderPayload } from "./incoming-call-drawer";

interface MissedCallsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly missedCalls: readonly MissedCallDTO[];
  readonly onStartOrder: (payload: OnStartOrderPayload) => void;
}

export function MissedCallsDialog({
  open,
  onClose,
  missedCalls,
  onStartOrder,
}: MissedCallsDialogProps) {
  const handleStartOrderFromMissed = (call: MissedCallDTO) => {
    onStartOrder({
      customerName: call.customerName || "Arayan Müşteri",
      customerPhone: call.fromNumber,
      serviceType: "TAKEAWAY",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <PhoneMissedIcon className="size-4.5 text-destructive" />
            Cevapsız Aramalar
          </DialogTitle>
          <DialogDescription className="text-xs">
            Restoranınızı arayan ancak ulaşılamayan son aramalar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pt-2">
          {missedCalls.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Henüz cevapsız arama bulunmuyor.
            </div>
          ) : (
            missedCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {call.formattedFromNumber}
                    </span>
                    {call.isRegistered ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                        <UserCheckIcon className="size-3" />
                        {call.customerName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                        Kayıtsız
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ClockIcon className="size-3" />
                    {new Date(call.createdAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => handleStartOrderFromMissed(call)}
                >
                  <ShoppingBagIcon className="size-3.5" />
                  Sipariş Aç
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
