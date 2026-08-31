import { notFound } from "next/navigation";
import { StaffLoginForm } from "@/components/staff-login/staff-login-form";
import { prisma } from "@/lib/prisma";
import { listLoginStaff } from "@/services/staff-auth.service";

export const dynamic = "force-dynamic";

export default async function PersonelGirisPage() {
  const restaurant = await prisma.restaurant.findFirst({
    where: { deletedAt: null, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!restaurant || !restaurant.username) {
    notFound();
  }

  const staff = await listLoginStaff(restaurant.id);

  return (
    <main className="flex min-h-svh items-center justify-center p-4 bg-muted/20">
      <StaffLoginForm
        username={restaurant.username}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logoUrl}
        staff={staff}
      />
    </main>
  );
}
