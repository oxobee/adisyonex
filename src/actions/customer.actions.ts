"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withManagerValidation, withValidation } from "@/actions/helpers";
import {
  customerListQuerySchema,
  customerDiscountSchema,
  birthdayAutomationSchema,
  customerProfileQuerySchema,
  registerCustomerSchema,
  toggleCustomerDiscountSchema,
} from "@/lib/validators/customer";
import {
  getCustomerDetailForAdmin,
  getCustomerProfile,
  addCustomerDiscount,
  listCustomers,
  registerCustomer,
  removeCustomer,
  toggleCustomerDiscount,
  updateBirthdayAutomation,
} from "@/services/customer.service";
import { logActivity } from "@/services/activity-log.service";

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
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Müşteri Kaydı Silindi",
      details: `Müşteri silindi (ID: ${data.id})`,
    });
    revalidatePath("/dashboard/customers");
    return res;
  },
);

export const addCustomerDiscountAction = withManagerValidation(
  customerDiscountSchema,
  async (data, ctx) => {
    const res = await addCustomerDiscount(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "KASA",
      action: "Müşteriye Sadakat İndirimi Tanımlandı",
      details: `İndirim Türü: ${data.type}, Değer: ${data.value}, Kapsam: ${data.scope}`,
    });
    return res;
  },
);

export const toggleCustomerDiscountAction = withManagerValidation(
  toggleCustomerDiscountSchema,
  async (data, ctx) => toggleCustomerDiscount(ctx.restaurantId, data.customerId, data.discountId, data.isActive),
);

export const updateBirthdayAutomationAction = withManagerValidation(
  birthdayAutomationSchema,
  async (data, ctx) => {
    const res = await updateBirthdayAutomation(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "Doğum Günü Otomasyon Ayarları Güncellendi",
      details: `Otomasyon: ${data.enabled ? 'Aktif' : 'Pasif'}, İndirim: ${data.discountValue} (${data.discountType})`,
    });
    return res;
  },
);
