import { redirect } from "next/navigation";
import { getAdminContextOrNull } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminAiView } from "@/components/admin/admin-ai-view";
import {
  fetchOpenRouterLiveCredits,
  getAiSetting,
  getOrInitModelConfigs,
} from "@/services/ai/ai-setting.service";

export default async function AdminAiStudioPage() {
  const admin = await getAdminContextOrNull();
  if (!admin) {
    redirect("/login");
  }

  const [restaurants, totalTasks, usageLogs, credits, setting, models] =
    await Promise.all([
      prisma.restaurant.findMany({
        where: { deletedAt: null },
        include: {
          owner: true,
          aiWallet: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.aiTask.count(),
      prisma.aiUsageLog.findMany(),
      fetchOpenRouterLiveCredits(),
      getAiSetting(),
      getOrInitModelConfigs(),
    ]);

  const formattedRestaurants = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    ownerName: r.owner.name,
    ownerPhone: r.owner.phone,
    balance: r.aiWallet?.balance ?? 100,
    totalUsed: r.aiWallet?.totalUsed ?? 0,
  }));

  const totalProviderCostUsd = usageLogs.reduce(
    (sum, l) => sum + Number(l.actualProviderCost),
    0,
  );

  const stats = {
    totalWallets: formattedRestaurants.length,
    totalActiveCredits: formattedRestaurants.reduce((s, r) => s + r.balance, 0),
    totalUsedCredits: formattedRestaurants.reduce((s, r) => s + r.totalUsed, 0),
    totalTasks,
    totalProviderCostUsd,
  };

  return (
    <AdminAiView
      restaurants={formattedRestaurants}
      stats={stats}
      openRouterCredits={credits}
      settings={{
        openRouterApiKey: setting.openRouterApiKey
          ? "sk-or-***" + setting.openRouterApiKey.slice(-8)
          : "",
        defaultVisionModel: setting.defaultVisionModel,
        defaultTextModel: setting.defaultTextModel,
        defaultImageModel: setting.defaultImageModel,
        lowBalanceThresholdUsd: Number(setting.lowBalanceThresholdUsd),
        maxCostPerRequestUsd: Number(setting.maxCostPerRequestUsd),
      }}
      models={models.map((m) => ({
        id: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        provider: m.provider,
        taskType: m.taskType,
        qualityLevel: m.qualityLevel,
        creditCost: m.creditCost,
        actualCostEst: Number(m.actualCostEst),
        isEnabled: m.isEnabled,
      }))}
    />
  );
}
