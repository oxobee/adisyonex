import {
  deleteCustomer,
  findCustomersPaginated,
  findCustomerWithOrders,
  createCustomerDiscount,
  findCustomerDiscounts,
  getSettledCustomerStats,
  setCustomerDiscountActive,
  upsertCustomer,
} from "@/repositories/customer.repository";
import { findRestaurantByUsername } from "@/repositories/restaurant.repository";
import { findRestaurantById, updateRestaurant } from "@/repositories/restaurant.repository";
import { simulateBirthdayMessages } from "@/repositories/customer.repository";
import type { CustomerListQuery, RegisterCustomerInput } from "@/lib/validators/customer";
import type { Paginated } from "@/types";

export interface CustomerDTO {
  id: string;
  name: string;
  phone: string;
  birthDate: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  birthYear: number | null;
  orderCount: number;
  totalSpent: number;
  source: string | null;
  kvkkConsent: boolean;
  kvkkAcceptedAt: string | null;
  createdAt: string;
}

export interface CustomerDiscountDTO {
  id: string;
  scope: "EVERY_ORDER" | "DATE_RANGE";
  type: "PERCENT" | "FLAT";
  value: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export interface BirthdayAutomationDTO {
  enabled: boolean;
  daysBefore: number;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  messageTitle: string;
  messageContent: string;
}

export interface CustomerOrderLineDTO {
  id: string;
  name: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  state: string;
}

export interface CustomerOrderDTO {
  id: string;
  orderNumber: number;
  tableLabel: string | null;
  status: string;
  orderType: string;
  grandTotal: number;
  createdAt: string;
  lines: CustomerOrderLineDTO[];
}

export interface CustomerFavoriteItem {
  name: string;
  count: number;
  totalSpent: number;
}

export interface CustomerProfileDTO {
  customer: CustomerDTO;
  stats: {
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
  };
  favoriteItems: CustomerFavoriteItem[];
  orders: CustomerOrderDTO[];
  discounts: CustomerDiscountDTO[];
}

const mapDiscount = (discount: Awaited<ReturnType<typeof findCustomerDiscounts>>[number]): CustomerDiscountDTO => ({
  id: discount.id,
  scope: discount.scope,
  type: discount.type === "FLAT" ? "FLAT" : "PERCENT",
  value: Number(discount.value),
  startsAt: discount.startsAt?.toISOString() ?? null,
  endsAt: discount.endsAt?.toISOString() ?? null,
  isActive: discount.isActive,
});

export const registerCustomer = async (
  input: RegisterCustomerInput,
): Promise<CustomerDTO> => {
  const restaurant = await findRestaurantByUsername(input.username);
  if (!restaurant || restaurant.deletedAt) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  let birthDateObj: Date | null = null;
  if (input.birthDate && input.birthDate.trim()) {
    const d = new Date(input.birthDate);
    if (!isNaN(d.getTime())) {
      birthDateObj = d;
    }
  }

  const saved = await upsertCustomer({
    restaurantId: restaurant.id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    birthDate: birthDateObj,
    source: "QR_MENU",
    kvkkConsent: input.kvkkConsent,
  });

  const customerDto: CustomerDTO = {
    id: saved.id,
    name: saved.name,
    phone: saved.phone,
    birthDate: saved.birthDate ? saved.birthDate.toISOString() : null,
    birthDay: saved.birthDay,
    birthMonth: saved.birthMonth,
    birthYear: saved.birthYear,
    orderCount: saved.orderCount,
    totalSpent: Number(saved.totalSpent),
    source: saved.source,
    kvkkConsent: saved.kvkkConsent,
    kvkkAcceptedAt: saved.kvkkAcceptedAt ? saved.kvkkAcceptedAt.toISOString() : null,
    createdAt: saved.createdAt.toISOString(),
  };

  return customerDto;
};

export const getCustomerProfile = async (
  username: string,
  identifier: { customerId?: string; phone?: string },
): Promise<CustomerProfileDTO | null> => {
  const restaurant = await findRestaurantByUsername(username);
  if (!restaurant || restaurant.deletedAt) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  const raw = await findCustomerWithOrders(restaurant.id, {
    id: identifier.customerId,
    phone: identifier.phone,
  });

  if (!raw) return null;

  // Aggregate favorite items
  const itemMap = new Map<string, { count: number; total: number }>();
  for (const ord of raw.orders) {
    for (const line of ord.items) {
      const key = line.name.trim();
      const current = itemMap.get(key) ?? { count: 0, total: 0 };
      itemMap.set(key, {
        count: current.count + line.quantity,
        total: current.total + Number(line.unitPrice) * line.quantity,
      });
    }
  }

  const favoriteItems: CustomerFavoriteItem[] = Array.from(itemMap.entries())
    .map(([name, stat]) => ({
      name,
      count: stat.count,
      totalSpent: stat.total,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const orderDtos: CustomerOrderDTO[] = raw.orders.map((ord) => ({
    id: ord.id,
    orderNumber: ord.orderNumber,
    tableLabel: ord.tableLabel || ord.table?.label || null,
    status: ord.status,
    orderType: ord.orderType,
    grandTotal: Number(ord.grandTotal),
    createdAt: ord.createdAt.toISOString(),
    lines: ord.items.map((it) => ({
      id: it.id,
      name: it.name,
      variantName: it.variantName,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      state: it.state,
    })),
  }));

  const ordersTotal = raw.orders
    .filter((o) => o.status !== "VOID")
    .reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
  const totalSpent = Math.max(Number(raw.totalSpent || 0), ordersTotal);
  const orderCount = orderDtos.length;
  const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

  return {
    customer: {
      id: raw.id,
      name: raw.name,
      phone: raw.phone,
      birthDate: raw.birthDate ? raw.birthDate.toISOString() : null,
      birthDay: raw.birthDay,
      birthMonth: raw.birthMonth,
      birthYear: raw.birthYear,
      orderCount,
      totalSpent,
      source: raw.source,
      kvkkConsent: raw.kvkkConsent,
      kvkkAcceptedAt: raw.kvkkAcceptedAt ? raw.kvkkAcceptedAt.toISOString() : null,
      createdAt: raw.createdAt.toISOString(),
    },
    stats: {
      orderCount,
      totalSpent,
      averageOrderValue,
      firstOrderDate: orderDtos.length > 0 ? orderDtos[orderDtos.length - 1].createdAt : null,
      lastOrderDate: orderDtos.length > 0 ? orderDtos[0].createdAt : null,
    },
    favoriteItems,
    orders: orderDtos,
    discounts: (await findCustomerDiscounts(raw.id)).map(mapDiscount),
  };
};

export const getCustomerDetailForAdmin = async (
  restaurantId: string,
  customerId: string,
): Promise<CustomerProfileDTO | null> => {
  const raw = await findCustomerWithOrders(restaurantId, {
    id: customerId,
  });

  if (!raw) return null;

  const itemMap = new Map<string, { count: number; total: number }>();
  for (const ord of raw.orders) {
    for (const line of ord.items) {
      const key = line.name.trim();
      const current = itemMap.get(key) ?? { count: 0, total: 0 };
      itemMap.set(key, {
        count: current.count + line.quantity,
        total: current.total + Number(line.unitPrice) * line.quantity,
      });
    }
  }

  const favoriteItems: CustomerFavoriteItem[] = Array.from(itemMap.entries())
    .map(([name, stat]) => ({
      name,
      count: stat.count,
      totalSpent: stat.total,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const orderDtos: CustomerOrderDTO[] = raw.orders.map((ord) => ({
    id: ord.id,
    orderNumber: ord.orderNumber,
    tableLabel: ord.tableLabel || ord.table?.label || null,
    status: ord.status,
    orderType: ord.orderType,
    grandTotal: Number(ord.grandTotal),
    createdAt: ord.createdAt.toISOString(),
    lines: ord.items.map((it) => ({
      id: it.id,
      name: it.name,
      variantName: it.variantName,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      state: it.state,
    })),
  }));

  const totalSpent = raw.orders.reduce((sum, order) => sum + Number(order.grandTotal), 0);
  const orderCount = orderDtos.length;
  const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

  return {
    customer: {
      id: raw.id,
      name: raw.name,
      phone: raw.phone,
      birthDate: raw.birthDate ? raw.birthDate.toISOString() : null,
      birthDay: raw.birthDay,
      birthMonth: raw.birthMonth,
      birthYear: raw.birthYear,
      orderCount,
      totalSpent,
      source: raw.source,
      kvkkConsent: raw.kvkkConsent,
      kvkkAcceptedAt: raw.kvkkAcceptedAt ? raw.kvkkAcceptedAt.toISOString() : null,
      createdAt: raw.createdAt.toISOString(),
    },
    stats: {
      orderCount,
      totalSpent,
      averageOrderValue,
      firstOrderDate: orderDtos.length > 0 ? orderDtos[orderDtos.length - 1].createdAt : null,
      lastOrderDate: orderDtos.length > 0 ? orderDtos[0].createdAt : null,
    },
    favoriteItems,
    orders: orderDtos,
    discounts: (await findCustomerDiscounts(raw.id)).map(mapDiscount),
  };
};

export const addCustomerDiscount = async (
  restaurantId: string,
  input: {
    customerId: string;
    scope: "EVERY_ORDER" | "DATE_RANGE";
    type: "PERCENT" | "FLAT";
    value: number;
    startsAt?: string | null;
    endsAt?: string | null;
  },
): Promise<CustomerDiscountDTO> => {
  const customer = await findCustomerWithOrders(restaurantId, { id: input.customerId });
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
  const discount = await createCustomerDiscount({
    customerId: customer.id,
    scope: input.scope,
    type: input.type,
    value: input.value,
    startsAt: input.scope === "DATE_RANGE" && input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.scope === "DATE_RANGE" && input.endsAt ? new Date(input.endsAt) : null,
  });
  return mapDiscount(discount);
};

export const toggleCustomerDiscount = async (
  restaurantId: string,
  customerId: string,
  discountId: string,
  isActive: boolean,
): Promise<void> => {
  const customer = await findCustomerWithOrders(restaurantId, { id: customerId });
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
  await setCustomerDiscountActive(customerId, discountId, isActive);
};

export const getBirthdayAutomation = async (restaurantId: string): Promise<BirthdayAutomationDTO> => {
  const restaurant = await findRestaurantById(restaurantId);
  if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");
  return {
    enabled: restaurant.birthdayAutomationEnabled,
    daysBefore: restaurant.birthdayDaysBefore,
    discountType: restaurant.birthdayDiscountType === "FLAT" ? "FLAT" : "PERCENT",
    discountValue: Number(restaurant.birthdayDiscountValue),
    messageTitle: restaurant.birthdayMessageTitle,
    messageContent: restaurant.birthdayMessageContent,
  };
};

export const updateBirthdayAutomation = async (restaurantId: string, input: BirthdayAutomationDTO): Promise<void> => {
  await updateRestaurant(restaurantId, {
    birthdayAutomationEnabled: input.enabled,
    birthdayDaysBefore: input.daysBefore,
    birthdayDiscountType: input.discountType,
    birthdayDiscountValue: input.discountValue,
    birthdayMessageTitle: input.messageTitle.trim(),
    birthdayMessageContent: input.messageContent.trim(),
  });
  if (input.enabled) {
    await simulateBirthdayMessages(restaurantId, new Date(), input.daysBefore, input.messageTitle.trim(), input.messageContent.trim());
  }
};

export const listCustomers = async (
  restaurantId: string,
  query: CustomerListQuery,
): Promise<Paginated<CustomerDTO>> => {
  const { items, total } = await findCustomersPaginated(restaurantId, query);
  const stats = await getSettledCustomerStats(restaurantId, items.map((customer) => customer.id));
  return {
    items: items.map((c) => ({
      ...(() => { const stat = stats.get(c.id); return { orderCount: stat?.orderCount ?? 0, totalSpent: stat?.totalSpent ?? 0 }; })(),
      id: c.id,
      name: c.name,
      phone: c.phone,
      birthDate: c.birthDate ? c.birthDate.toISOString() : null,
      birthDay: c.birthDay,
      birthMonth: c.birthMonth,
      birthYear: c.birthYear,
      source: c.source,
      kvkkConsent: c.kvkkConsent,
      kvkkAcceptedAt: c.kvkkAcceptedAt ? c.kvkkAcceptedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const removeCustomer = async (restaurantId: string, id: string) => {
  return deleteCustomer(restaurantId, id);
};
