"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withAdminValidation } from "@/actions/helpers";
import {
  assignSalesRepToRestaurant,
  createSalesRep,
  deleteSalesRep,
  updateSalesRep,
} from "@/services/sales-rep.service";

const createSalesRepSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updateSalesRepSchema = z.object({
  id: z.string(),
  data: createSalesRepSchema.partial(),
});

const deleteSalesRepSchema = z.object({
  id: z.string(),
});

const assignSalesRepSchema = z.object({
  restaurantId: z.string(),
  salesRepId: z.string().nullable(),
});

export const createSalesRepAction = withAdminValidation(
  createSalesRepSchema,
  async (data) => {
    const rep = await createSalesRep(data);
    revalidatePath("/admin/sales-reps");
    revalidatePath("/admin/restaurants");
    return rep;
  },
);

export const updateSalesRepAction = withAdminValidation(
  updateSalesRepSchema,
  async ({ id, data }) => {
    const rep = await updateSalesRep(id, data);
    revalidatePath("/admin/sales-reps");
    revalidatePath("/admin/restaurants");
    return rep;
  },
);

export const deleteSalesRepAction = withAdminValidation(
  deleteSalesRepSchema,
  async ({ id }) => {
    await deleteSalesRep(id);
    revalidatePath("/admin/sales-reps");
    revalidatePath("/admin/restaurants");
    return { success: true };
  },
);

export const assignSalesRepAction = withAdminValidation(
  assignSalesRepSchema,
  async ({ restaurantId, salesRepId }) => {
    await assignSalesRepToRestaurant(restaurantId, salesRepId);
    revalidatePath("/admin/restaurants");
    revalidatePath("/admin/sales-reps");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  },
);
