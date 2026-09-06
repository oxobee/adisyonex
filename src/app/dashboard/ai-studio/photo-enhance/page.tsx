import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { isRestaurantModuleActive } from "@/services/module.service";
import { PhotoEnhanceView } from "@/components/ai/photo-enhance-view";

export default async function PhotoEnhancePage() {
  const ctx = await getManagerContextOrNull();
  const staffCtx = await getStaffContextOrNull();
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;
  if (!restaurantId) {
    redirect("/login");
  }

  const isAllowed = await isRestaurantModuleActive(restaurantId, "ai_photo_enhance");
  if (!isAllowed) {
    redirect("/dashboard/ai-studio");
  }

  const wallet = await getOrCreateWallet(restaurantId);

  return <PhotoEnhanceView wallet={wallet} />;
}
