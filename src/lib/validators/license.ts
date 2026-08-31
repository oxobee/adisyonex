import { z } from "zod";

export const assignLicenseSchema = z.object({
  restaurantId: z.string().min(1, "Restoran ID gereklidir"),
  plan: z.enum(["TRIAL", "MONTHLY", "YEARLY", "LIFETIME"]),
  customDays: z.number().int().min(1).max(3650).optional(),
  addAiCredits: z.number().int().min(0).max(100000).optional(),
  note: z.string().max(250).optional(),
});

export type AssignLicenseInput = z.infer<typeof assignLicenseSchema>;
