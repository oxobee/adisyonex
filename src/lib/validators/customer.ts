import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { nameSchema } from "@/lib/validators/shared";

const flexiblePhoneSchema = z
  .string()
  .trim()
  .min(7, "Geçerli bir telefon numarası giriniz")
  .max(30)
  .transform((val) => {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
    if (digits.length === 10) return `+90${digits}`;
    if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
    if (!val.startsWith("+") && digits.length > 0) return `+${digits}`;
    return val;
  });

export const registerCustomerSchema = z.object({
  username: z.string().min(1),
  name: nameSchema,
  phone: flexiblePhoneSchema,
  birthDate: z.string().optional().nullable(),
  kvkkConsent: z.boolean().default(true),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const customerProfileQuerySchema = z.object({
  username: z.string().min(1),
  customerId: z.string().optional(),
  phone: z.string().optional(),
});
export type CustomerProfileQuery = z.infer<typeof customerProfileQuerySchema>;

export const customerListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  birthMonth: z.coerce.number().int().min(1).max(12).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

export const customerDiscountSchema = z.object({
  customerId: z.string().min(1),
  scope: z.enum(["EVERY_ORDER", "DATE_RANGE"]),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.coerce.number().positive().max(100000),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.scope === "DATE_RANGE" && (!data.startsAt || !data.endsAt)) {
    ctx.addIssue({ code: "custom", message: "Tarih aralığı için başlangıç ve bitiş tarihi gereklidir." });
  }
  if (data.type === "PERCENT" && data.value > 100) {
    ctx.addIssue({ code: "custom", message: "Yüzde indirim 100'ü aşamaz." });
  }
});

export const toggleCustomerDiscountSchema = z.object({
  customerId: z.string().min(1),
  discountId: z.string().min(1),
  isActive: z.boolean(),
});

export const birthdayAutomationSchema = z.object({
  enabled: z.boolean(),
  daysBefore: z.coerce.number().int().min(0).max(60),
  discountType: z.enum(["PERCENT", "FLAT"]),
  discountValue: z.coerce.number().positive().max(100000),
  messageTitle: z.string().trim().min(1).max(120),
  messageContent: z.string().trim().min(1).max(1000),
}).superRefine((data, ctx) => {
  if (data.discountType === "PERCENT" && data.discountValue > 100) {
    ctx.addIssue({ code: "custom", message: "Yüzde indirim 100'ü aşamaz." });
  }
});
