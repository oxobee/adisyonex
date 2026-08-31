import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { ImageStudioView } from "@/components/ai/image-studio-view";

export default async function ImageStudioPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/login");
  }

  const [wallet, items] = await Promise.all([
    getOrCreateWallet(ctx.restaurantId),
    prisma.menuItem.findMany({
      where: {
        category: { restaurantId: ctx.restaurantId },
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
