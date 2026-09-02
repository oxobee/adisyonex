"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withManagerValidation, withValidation } from "@/actions/helpers";
import {
  customerListQuerySchema,
  customerProfileQuerySchema,
  registerCustomerSchema,
} from "@/lib/validators/customer";
import {
  getCustomerDetailForAdmin,
  getCustomerProfile,
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

export const getCustomerProfileAction = withValidation(
  customerProfileQuerySchema,
  async (query) => {
    return getCustomerProfile(query.username, {
      customerId: query.customerId,
      phone: query.phone,
    });
  },
);

export const getAdminCustomerDetailAction = withManagerValidation(
  z.object({ customerId: z.string().min(1) }),
  async (data, ctx) => {
    return getCustomerDetailForAdmin(ctx.restaurantId, data.customerId);
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
