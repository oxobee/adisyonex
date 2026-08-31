import {
  findUsersPaginated,
  findUserById,
  updateUser,
  type AdminUserRow,
} from "@/repositories/user.repository";
import type { UserListQuery } from "@/lib/validators/admin";
import type { Paginated } from "@/types";
import type { AdminUserListItemDTO, AdminUserStatus } from "@/types/admin";

const statusOf = (row: {
  suspendedAt: Date | null;
  deletedAt: Date | null;
}): AdminUserStatus => {
  if (row.deletedAt) {
    return "deleted";
  }
  if (row.suspendedAt) {
    return "suspended";
  }
  return "active";
};

const mapUser = (row: AdminUserRow): AdminUserListItemDTO => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  role: row.role,
  status: statusOf(row),
  restaurantCount: row._count.ownedRestaurants,
  createdAt: row.createdAt.toISOString(),
});

export const listUsers = async (
  query: UserListQuery,
): Promise<Paginated<AdminUserListItemDTO>> => {
  const { items, total } = await findUsersPaginated(query);
  return {
    items: items.map(mapUser),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const updateAdminUser = async (
  input: { id: string; name: string; email?: string | null; role: "MANAGER" | "ADMIN" | "SUPER_ADMIN" },
) => {
  return updateUser(input.id, {
    name: input.name,
    email: input.email?.trim() || null,
    role: input.role,
  });
};

export const toggleSuspendAdminUser = async (id: string) => {
  const user = await findUserById(id);
  if (!user) {
    throw new Error("Kullanıcı bulunamadı");
  }
  const isSuspended = Boolean(user.suspendedAt);
  return updateUser(id, {
    suspendedAt: isSuspended ? null : new Date(),
    isActive: isSuspended,
  });
};

export const deleteAdminUser = async (id: string) => {
  return updateUser(id, {
    deletedAt: new Date(),
    isActive: false,
  });
};

