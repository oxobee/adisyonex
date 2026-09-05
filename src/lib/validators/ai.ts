import { z } from "zod";

export const aiMenuDigitizeInputSchema = z.object({
  fileUrl: z.string().optional(),
  fileUrls: z.array(z.string()).optional(),
  mediaType: z.enum(["IMAGE", "PDF", "TEXT"]).default("IMAGE"),
  rawText: z.string().max(30000).optional(),
});

export type AiMenuDigitizeInput = z.infer<typeof aiMenuDigitizeInputSchema>;

export const aiMenuUrlInputSchema = z.object({
  url: z.string().url("Geçerli bir web sitesi adresi girin (http:// veya https://)"),
});

export type AiMenuUrlInput = z.infer<typeof aiMenuUrlInputSchema>;

export const aiCopywriterInputSchema = z.object({
  itemName: z.string().min(2).max(100),
  categoryName: z.string().max(100).optional(),
  ingredients: z.string().max(500).optional(),
  tone: z
    .enum(["APPETIZING", "GOURMET", "CONCISE", "HEALTHY", "CREATIVE"])
    .default("APPETIZING"),
});

export type AiCopywriterInput = z.infer<typeof aiCopywriterInputSchema>;

export const aiImageGenInputSchema = z.object({
  itemName: z.string().min(2).max(100),
  itemDescription: z.string().max(500).optional(),
  style: z
    .enum([
      "STUDIO_FOOD",
      "WHITE_BACKGROUND",
      "RUSTIC",
      "MODERN_MINIMAL",
      "FAST_FOOD_VIBRANT",
      "DARK_GOURMET",
    ])
    .default("STUDIO_FOOD"),
  qualityLevel: z.enum(["ECONOMY", "STANDARD", "PROFESSIONAL", "ULTRA"]).default("STANDARD"),
});

export type AiImageGenInput = z.infer<typeof aiImageGenInputSchema>;

export const aiPhotoProfessionalizeSchema = z.object({
  imageUrl: z.string().min(1, "Fotoğraf seçilmelidir"),
  dishName: z.string().min(2, "Yemek adı belirtilmelidir").max(100),
  qualityLevel: z.enum(["STANDARD", "PROFESSIONAL", "ULTRA"]).default("PROFESSIONAL"),
});

export type AiPhotoProfessionalizeInput = z.infer<typeof aiPhotoProfessionalizeSchema>;

const parseNumericValue = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9,.-]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const parsePrice = (value: unknown): number => {
  const n = parseNumericValue(value);
  return n !== undefined && n >= 0 ? n : 0;
};

const parsePriceDelta = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const isNegative = value.includes("-");
    const cleaned = value.replace(/[^0-9,.-]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return 0;
    return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
  }
  return 0;
};

const parseOptionalInt = (value: unknown): number | null | undefined => {
  if (value === null) return null;
  if (value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : undefined;
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
  }
  return undefined;
};

const normalizeDietaryType = (value: unknown): "VEG" | "NON_VEG" | "EGG" | null | undefined => {
  if (value === null) return null;
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["VEG", "VEGAN", "VEGETARIAN", "VEJETARYEN"].includes(normalized)) {
    return "VEG";
  }
  if (["NON_VEG", "NONVEG", "MEAT", "ETLI", "ETLİ"].includes(normalized)) {
    return "NON_VEG";
  }
  if (["EGG", "YUMURTALI", "YUMURTALI_URUN"].includes(normalized)) {
    return "EGG";
  }
  return undefined;
};

const normalizeAllergens = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((allergen) => {
      if (typeof allergen === "string") return allergen.trim().slice(0, 50);
      if (
        allergen &&
        typeof allergen === "object" &&
        "name" in allergen &&
        typeof (allergen as { name?: unknown }).name === "string"
      ) {
        return (allergen as { name: string }).name.trim().slice(0, 50);
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 30);
};

const normalizeVariants = (value: unknown): Array<{ name: string; price: number }> => {
  if (!Array.isArray(value)) return [];
  return value
    .map((variant) => {
      if (!variant || typeof variant !== "object") return null;
      const raw = variant as { name?: unknown; price?: unknown };
      const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 100) : "";
      if (!name) return null;
      return { name, price: parsePrice(raw.price) };
    })
    .filter((variant): variant is { name: string; price: number } => variant !== null)
    .slice(0, 20);
};

