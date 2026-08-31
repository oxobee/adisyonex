import type { RestaurantFormat } from "@/types/settings";

export const FORMAT_LABELS: Record<RestaurantFormat, string> = {
  FINE_DINING: "Lüks Restoran (Fine dining)",
  CASUAL_DINING: "Klasik Restoran (Casual dining)",
  QSR: "Fast Food / Hızlı Servis (QSR)",
  CAFE: "Kafe / Kahve Evi",
  CLOUD_KITCHEN: "Paket Mutfak (Cloud kitchen)",
  BAR: "Bar / Pub / Bistro",
  BAKERY: "Fırın / Pastane",
  FOOD_TRUCK: "Yemek Karavanı (Food truck)",
  OTHER: "Diğer",
};

export const FORMAT_OPTIONS = (
  Object.keys(FORMAT_LABELS) as RestaurantFormat[]
).map((value) => ({ value, label: FORMAT_LABELS[value] }));

export const CUISINE_OPTIONS: readonly string[] = [
  "Türk Mutfağı",
  "Dünya Mutfağı",
  "İtalyan",
  "Uzak Doğu / Asya",
  "Fast Food / Burger",
  "Kebap & Izgara",
  "Pide & Lahmacun",
  "Ev Yemekleri",
  "Kahvaltı",
  "Tatlı & Pasta",
  "Kahve & İçecek",
  "Deniz Ürünleri / Balık",
  "Vejetaryen / Vegan",
  "Sokak Lezzetleri",
];
