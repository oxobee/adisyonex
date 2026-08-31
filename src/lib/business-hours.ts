import type { BusinessHoursDTO } from "@/types/settings";

export const DAY_LABELS: Record<number, string> = {
  0: "Pazar",
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
  6: "Cumartesi",
};

/** Display order — Monday first. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DEFAULT_BUSINESS_HOURS: BusinessHoursDTO[] = [
  0, 1, 2, 3, 4, 5, 6,
].map((day) => ({ day, isClosed: false, opensAt: "11:00", closesAt: "23:00" }));
