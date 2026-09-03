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

const normalizeOptionalNumber = (value: unknown): unknown => {
  if (value === null || value === undefined || value === "") return value;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeDietaryType = (value: unknown): unknown => {
  if (value === null || value === undefined || value === "") return value;
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
      if (typeof allergen === "string") return allergen.trim();
      if (
        allergen &&
        typeof allergen === "object" &&
        "name" in allergen &&
        typeof allergen.name === "string"
      ) {
        return allergen.name.trim();
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 30);
};

const normalizeVariants = (value: unknown): Array<{ name: string; price: unknown }> => {
  if (!Array.isArray(value)) return [];
  return value
    .map((variant) => {
      if (!variant || typeof variant !== "object") return null;
      const raw = variant as { name?: unknown; price?: unknown };
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      if (!name) return null;
      return { name, price: normalizeOptionalNumber(raw.price) };
    })
    .filter((variant): variant is { name: string; price: unknown } => variant !== null)
    .slice(0, 20);
};

export const aiCommitItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryName: z.string().trim().min(1).max(100),
  price: z.preprocess(normalizeOptionalNumber, z.number().finite().min(0)),
  shortDescription: z.string().trim().max(500).optional(),
  calories: z.preprocess(
    normalizeOptionalNumber,
    z.number().int().min(0).max(10000).optional().nullable(),
  ),
  prepTimeMinutes: z.preprocess(
    normalizeOptionalNumber,
    z.number().int().min(0).max(300).optional().nullable(),
  ),
  dietaryType: z.preprocess(
    normalizeDietaryType,
    z.enum(["VEG", "NON_VEG", "EGG"]).optional().nullable(),
  ),
  allergens: z.preprocess(normalizeAllergens, z.array(z.string().trim().min(1)).max(30)),
  variants: z.preprocess(
    normalizeVariants,
    z.array(
      z.object({
        name: z.string().trim().min(1).max(100),
        price: z.preprocess(normalizeOptionalNumber, z.number().finite().min(0)),
      }),
    ).max(20),
  ),
});

export const aiCommitMenuSchema = z.object({
  categories: z.array(z.string().trim().min(1).max(100)),
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
