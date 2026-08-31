import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { nameSchema, phoneSchema } from "@/lib/validators/shared";

export const registerCustomerSchema = z.object({
  username: z.string().min(1),
  name: nameSchema,
  phone: phoneSchema,
  birthDate: z.string().optional().nullable(),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

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
