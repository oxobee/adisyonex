import { notFound } from "next/navigation";

import { PrintButton } from "@/components/orders/print-button";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { formatDateTime } from "@/lib/format";
import { getOrder } from "@/services/order.service";

export default async function KotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    notFound();
  }
  const { id } = await params;
  const order = await getOrder(ctx.restaurantId, id).catch(() => null);
  if (!order) {
    notFound();
  }

  const lines = order.lines.filter((l) => l.state !== "VOID");
  const groupedLines = [
    { title: "Yemekler", lines: lines.filter((line) => line.itemType === "SERVED") },
    { title: "Paketli Ürünler", lines: lines.filter((line) => line.itemType === "PACKAGED_GOODS") },
    { title: "Diğer", lines: lines.filter((line) => !line.itemType || !["SERVED", "PACKAGED_GOODS"].includes(line.itemType)) },
  ].filter((group) => group.lines.length > 0);

  const typeLabels: Record<string, string> = {
    DINE_IN: "Masa",
    TAKEAWAY: "Gel-Al",
    DELIVERY: "Paket",
  };

  return (
    <div className="mx-auto w-full max-w-[80mm] p-4 font-mono text-[13px] leading-tight text-black print:max-w-none print:p-2">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <span className="text-muted-foreground text-xs">Mutfak Fişi</span>
        <PrintButton label="Fişi Yazdır" />
      </div>

      <div className="border-b-2 border-black pb-3 text-center">
        <p className="text-lg font-black tracking-wide">ADİSYON / KOT</p>
        <p className="text-2xl font-black">#{order.orderNumber}</p>
        <p>{typeLabels[order.orderType] ?? order.orderType}</p>
        {order.tableLabel ? <p>Masa {order.tableLabel}</p> : null}
        {order.customerName ? <p>Müşteri: {order.customerName}</p> : null}
        <p className="text-xs">{formatDateTime(order.createdAt)}</p>
      </div>

      <div className="py-3">
        {groupedLines.map((group) => (
          <section key={group.title} className="mb-3 last:mb-0">
            <h2 className="border-b border-black pb-1 text-xs font-black uppercase tracking-widest">{group.title}</h2>
            <ul className="flex flex-col gap-3 pt-2">
            {group.lines.map((line) => (
          <li key={line.id}>
            <p className="font-bold">
              {line.quantity} × {line.name}
              {line.variantName ? ` (${line.variantName})` : ""}
            </p>
            {line.modifiers.length > 0 ? (
              <p className="pl-4 text-xs">
                {line.modifiers.map((m) => m.name).join(", ")}
              </p>
            ) : null}
            {line.lineNote ? (
              <p className="pl-4 text-xs italic">** {line.lineNote}</p>
            ) : null}
          </li>
        ))}
            </ul>
          </section>
        ))}
      </div>

      {order.note ? (
        <p className="border-t border-dashed pt-2 text-xs italic">
          Not: {order.note}
        </p>
      ) : null}
    </div>
  );
}
