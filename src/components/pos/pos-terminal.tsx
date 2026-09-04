"use client";

import { useEffect } from "react";
import { setCachedSnapshot } from "@/lib/offline-sync";
import type { MenuDTO } from "@/types/menu";
import type { ServiceOptions } from "@/types/settings";
import type { TableDTO } from "@/types/table";

import { CashierSalesTerminal } from "./cashier-sales-terminal";

import type { OrderDTO } from "@/types/order";

export function PosTerminal({
  menu,
  tables,
  occupied = {},
  openOrders = [],
  cashierName = "Kasa Personeli",
  restaurantName = "Adisyoon",
}: {
  readonly menu: MenuDTO;
  readonly tables: readonly TableDTO[];
  readonly occupied?: Record<string, string>;
  readonly openOrders?: readonly OrderDTO[];
  readonly services?: ServiceOptions;
  readonly cashierName?: string;
  readonly restaurantName?: string;
}) {
  // Automatically snapshot menu and tables to local device storage for offline capability
  useEffect(() => {
    if (menu) setCachedSnapshot("menu", menu);
    if (tables) setCachedSnapshot("tables", tables);
  }, [menu, tables]);

  return (
    <CashierSalesTerminal
      menu={menu}
      tables={tables}
      occupied={occupied}
      openOrders={openOrders}
      cashierName={cashierName}
      restaurantName={restaurantName}
    />
  );
}
