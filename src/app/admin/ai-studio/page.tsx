import { redirect } from "next/navigation";
import { getAdminContextOrNull } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminAiView } from "@/components/admin/admin-ai-view";

export default async function AdminAiStudioPage() {
  const admin = await getAdminContextOrNull();
  if (!admin) {
    redirect("/login");
  }

  const restaurants = await prisma.restaurant.findMany({
    where: { deletedAt: null },
    include: {
      owner: true,
      aiWallet: true,
    },
    orderBy: { name: "asc" },
  });

  const totalTasks = await prisma.aiTask.count();

  const formatted = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    ownerName: r.owner.name,
    ownerPhone: r.owner.phone,
    balance: r.aiWallet?.balance ?? 100,
    totalUsed: r.aiWallet?.totalUsed ?? 0,
  }));

  const stats = {
    totalWallets: formatted.length,
    totalActiveCredits: formatted.reduce((s, r) => s + r.balance, 0),
    totalUsedCredits: formatted.reduce((s, r) => s + r.totalUsed, 0),
    totalTasks,
  };

  return <AdminAiView restaurants={formatted} stats={stats} />;
}
