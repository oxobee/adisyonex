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
    .enum(["STUDIO_FOOD", "RUSTIC", "MODERN_MINIMAL", "FAST_FOOD_VIBRANT", "DARK_GOURMET"])
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

export const aiCommitItemSchema = z.object({
  name: z.string().min(1).max(100),
  categoryName: z.string().min(1).max(100),
  price: z.number().min(0),
  shortDescription: z.string().max(500).optional(),
  calories: z.number().int().min(0).max(10000).optional().nullable(),
  prepTimeMinutes: z.number().int().min(0).max(300).optional().nullable(),
  dietaryType: z.enum(["VEG", "NON_VEG", "EGG"]).optional().nullable(),
  allergens: z.array(z.string()).default([]),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
      }),
    )
    .default([]),
});

export const aiCommitMenuSchema = z.object({
  categories: z.array(z.string().min(1)),
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
