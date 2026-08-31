import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { MenuImportView } from "@/components/ai/menu-import-view";

export default async function MenuImportPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/login");
  }

  const wallet = await getOrCreateWallet(ctx.restaurantId);

  return <MenuImportView wallet={wallet} />;
}
