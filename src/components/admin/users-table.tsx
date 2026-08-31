"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types";
import type { AdminUserListItemDTO } from "@/types/admin";

const ROLE_LABEL: Record<AdminUserListItemDTO["role"], string> = {
  MANAGER: "İşletmeci / Müdür",
  ADMIN: "Yönetici",
  SUPER_ADMIN: "Süper Yönetici",
};

const STATUS_CLASS: Record<AdminUserListItemDTO["status"], string> = {
  active: "bg-primary/10 text-primary",
  suspended: "bg-destructive/10 text-destructive",
  deleted: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<AdminUserListItemDTO["status"], string> = {
  active: "Aktif",
  suspended: "Askıya Alındı",
  deleted: "Silindi",
};

export function UsersTable({
  data,
}: {
  readonly data: Paginated<AdminUserListItemDTO>;
}) {
  if (data.items.length === 0) {
    return (
      <EmptyState
        title="Henüz kullanıcı bulunmuyor"
        description="İlk yönetici hesabını oluşturmak için bir restoran kaydedin."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Ad Soyad</th>
            <th className="px-4 py-2.5 text-left font-medium">Telefon</th>
            <th className="px-4 py-2.5 text-left font-medium">Rol</th>
            <th className="px-4 py-2.5 text-left font-medium">Durum</th>
            <th className="px-4 py-2.5 text-right font-medium">Restoran Sayısı</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.items.map((user) => (
            <tr key={user.id} className="[&>td]:px-4 [&>td]:py-3">
              <td className="font-medium">{user.name ?? "—"}</td>
              <td className="text-muted-foreground">{user.phone}</td>
              <td>{ROLE_LABEL[user.role]}</td>
              <td>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_CLASS[user.status],
                  )}
                >
                  {STATUS_LABEL[user.status] ?? user.status}
                </span>
              </td>
              <td className="text-right tabular-nums">{user.restaurantCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-muted-foreground border-t px-4 py-2 text-xs">
        {data.total} kullanıcı
      </div>
    </div>
  );
}
