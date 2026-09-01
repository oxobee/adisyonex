"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  FlameIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import { toast } from "sonner";

import { advanceTicketAction } from "@/actions/kitchen.actions";
import { SelfOrderBadge } from "@/components/shared/self-order-badge";
import { SoundToggle } from "@/components/shared/sound-toggle";
import { Button } from "@/components/ui/button";
import { useAnnouncer } from "@/hooks/use-announcer";
import { useServerAction } from "@/hooks/use-server-action";
import {
  alertSignatureMap,
  newOrderAlerts,
  newOrderPhrase,
  selfOrderAlertPhrase,
} from "@/lib/announce";
import { KITCHEN_STATUS_LABEL, type KitchenStatus } from "@/lib/kitchen";
import { cn } from "@/lib/utils";
import type { KitchenTicketDTO } from "@/types/kitchen";

const CARD_THEME: Record<
  KitchenStatus,
  {
    card: string;
    badge: string;
    header: string;
    border: string;
    stepActive: string;
    btnClass: string;
    btnLabel: string;
  }
> = {
  WAITING: {
    card: "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50 shadow-rose-500/5",
    header: "bg-rose-500/10 border-rose-500/20",
    badge: "bg-rose-600 text-white font-black shadow-xs",
    border: "border-rose-500/30",
    stepActive: "bg-rose-600 text-white",
    btnClass: "bg-rose-600 hover:bg-rose-700 text-white font-black shadow-lg shadow-rose-600/25",
    btnLabel: "🔥 Hazırlamaya Başla",
  },
  PREPARING: {
    card: "bg-amber-500/8 dark:bg-amber-950/20 border-amber-500/35 hover:border-amber-500/55 shadow-amber-500/5",
    header: "bg-amber-500/10 border-amber-500/20",
    badge: "bg-amber-500 text-amber-950 font-black shadow-xs animate-pulse",
    border: "border-amber-500/30",
    stepActive: "bg-amber-500 text-amber-950",
    btnClass: "bg-amber-500 hover:bg-amber-600 text-amber-950 font-black shadow-lg shadow-amber-500/25",
    btnLabel: "✨ Hazırlandı Olarak İşaretle",
  },
  READY: {
    card: "bg-emerald-500/8 dark:bg-emerald-950/20 border-emerald-500/35 hover:border-emerald-500/55 shadow-emerald-500/5",
    header: "bg-emerald-500/10 border-emerald-500/20",
    badge: "bg-emerald-600 text-white font-black shadow-xs",
    border: "border-emerald-500/30",
    stepActive: "bg-emerald-600 text-white",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white font-black",
    btnLabel: "Servise Hazır",
  },
};

const AUTH_ERRORS: Record<string, string> = {
  STAFF_FORBIDDEN: "Bu işlemi yapmaya yetkiniz yok.",
  NO_STAFF_SESSION: "Oturum süreniz doldu. Lütfen tekrar giriş yapın.",
};
const toMessage = (m: string): string => AUTH_ERRORS[m] ?? m;

/** Active self-order lines on a ticket (drives the "guest added" alert). */
const selfOrderLineCount = (t: KitchenTicketDTO): number =>
  t.batches.reduce((s, b) => s + (b.isSelfOrder ? b.lines.length : 0), 0);

const ticketTitle = (t: KitchenTicketDTO): string => {
  if (t.orderType === "DINE_IN") {
    return t.tableLabel ? `Masa ${t.tableLabel}` : "Masada";
  }
  if (t.orderType === "DELIVERY") {
    return `Paket #${t.orderNumber}`;
  }
  return `Gel-Al #${t.orderNumber}`;
};

const elapsedLabel = (iso: string | null, now: number): string => {
  if (!iso) {
    return "";
  }
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return `${mins} dk`;
};

