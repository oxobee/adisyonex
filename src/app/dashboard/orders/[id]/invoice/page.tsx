import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/orders/print-button";
import { formatCurrency } from "@/lib/format";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { findRestaurantById } from "@/repositories/restaurant.repository";
import { getOrder } from "@/services/order.service";
import type { OrderLineDTO } from "@/types/order";

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const money = (n: number): string => n.toFixed(2);

const TYPE_LABEL: Record<string, string> = {
  DINE_IN: "Masa",
  TAKEAWAY: "Gel-Al",
  DELIVERY: "Paket",
};

const unitPrice = (line: OrderLineDTO): number =>
  line.unitPrice + line.modifiers.reduce((s, m) => s + m.priceDelta, 0);

const lineAmount = (line: OrderLineDTO): number =>
  line.isComp ? 0 : unitPrice(line) * line.quantity;

const dateIST = (iso: string): string =>
  new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const timeIST = (iso: string): string =>
  new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function Hr() {
  return <div className="my-1.5 border-t border-dashed border-black" />;
}

function TotalRow({
  label,
  value,
  bold,
}: {
  readonly label: string;
  readonly value: string;
  readonly bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ copy?: string }>;
}) {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    notFound();
  }
  const { id } = await params;
  const { copy } = await searchParams;
  const [order, restaurant] = await Promise.all([
    getOrder(ctx.restaurantId, id).catch(() => null),
    findRestaurantById(ctx.restaurantId),
  ]);
  if (!order || !restaurant) {
    notFound();
  }

  if (order.status !== "COMPLETED") {
    return (
      <div className="mx-auto max-w-sm p-6 text-center text-sm">
        <p>Bu sipariş henüz kapatılmadı.</p>
        <Link href={`/dashboard/orders/${order.id}`} className="underline">
          Siparişe Geri Dön
        </Link>
      </div>
    );
  }

  const registered = restaurant.gstRegistrationType !== "UNREGISTERED";
  const lines = order.lines.filter((l) => l.state !== "VOID");
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const cgst = round2(order.taxTotal / 2);
  const sgst = round2(order.taxTotal - cgst);

  // Show the GST rate only when every taxable line shares one rate.
  const taxableRates = new Set(
    lines.filter((l) => !l.isComp && l.taxRate > 0).map((l) => l.taxRate),
  );
  const halfRate = taxableRates.size === 1 ? [...taxableRates][0] / 2 : null;
  const rateSuffix = halfRate != null ? `@%${halfRate}` : "";

  const addressLine = [
    restaurant.addressLine1,
    restaurant.addressLine2,
    [restaurant.city, restaurant.state].filter(Boolean).join(", "),
    restaurant.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const roundOffLabel =
    order.roundOff === 0
      ? null
      : `${order.roundOff > 0 ? "+" : "−"}${money(Math.abs(order.roundOff))}`;

  const footer =
    restaurant.invoiceFooterNote?.trim() || "Bizi tercih ettiğiniz için teşekkür ederiz. Yine bekleriz!";

  return (
    <div className="mx-auto w-full max-w-[320px] p-4 font-mono text-[12px] leading-tight text-black">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <span className="text-muted-foreground text-xs">
          {registered ? "Satış Faturası" : "Adisyon Fişi"}
        </span>
        <PrintButton label="Fatura Yazdır" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-bold tracking-wide">
          {registered ? "SATIŞ FATURASI" : "ADİSYON FİŞİ"}
          {copy === "1" ? " (KOPYA)" : ""}
        </p>
        {restaurant.legalName ? (
          <p className="uppercase">{restaurant.legalName}</p>
        ) : null}
        <p className="text-sm font-bold uppercase">{restaurant.name}</p>
        {restaurant.tagline ? <p>{restaurant.tagline}</p> : null}
        {addressLine ? <p>{addressLine}</p> : null}
        {restaurant.phone ? <p>Tel: {restaurant.phone}</p> : null}
        {registered && restaurant.gstin ? (
          <p>Vergi No: {restaurant.gstin}</p>
        ) : null}
        {restaurant.fssaiLicense ? (
          <p>İşletme Belge No: {restaurant.fssaiLicense}</p>
        ) : null}
      </div>

      <Hr />

      {/* Meta */}
      <div className="flex flex-col gap-0.5">
        {order.customerName ? <p>Müşteri: {order.customerName}</p> : null}
        <div className="flex justify-between">
          <span>Tarih: {order.settledAt ? dateIST(order.settledAt) : ""}</span>
          <span className="font-bold">
            {TYPE_LABEL[order.orderType] ?? order.orderType}
            {order.orderType === "DINE_IN" && order.tableLabel
              ? `: ${order.tableLabel}`
              : ""}
          </span>
        </div>
        {order.settledAt ? <span>Saat: {timeIST(order.settledAt)}</span> : null}
        <div className="flex justify-between">
          <span>Fatura No: {order.invoiceNumber ?? order.orderNumber}</span>
          <span>Sipariş No: #{order.orderNumber}</span>
        </div>
      </div>

      <Hr />

      {/* Items */}
      <div className="flex font-bold">
        <span className="flex-1">Ürün</span>
        <span className="w-8 text-right">Adet</span>
        <span className="w-14 text-right">Fiyat</span>
        <span className="w-16 text-right">Tutar</span>
      </div>
      <Hr />
      <div className="flex flex-col gap-0.5">
        {lines.map((line) => (
          <div key={line.id} className="flex">
            <span className="flex-1 pr-1">
              {line.name}
              {line.variantName ? ` (${line.variantName})` : ""}
              {line.isComp ? " — ikram" : ""}
            </span>
            <span className="w-8 text-right tabular-nums">{line.quantity}</span>
            <span className="w-14 text-right tabular-nums">
              {money(unitPrice(line))}
            </span>
            <span className="w-16 text-right tabular-nums">
              {money(lineAmount(line))}
            </span>
          </div>
        ))}
      </div>

      <Hr />

      {/* Totals */}
      <div className="flex flex-col gap-0.5">
        <TotalRow
          label={`Ara Toplam (Toplam Adet: ${totalQty})`}
          value={money(order.subtotal)}
        />
        {order.discountTotal > 0 ? (
          <TotalRow label="İndirim" value={`−${money(order.discountTotal)}`} />
        ) : null}
        {registered ? (
          <>
            <TotalRow label={`KDV${rateSuffix}`} value={money(sgst + cgst)} />
          </>
        ) : null}
        {roundOffLabel ? (
          <TotalRow label="Yuvarlama" value={roundOffLabel} />
        ) : null}
      </div>

      <Hr />

      <TotalRow
        label="Genel Toplam"
        value={formatCurrency(order.grandTotal)}
        bold
      />

      <Hr />

      <p className="whitespace-pre-line text-center">{footer}</p>
    </div>
  );
}
