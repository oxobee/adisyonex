import {
  deleteCustomer,
  findCustomersPaginated,
  upsertCustomer,
} from "@/repositories/customer.repository";
import { findRestaurantByUsername } from "@/repositories/restaurant.repository";
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
  createdAt: string;
}

export const registerCustomer = async (
  input: RegisterCustomerInput,
): Promise<{ success: boolean; name: string }> => {
  const restaurant = await findRestaurantByUsername(input.username);
  if (!restaurant || restaurant.deletedAt) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  const birthDateObj = input.birthDate ? new Date(input.birthDate) : null;

  await upsertCustomer({
    restaurantId: restaurant.id,
    name: input.name,
    phone: input.phone,
    birthDate: birthDateObj,
    source: "QR_MENU",
  });

  return { success: true, name: input.name };
};

export const listCustomers = async (
  restaurantId: string,
  query: CustomerListQuery,
): Promise<Paginated<CustomerDTO>> => {
  const { items, total } = await findCustomersPaginated(restaurantId, query);
  return {
    items: items.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      birthDate: c.birthDate ? c.birthDate.toISOString() : null,
      birthDay: c.birthDay,
      birthMonth: c.birthMonth,
      birthYear: c.birthYear,
      orderCount: c.orderCount,
      totalSpent: Number(c.totalSpent),
      source: c.source,
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
