import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { CopywriterView } from "@/components/ai/copywriter-view";

export default async function CopywriterPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/login");
  }

  const wallet = await getOrCreateWallet(ctx.restaurantId);

  return <CopywriterView wallet={wallet} />;
}
