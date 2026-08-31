"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withManagerValidation, withValidation } from "@/actions/helpers";
import {
  customerListQuerySchema,
  registerCustomerSchema,
} from "@/lib/validators/customer";
import {
  listCustomers,
  registerCustomer,
  removeCustomer,
} from "@/services/customer.service";

export const registerCustomerAction = withValidation(
  registerCustomerSchema,
  async (data) => {
    return registerCustomer(data);
  },
);

export const listCustomersAction = withManagerValidation(
  customerListQuerySchema,
  async (query, ctx) => {
    return listCustomers(ctx.restaurantId, query);
  },
);

export const deleteCustomerAction = withManagerValidation(
  z.object({ id: z.string().min(1) }),
  async (data, ctx) => {
    const res = await removeCustomer(ctx.restaurantId, data.id);
    revalidatePath("/dashboard/customers");
    return res;
  },
);
