"use client";

import { useEffect } from "react";
import { setCachedSnapshot } from "@/lib/offline-sync";
import type { MenuDTO } from "@/types/menu";
import type { ServiceOptions } from "@/types/settings";
import type { TableDTO } from "@/types/table";

import { CashierSalesTerminal } from "./cashier-sales-terminal";

export function PosTerminal({
  menu,
  tables,
  cashierName = "Kasa Personeli",
  restaurantName = "Adisyoon",
}: {
  readonly menu: MenuDTO;
  readonly tables: readonly TableDTO[];
  readonly occupied?: Record<string, string>;
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
      cashierName={cashierName}
      restaurantName={restaurantName}
    />
  );
}
