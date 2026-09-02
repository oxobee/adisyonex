import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { nameSchema, phoneSchema } from "@/lib/validators/shared";

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
