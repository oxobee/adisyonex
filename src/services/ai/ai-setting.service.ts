import { prisma } from "@/lib/prisma";
import type { QualityLevel } from "@/generated/prisma/client";

const getEnvKey = (): string => process.env.OPENROUTER_API_KEY || "";

export const getAiSetting = async () => {
  let setting = await prisma.aiSetting.findUnique({
    where: { id: "global_ai_settings" },
  });

  if (!setting) {
    setting = await prisma.aiSetting.create({
      data: {
        id: "global_ai_settings",
        openRouterApiKey: getEnvKey(),
        defaultVisionModel: "google/gemini-2.5-flash",
        defaultTextModel: "google/gemini-2.5-flash",
        defaultImageModel: "google/gemini-2.5-flash-image",
        lowBalanceThresholdUsd: 5.0,
        maxCostPerRequestUsd: 1.0,
      },
    });
  } else if (!setting.openRouterApiKey && getEnvKey()) {
    setting = await prisma.aiSetting.update({
      where: { id: "global_ai_settings" },
      data: { openRouterApiKey: getEnvKey() },
    });
  }

  return setting;
};

export const getEffectiveOpenRouterKey = async (): Promise<string> => {
  const setting = await getAiSetting();
  return setting.openRouterApiKey || getEnvKey();
};

export const updateAiSetting = async (data: {
  openRouterApiKey?: string;
  defaultVisionModel?: string;
  defaultTextModel?: string;
  defaultImageModel?: string;
  lowBalanceThresholdUsd?: number;
  maxCostPerRequestUsd?: number;
}) => {
  return prisma.aiSetting.upsert({
    where: { id: "global_ai_settings" },
    create: {
      id: "global_ai_settings",
      openRouterApiKey: data.openRouterApiKey || getEnvKey(),
      defaultVisionModel: data.defaultVisionModel ?? "google/gemini-2.5-flash",
      defaultTextModel: data.defaultTextModel ?? "google/gemini-2.5-flash",
      defaultImageModel: data.defaultImageModel ?? "google/gemini-2.5-flash-image",
      lowBalanceThresholdUsd: data.lowBalanceThresholdUsd ?? 5.0,
      maxCostPerRequestUsd: data.maxCostPerRequestUsd ?? 1.0,
    },
    update: {
      ...(data.openRouterApiKey ? { openRouterApiKey: data.openRouterApiKey } : {}),
      ...(data.defaultVisionModel ? { defaultVisionModel: data.defaultVisionModel } : {}),
      ...(data.defaultTextModel ? { defaultTextModel: data.defaultTextModel } : {}),
      ...(data.defaultImageModel ? { defaultImageModel: data.defaultImageModel } : {}),
      ...(data.lowBalanceThresholdUsd ? { lowBalanceThresholdUsd: data.lowBalanceThresholdUsd } : {}),
      ...(data.maxCostPerRequestUsd ? { maxCostPerRequestUsd: data.maxCostPerRequestUsd } : {}),
    },
  });
};

/** Get live OpenRouter balance and credit usage */
export const fetchOpenRouterLiveCredits = async (): Promise<{
  totalCredits: number;
  totalUsage: number;
  remainingUsd: number;
  isLowBalance: boolean;
}> => {
  const key = await getEffectiveOpenRouterKey();
  const setting = await getAiSetting();

  try {
    const res = await fetch("https://openrouter.ai/api/v1/credits", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`OpenRouter credits check failed (${res.status})`);
    }

    const json = await res.json();
    const totalCredits = json.data?.total_credits ?? 0;
    const totalUsage = json.data?.total_usage ?? 0;
    const remainingUsd = Math.max(0, totalCredits - totalUsage);
    const threshold = Number(setting.lowBalanceThresholdUsd) || 5.0;

    return {
      totalCredits,
      totalUsage,
      remainingUsd,
      isLowBalance: remainingUsd < threshold,
    };
  } catch (err: any) {
    return {
      totalCredits: 0,
      totalUsage: 0,
      remainingUsd: 0,
      isLowBalance: true,
    };
  }
};

/** Test API Key Connection */
export const testOpenRouterKeyConnection = async (customKey?: string): Promise<{
  valid: boolean;
  label?: string;
  error?: string;
}> => {
  const key = customKey || (await getEffectiveOpenRouterKey());

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return { valid: false, error: `Bağlantı hatası: ${res.statusText} (${res.status})` };
    }

    const data = await res.json();
    return {
      valid: true,
      label: data.data?.label ?? "Geçerli Anahtar",
    };
  } catch (err: any) {
    return { valid: false, error: err.message || "Bağlantı kurulamadı" };
  }
};

