import type {
  EmploymentType,
  Gender,
  StaffRole,
  StaffStatus,
} from "@/types/staff";

export const STAFF_ROLE_OPTIONS: readonly { value: StaffRole; label: string }[] = [
  { value: "WAITER", label: "Garson" },
  { value: "KITCHEN", label: "Mutfak / Aşçı" },
  { value: "CASHIER", label: "Kasa" },
  { value: "MANAGEMENT", label: "Yönetici" },
  { value: "OTHER", label: "Diğer" },
];

export const STAFF_STATUS_OPTIONS: readonly {
  value: StaffStatus;
  label: string;
}[] = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "ON_LEAVE", label: "İzinde" },
  { value: "INACTIVE", label: "Pasif" },
];

export const EMPLOYMENT_TYPE_OPTIONS: readonly {
  value: EmploymentType;
  label: string;
}[] = [
  { value: "FULL_TIME", label: "Tam Zamanlı" },
  { value: "PART_TIME", label: "Yarı Zamanlı" },
  { value: "CONTRACT", label: "Sözleşmeli" },
];

export const GENDER_OPTIONS: readonly { value: Gender; label: string }[] = [
  { value: "MALE", label: "Erkek" },
  { value: "FEMALE", label: "Kadın" },
  { value: "OTHER", label: "Diğer" },
];

export const staffRoleLabel = (role: StaffRole): string =>
  STAFF_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;

export const staffStatusLabel = (status: StaffStatus): string =>
  STAFF_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;

export const getStaffDefaultRoutes = (role: StaffRole): readonly string[] => {
  switch (role) {
    case "KITCHEN":
      return ["/dashboard/kitchen"];
    case "WAITER":
      return ["/dashboard/orders"];
    case "CASHIER":
      return ["/dashboard/pos", "/dashboard/orders"];
    case "MANAGEMENT":
      return [
        "/dashboard",
        "/dashboard/orders",
        "/dashboard/kitchen",
        "/dashboard/pos",
        "/dashboard/menu",
        "/dashboard/menu-design",
        "/dashboard/tables",
        "/dashboard/staff",
        "/dashboard/inventory",
        "/dashboard/customers",
        "/dashboard/settings",
      ];
    case "OTHER":
    default:
      return ["/dashboard/orders"];
  }
};

export const getStaffEffectiveRoutes = (
  role: StaffRole,
  allowedRoutes?: readonly string[] | null,
): readonly string[] => {
  if (allowedRoutes && allowedRoutes.length > 0) {
    return allowedRoutes;
  }
  return getStaffDefaultRoutes(role);
};
