import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { CopywriterView } from "@/components/ai/copywriter-view";

export default async function CopywriterPage() {
  const ctx = await getManagerContextOrNull();
  const staffCtx = await getStaffContextOrNull();
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;
  if (!restaurantId) {
    redirect("/login");
  }

  const wallet = await getOrCreateWallet(restaurantId);

  return <CopywriterView wallet={wallet} />;
}