const normalizeModifierGroups = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((group) => {
      if (!group || typeof group !== "object") return null;
      const raw = group as {
        name?: unknown;
        minSelect?: unknown;
        maxSelect?: unknown;
        isRequired?: unknown;
        modifiers?: unknown;
      };
      const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 100) : "";
      if (!name) return null;
      const rawModifiers = Array.isArray(raw.modifiers) ? raw.modifiers : [];
      const modifiers = rawModifiers
        .map((m) => {
          if (!m || typeof m !== "object") return null;
          const mRaw = m as { name?: unknown; priceDelta?: unknown };
          const mName = typeof mRaw.name === "string" ? mRaw.name.trim().slice(0, 100) : "";
          if (!mName) return null;
          return {
            name: mName,
            priceDelta: parsePriceDelta(mRaw.priceDelta),
          };
        })
        .filter((m): m is { name: string; priceDelta: number } => m !== null);

      if (modifiers.length === 0) return null;

      const isRequired = Boolean(raw.isRequired);
      let minSelect = parseOptionalInt(raw.minSelect) ?? (isRequired ? 1 : 0);
      if (minSelect < 0) minSelect = 0;
      let maxSelect = parseOptionalInt(raw.maxSelect) ?? Math.max(1, modifiers.length);
      if (maxSelect < 1) maxSelect = 1;
      if (maxSelect < minSelect) maxSelect = minSelect;

      return {
        name,
        minSelect,
        maxSelect,
        isRequired,
        modifiers,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .slice(0, 15);
};

const normalizeCategories = (value: unknown): string[] => {
  if (!Array.isArray(value)) return ["Genel"];
  const set = new Set<string>();
  for (const c of value) {
    if (typeof c === "string") {
      const trimmed = c.trim();
      if (trimmed.length > 0) {
        set.add(trimmed.slice(0, 100));
      }
    }
  }
  const result = Array.from(set);
  return result.length > 0 ? result : ["Genel"];
};

export const aiCommitItemSchema = z.object({
  name: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim().slice(0, 100) : "İsimsiz Ürün"),
    z.string().min(1).max(100),
  ),
  categoryName: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim().slice(0, 100) : "Genel"),
    z.string().min(1).max(100),
  ),
  price: z.preprocess(parsePrice, z.number().finite().min(0)),
  shortDescription: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const trimmed = val.trim();
        return trimmed.length > 0 ? trimmed.slice(0, 500) : undefined;
      }
      return undefined;
    },
    z.string().max(500).optional(),
  ),
  calories: z.preprocess(
    parseOptionalInt,
    z.number().int().min(0).max(10000).optional().nullable(),
  ),
  prepTimeMinutes: z.preprocess(
    parseOptionalInt,
    z.number().int().min(0).max(300).optional().nullable(),
  ),
  dietaryType: z.preprocess(
    normalizeDietaryType,
    z.enum(["VEG", "NON_VEG", "EGG"]).optional().nullable(),
  ),
  allergens: z.preprocess(normalizeAllergens, z.array(z.string().trim().min(1).max(50)).max(30)),
  variants: z.preprocess(
    normalizeVariants,
    z.array(
      z.object({
        name: z.string().trim().min(1).max(100),
        price: z.number().finite().min(0),
      }),
    ).max(20),
  ),
  modifierGroups: z.preprocess(
    normalizeModifierGroups,
    z.array(
      z.object({
        name: z.string().trim().min(1).max(100),
        minSelect: z.number().int().min(0).default(0),
        maxSelect: z.number().int().min(1).default(1),
        isRequired: z.boolean().default(false),
        modifiers: z.array(
          z.object({
            name: z.string().trim().min(1).max(100),
            priceDelta: z.number().finite().default(0),
          }),
        ).min(1),
      }),
    ).optional(),
  ),
});

export const aiCommitMenuSchema = z.object({
  categories: z.preprocess(
    normalizeCategories,
    z.array(z.string().trim().min(1).max(100)),
  ),
  items: z.array(aiCommitItemSchema).min(1, "En az bir ürün seçilmelidir"),
});

export type AiCommitMenuInput = z.infer<typeof aiCommitMenuSchema>;

export const aiAdminCreditRechargeSchema = z.object({
  restaurantId: z.string().min(1),
  amount: z.number().int().min(-100000).max(100000),
  description: z.string().max(200).optional(),
});

export type AiAdminCreditRechargeInput = z.infer<typeof aiAdminCreditRechargeSchema>;

export const aiSettingUpdateSchema = z.object({
  openRouterApiKey: z.string().min(10).optional(),
  defaultVisionModel: z.string().min(2).optional(),
  defaultTextModel: z.string().min(2).optional(),
  defaultImageModel: z.string().min(2).optional(),
  lowBalanceThresholdUsd: z.number().min(0).optional(),
  maxCostPerRequestUsd: z.number().min(0).optional(),
});

export type AiSettingUpdateInput = z.infer<typeof aiSettingUpdateSchema>;

export const quickShortDescSchema = z.object({
  name: z.string().min(1, "Ürün adı gereklidir"),
  categoryName: z.string().optional(),
});
export type QuickShortDescInput = z.infer<typeof quickShortDescSchema>;

export const quickLongDescSchema = z.object({
  name: z.string().min(1, "Ürün adı gereklidir"),
  categoryName: z.string().optional(),
  shortDescription: z.string().optional(),
});
export type QuickLongDescInput = z.infer<typeof quickLongDescSchema>;

export const estimateCaloriesSchema = z.object({
  name: z.string().min(1, "Ürün adı gereklidir"),
  categoryName: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  imageUrl: z.string().optional(),
});
export type EstimateCaloriesInput = z.infer<typeof estimateCaloriesSchema>;

export const detectAllergensSchema = z.object({
  name: z.string().min(1, "Ürün adı gereklidir"),
  categoryName: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
});
export type DetectAllergensInput = z.infer<typeof detectAllergensSchema>;

export const attachItemImageSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});
export type AttachItemImageInput = z.infer<typeof attachItemImageSchema>;

export const enhanceAttachItemImageSchema = z.object({
  itemId: z.string().min(1),
  imageUrl: z.string().min(1),
  dishName: z.string().min(1),
});
export type EnhanceAttachItemImageInput = z.infer<typeof enhanceAttachItemImageSchema>;

export const saveImageToItemSchema = z.object({
  itemId: z.string().min(1),
  imageUrl: z.string().min(1),
});
export type SaveImageToItemInput = z.infer<typeof saveImageToItemSchema>;
