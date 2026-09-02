import { notFound } from "next/navigation";

import { GuestOrderPage } from "@/components/guest-order/guest-order-page";
import { getGuestSession } from "@/lib/guest-session";
import { maskPhone } from "@/lib/format";
import {
  getGuestOrders,
  loadGuestOrderPage,
} from "@/services/guest-order.service";

function GuestNotice({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">{message}</p>
    </main>
  );
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { username } = await params;
  const { table } = await searchParams;

  const result = await loadGuestOrderPage(username, table);

  if (result.status === "not_found") {
    notFound();
  }
  if (result.status === "disabled") {
    return (
      <GuestNotice
        title={result.restaurantName}
        message="Müşteri QR sipariş sistemi şu an kapalıdır. Lütfen garsonunuza sipariş veriniz."
      />
    );
  }
  if (result.status === "invalid_table") {
    return (
      <GuestNotice
        title={result.restaurantName}
        message="Masa bilgisi bulunamadı. Lütfen masanızdaki QR kodu tekrar okutun veya garsonunuza danışın."
      />
    );
  }

  const { data } = result;
  const session = await getGuestSession();
  const verified =
    session?.restaurantId === data.restaurantId &&
    session?.tableId === data.tableId;

  const verifiedPhoneMasked =
    verified && session ? maskPhone(session.phone) : null;
  const verifiedExpiresAt = verified && session ? session.expiresAt : null;
  const initialOrders = await getGuestOrders(
    data.restaurantId,
    session?.phone ?? "",
    data.tableId,
  );

  return (
    <main className="min-h-svh">
      <GuestOrderPage
        username={data.username}
        tableId={data.tableId}
        tableLabel={data.tableLabel}
        restaurantName={data.restaurantName}
        logoUrl={data.logoUrl}
        menu={data.menu}
        initiallyVerified={Boolean(verified)}
        verifiedPhoneMasked={verifiedPhoneMasked}
        verifiedExpiresAt={verifiedExpiresAt}
        initialOrders={initialOrders}
        qrMenuTheme={data.qrMenuTheme || "MODERN"}
      />
    </main>
  );
}
