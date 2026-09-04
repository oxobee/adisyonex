"use client";
 
import { useState, useEffect, useRef } from "react";

import type { MenuItemDTO } from "@/types/menu";

import { newLineKey, type CartLine } from "./types";

export interface OrderCart {
  readonly cart: CartLine[];
  readonly addLine: (line: CartLine) => void;
  readonly quickAdd: (item: MenuItemDTO) => void;
  readonly changeQty: (key: string, delta: number) => void;
  readonly removeLine: (key: string) => void;
  readonly toggleComp: (key: string) => void;
  readonly replaceAll: (lines: CartLine[]) => void;
  readonly clear: () => void;
}

/** Local order cart used by the POS terminal and the add-a-round dialog. Supports optional persistence via storageKey. */
export function useOrderCart(storageKey?: string): OrderCart {
  const [cart, setCart] = useState<CartLine[]>([]);
  const isHydratedRef = useRef(false);

  // Load initial cart from localStorage if storageKey is provided
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      // ignore parsing errors
    } finally {
      isHydratedRef.current = true;
    }
  }, [storageKey]);

  // Sync cart to localStorage whenever it updates
  useEffect(() => {
    if (!storageKey || typeof window === "undefined" || !isHydratedRef.current) return;
    try {
      if (cart.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      }
    } catch {
      // ignore quota errors
    }
  }, [cart, storageKey]);

  const addLine = (line: CartLine) => setCart((prev) => [...prev, line]);

  const quickAdd = (item: MenuItemDTO) =>
    setCart((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.menuItemId === item.id &&
          l.variantId === null &&
          l.modifiers.length === 0 &&
          !l.lineNote &&
          !l.isComp,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Math.min(99, next[idx].quantity + 1) };
        return next;
      }
      return [
        ...prev,
        {
          key: newLineKey(),
          menuItemId: item.id,
          name: item.name,
          variantId: null,
          variantName: null,
          unitPrice: item.price,
          taxRate: item.tax.rate,
          taxInclusive: item.tax.inclusive,
          modifiers: [],
          quantity: 1,
          lineNote: null,
          isComp: false,
        },
      ];
    });

  const changeQty = (key: string, delta: number) =>
    setCart((prev) =>
      prev.map((l) =>
        l.key === key
          ? { ...l, quantity: Math.min(99, Math.max(1, l.quantity + delta)) }
          : l,
      ),
    );

  const removeLine = (key: string) =>
    setCart((prev) => prev.filter((l) => l.key !== key));

  const toggleComp = (key: string) =>
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, isComp: !l.isComp } : l)),
    );

  const replaceAll = (lines: CartLine[]) => setCart(lines);

  const clear = () => setCart([]);

  return {
    cart,
    addLine,
    quickAdd,
    changeQty,
    removeLine,
    toggleComp,
    replaceAll,
    clear,
  };
}
