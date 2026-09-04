import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { ImageStudioView } from "@/components/ai/image-studio-view";

export default async function ImageStudioPage() {
  const ctx = await getManagerContextOrNull();
  const staffCtx = await getStaffContextOrNull();
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;
  if (!restaurantId) {
    redirect("/login");
  }

  const [wallet, items] = await Promise.all([
    getOrCreateWallet(restaurantId),
    prisma.menuItem.findMany({
      where: {
        category: { restaurantId },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        longDescription: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ImageStudioView wallet={wallet} menuItems={items} />;
}
