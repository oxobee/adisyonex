import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { PhotoEnhanceView } from "@/components/ai/photo-enhance-view";

export default async function PhotoEnhancePage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/login");
  }

  const wallet = await getOrCreateWallet(ctx.restaurantId);

  return <PhotoEnhanceView wallet={wallet} />;
}