function TicketCard({
  ticket,
  now,
}: {
  readonly ticket: KitchenTicketDTO;
  readonly now: number;
}) {
  const advance = useServerAction(advanceTicketAction, {
    refresh: true,
    onError: (m) => toast.error(toMessage(m)),
  });

  const theme = CARD_THEME[ticket.status];

  return (
    <li
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border-2 transition-all duration-300 shadow-md card-hover",
        theme.card,
      )}
    >
      {/* TICKET HEADER */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b p-4 backdrop-blur-xs",
          theme.header,
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-xl font-black text-foreground tracking-tight">
              {ticketTitle(ticket)}
            </span>
          </div>
          {ticket.firstFiredAt ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mt-0.5">
              <ClockIcon className="size-3" />
              <span>Bekleme: {elapsedLabel(ticket.firstFiredAt, now)}</span>
            </div>
          ) : null}
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-black tracking-tight uppercase",
            theme.badge,
          )}
        >
          {KITCHEN_STATUS_LABEL[ticket.status]}
        </span>
      </div>

      {/* STEP BY STEP PROGRESS INDICATOR */}
      <div className="grid grid-cols-3 gap-1.5 px-4 pt-3.5 pb-1">
        {/* Step 1: Bekliyor */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "WAITING"
                ? "bg-rose-500 shadow-xs"
                : ticket.status === "PREPARING" || ticket.status === "READY"
                  ? "bg-rose-500/80"
                  : "bg-muted",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-bold tracking-tight",
              ticket.status === "WAITING" ? "text-rose-600 dark:text-rose-400 font-black" : "text-muted-foreground",
            )}
          >
            1. Bekliyor
          </span>
        </div>

        {/* Step 2: Hazırlanıyor */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "PREPARING"
                ? "bg-amber-500 shadow-xs animate-pulse"
                : ticket.status === "READY"
                  ? "bg-emerald-500"
                  : "bg-muted",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-bold tracking-tight",
              ticket.status === "PREPARING" ? "text-amber-600 dark:text-amber-400 font-black" : "text-muted-foreground",
            )}
          >
            2. Hazırlanıyor
          </span>
        </div>

        {/* Step 3: Servise Hazır */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-all duration-300",
              ticket.status === "READY" ? "bg-emerald-500 shadow-xs" : "bg-muted",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-bold tracking-tight",
              ticket.status === "READY" ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-muted-foreground",
            )}
          >
            3. Servise Hazır
          </span>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="flex flex-col gap-3 p-4">
        {ticket.batches.map((batch, idx) => (
          <div key={batch.firedAt ?? idx} className="flex flex-col gap-2">
            {batch.isAddOn || batch.isSelfOrder ? (
              <div className="flex items-center gap-2">
                {batch.isAddOn ? (
                  <span className="rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-black uppercase">
                    ＋ Eklenen ({elapsedLabel(batch.firedAt, now)})
                  </span>
                ) : null}
                {batch.isSelfOrder ? <SelfOrderBadge /> : null}
              </div>
            ) : null}

            <ul className="divide-y divide-border/40 rounded-2xl bg-card/70 border border-border/60 p-3 shadow-xs">
              {batch.lines.map((line) => (
                <li key={line.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-sm font-black text-foreground tabular-nums border border-border/40">
                    {line.quantity}×
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground leading-snug">
                      {line.name}
                      {line.variantName ? ` · ${line.variantName}` : ""}
                    </span>
                    {line.modifiers.length > 0 ? (
                      <span className="block text-xs font-semibold text-muted-foreground mt-0.5">
                        {line.modifiers.join(", ")}
                      </span>
                    ) : null}
                    {line.lineNote ? (
                      <span className="inline-block mt-1 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 text-xs font-bold italic">
                        Not: “{line.lineNote}”
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ACTION BUTTON / STATUS FOOTER */}
      <div className="p-4 pt-0">
        {ticket.advanceLabel ? (
          <Button
            size="lg"
            disabled={advance.isPending}
            onClick={() => advance.execute({ orderId: ticket.orderId })}
            className={cn(
              "h-13 w-full rounded-2xl text-base font-black transition-all active:scale-[0.98] cursor-pointer",
              theme.btnClass,
            )}
          >
            {advance.isPending ? "İşleniyor..." : theme.btnLabel}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 py-3.5 text-center text-sm font-black text-emerald-700 dark:text-emerald-300 shadow-xs">
            <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
            <span>Servise & Garsona Teslime Hazır</span>
          </div>
        )}
      </div>
    </li>
  );
}

export function KitchenDisplay({
  username,
  restaurantName,
  staffName,
  tickets,
}: {
  readonly username: string;
  readonly restaurantName: string;
  readonly staffName: string;
  readonly tickets: readonly KitchenTicketDTO[];
}) {
  const router = useRouter();
  const { supported, enabled, toggle, announce } = useAnnouncer();
  const [now, setNow] = useState(() => Date.now());
  const seenRef = useRef<Map<string, number> | null>(null);

  // Live timers + lightweight polling every 3s
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const id = setInterval(() => {
      setNow(Date.now());
      router.refresh();
    }, 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [router]);

  useEffect(() => {
    const sigs = tickets.map((t) => ({
      id: t.orderId,
      selfOrderLines: selfOrderLineCount(t),
    }));
    if (seenRef.current === null) {
      seenRef.current = alertSignatureMap(sigs);
      return;
    }
    const alerts = newOrderAlerts(seenRef.current, sigs);
    seenRef.current = alertSignatureMap(sigs);
    const alert = alerts[0];
    if (!alert) {
      return;
    }
    const ticket = tickets.find((t) => t.orderId === alert.id);
    if (ticket) {
      announce(
        alert.isSelfOrder ? selfOrderAlertPhrase(ticket) : newOrderPhrase(ticket),
        "beep",
      );
    }
  }, [tickets, announce]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 p-4 sm:p-6">
      {/* HEADER: No Logout Button as requested */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {restaurantName}
          </span>
          <h1 className="text-xl font-black text-foreground flex items-center gap-2 mt-0.5">
            <ChefHatIcon className="size-6 text-primary" />
            <span>Mutfak Ekranı · {staffName}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <SoundToggle
            supported={supported}
            enabled={enabled}
            onToggle={toggle}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Bekleyen Sipariş Fişleri {tickets.length > 0 ? `(${tickets.length})` : ""}
        </h2>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <ChefHatIcon className="size-7" />
          </div>
          <h3 className="text-base font-black text-foreground">Şu an bekleyen mutfak siparişi yok</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Yeni siparişler verildiğinde otomatik olarak sesli bildirimle burada görüntülenecektir.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {tickets.map((t) => (
            <TicketCard key={t.orderId} ticket={t} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}
