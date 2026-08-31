import type { StockMovementType, StockUnit } from "@/types/inventory";

export const UNIT_LABELS: Record<StockUnit, string> = {
  KG: "kg",
  GRAM: "gr",
  LITRE: "lt",
  ML: "ml",
  PIECE: "adet",
  PACK: "paket",
  BOTTLE: "şişe",
  DOZEN: "düzine",
};

export const STOCK_UNIT_OPTIONS: readonly { value: StockUnit; label: string }[] = [
  { value: "KG", label: "Kilogram (kg)" },
  { value: "GRAM", label: "Gram (gr)" },
  { value: "LITRE", label: "Litre (lt)" },
  { value: "ML", label: "Mililitre (ml)" },
  { value: "PIECE", label: "Adet" },
  { value: "PACK", label: "Paket" },
  { value: "BOTTLE", label: "Şişe" },
  { value: "DOZEN", label: "Düzine" },
];

export const WASTE_REASONS: readonly string[] = [
  "Bozuldu / Çürüdü",
  "Son Kullanma Tarihi Geçti",
  "Kırılma / Dökülme",
  "Hazırlık Fire / Kayıp",
  "Porsiyon Aşımı",
  "Personel Yemeği / İkram",
];

export const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  RECEIVE: "Giriş / Alım",
  WASTE: "Fire / Zayi",
  CORRECTION: "Sayım / Düzeltme",
  SALE_DEPLETION: "Satıştan Düşüş",
};