/** Ensure default model configurations */
export const getOrInitModelConfigs = async () => {
  const count = await prisma.aiModelConfig.count();
  if (count === 0) {
    await prisma.aiModelConfig.createMany({
      data: [
        {
          modelId: "google/gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
          provider: "Google",
          taskType: "MENU_DIGITIZATION",
          qualityLevel: "STANDARD",
          creditCost: 25,
          actualCostEst: 0.005,
          isEnabled: true,
          sortOrder: 1,
        },
        {
          modelId: "google/gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash (URL)",
          provider: "Google",
          taskType: "MENU_URL_ANALYSIS",
          qualityLevel: "STANDARD",
          creditCost: 25,
          actualCostEst: 0.005,
          isEnabled: true,
          sortOrder: 2,
        },
        {
          modelId: "google/gemini-2.5-flash-image",
          displayName: "Gemini Flash Image (Ekonomik)",
          provider: "Google",
          taskType: "IMAGE_GENERATION",
          qualityLevel: "ECONOMY",
          creditCost: 10,
          actualCostEst: 0.02,
          isEnabled: true,
          sortOrder: 3,
        },
        {
          modelId: "google/gemini-2.5-flash-image",
          displayName: "Gemini Flash Image (Standart)",
          provider: "Google",
          taskType: "IMAGE_GENERATION",
          qualityLevel: "STANDARD",
          creditCost: 20,
          actualCostEst: 0.03,
          isEnabled: true,
          sortOrder: 4,
        },
        {
          modelId: "google/gemini-3.1-flash-image",
          displayName: "Gemini 3.1 Flash Image (Profesyonel)",
          provider: "Google",
          taskType: "IMAGE_GENERATION",
          qualityLevel: "PROFESSIONAL",
          creditCost: 40,
          actualCostEst: 0.05,
          isEnabled: true,
          sortOrder: 5,
        },
        {
          modelId: "google/gemini-3-pro-image",
          displayName: "Gemini 3 Pro Image (Ultra)",
          provider: "Google",
          taskType: "IMAGE_GENERATION",
          qualityLevel: "ULTRA",
          creditCost: 60,
          actualCostEst: 0.08,
          isEnabled: true,
          sortOrder: 6,
        },
        {
          modelId: "google/gemini-2.5-flash-image",
          displayName: "Food Photo Enhancer (Standart)",
          provider: "Google",
          taskType: "PHOTO_PROFESSIONALIZATION",
          qualityLevel: "STANDARD",
          creditCost: 20,
          actualCostEst: 0.03,
          isEnabled: true,
          sortOrder: 7,
        },
        {
          modelId: "google/gemini-3.1-flash-image",
          displayName: "Food Photo Enhancer (Profesyonel)",
          provider: "Google",
          taskType: "PHOTO_PROFESSIONALIZATION",
          qualityLevel: "PROFESSIONAL",
          creditCost: 40,
          actualCostEst: 0.05,
          isEnabled: true,
          sortOrder: 8,
        },
        {
          modelId: "google/gemini-3-pro-image",
          displayName: "Food Photo Enhancer (Ultra)",
          provider: "Google",
          taskType: "PHOTO_PROFESSIONALIZATION",
          qualityLevel: "ULTRA",
          creditCost: 60,
          actualCostEst: 0.08,
          isEnabled: true,
          sortOrder: 9,
        },
      ],
    });
  }

  return prisma.aiModelConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });
};

export const getModelForTaskAndTier = async (
  taskType: any,
  qualityLevel: QualityLevel = "STANDARD",
): Promise<{ modelId: string; creditCost: number }> => {
  await getOrInitModelConfigs();
  const config = await prisma.aiModelConfig.findFirst({
    where: {
      taskType,
      qualityLevel,
      isEnabled: true,
    },
  });

  if (config) {
    return { modelId: config.modelId, creditCost: config.creditCost };
  }

  // Fallback defaults
  const fallbackDefaults: Record<string, { modelId: string; creditCost: number }> = {
    MENU_DIGITIZATION: { modelId: "google/gemini-2.5-flash", creditCost: 25 },
    MENU_URL_ANALYSIS: { modelId: "google/gemini-2.5-flash", creditCost: 25 },
    IMAGE_GENERATION: { modelId: "google/gemini-2.5-flash-image", creditCost: 20 },
    PHOTO_PROFESSIONALIZATION: { modelId: "google/gemini-2.5-flash-image", creditCost: 40 },
    ITEM_DESCRIPTION: { modelId: "google/gemini-2.5-flash", creditCost: 2 },
    ALLERGEN_CALORIE_EST: { modelId: "google/gemini-2.5-flash", creditCost: 2 },
  };

  return fallbackDefaults[taskType] ?? { modelId: "google/gemini-2.5-flash", creditCost: 20 };
};
