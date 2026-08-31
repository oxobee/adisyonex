import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getOrCreateWallet } from "@/services/ai/ai-credit.service";
import { ImageStudioView } from "@/components/ai/image-studio-view";

export default async function ImageStudioPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/login");
  }

  const wallet = await getOrCreateWallet(ctx.restaurantId);

  return <ImageStudioView wallet={wallet} />;
}
