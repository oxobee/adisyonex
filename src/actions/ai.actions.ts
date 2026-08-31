"use server";

import { withAdminValidation, withManagerValidation } from "@/actions/helpers";
import {
  aiAdminCreditRechargeSchema,
  aiCommitMenuSchema,
  aiCopywriterInputSchema,
  aiImageGenInputSchema,
  aiMenuDigitizeInputSchema,
  aiMenuUrlInputSchema,
  aiPhotoProfessionalizeSchema,
  aiSettingUpdateSchema,
} from "@/lib/validators/ai";
import {
  adminRecharge,
  getOrCreateWallet,
  listTransactions,
} from "@/services/ai/ai-credit.service";
import {
  fetchOpenRouterLiveCredits,
  getAiSetting,
  getOrInitModelConfigs,
  testOpenRouterKeyConnection,
  updateAiSetting,
} from "@/services/ai/ai-setting.service";
import {
  commitDigitizedMenu,
  digitizeMenu,
  digitizeMenuFromUrl,
  generateFoodImage,
  generateItemCopywriting,
  listAiTasks,
  professionalizeFoodPhoto,
} from "@/services/ai/ai-studio.service";
import { failure, success, type ActionResult } from "@/types";
import type {
  AiCreditTransactionDTO,
  AiCreditWalletDTO,
  AiTaskDTO,
} from "@/types/ai";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getAdminContextOrNull } from "@/lib/admin-auth";

/** Get or create AI credit wallet for the current restaurant */
export const getAiWalletAction = async (): Promise<
  ActionResult<AiCreditWalletDTO>
> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("UNAUTHORIZED");
  }
  try {
    const wallet = await getOrCreateWallet(ctx.restaurantId);
    return success(wallet);
  } catch (err: any) {
    return failure(err.message || "Cüzdan yüklenemedi");
  }
};

/** Get AI credit transaction logs */
export const getAiTransactionsAction = async (): Promise<
  ActionResult<AiCreditTransactionDTO[]>
> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("UNAUTHORIZED");
  }
  try {
    const logs = await listTransactions(ctx.restaurantId);
    return success(logs);
  } catch (err: any) {
    return failure(err.message || "Loglar yüklenemedi");
  }
};

/** Digitize menu from image, multiple images, PDF or raw text */
export const digitizeMenuAction = withManagerValidation(
  aiMenuDigitizeInputSchema,
  (data, ctx) => digitizeMenu(ctx.restaurantId, data),
);

/** Digitize menu from URL */
export const digitizeMenuFromUrlAction = withManagerValidation(
  aiMenuUrlInputSchema,
  (data, ctx) => digitizeMenuFromUrl(ctx.restaurantId, data.url),
);

/** Generate food images with 4 quality tiers (Ekonomik, Standart, Profesyonel, Ultra) */
export const generateFoodImageAction = withManagerValidation(
  aiImageGenInputSchema,
  (data, ctx) => generateFoodImage(ctx.restaurantId, data),
);

/** Professionalize / Enhance amateur food photo (Image-to-Image) */
export const professionalizePhotoAction = withManagerValidation(
  aiPhotoProfessionalizeSchema,
  (data, ctx) => professionalizeFoodPhoto(ctx.restaurantId, data),
);

/** Generate appetizing product descriptions & nutrition */
export const generateItemCopywritingAction = withManagerValidation(
  aiCopywriterInputSchema,
  (data, ctx) => generateItemCopywriting(ctx.restaurantId, data),
);

/** Commit digitized items and categories into actual menu */
export const commitAiMenuAction = withManagerValidation(
  aiCommitMenuSchema,
  (data, ctx) => commitDigitizedMenu(ctx.restaurantId, data.categories, data.items),
);

/** List history of AI tasks */
export const getAiTasksAction = async (): Promise<ActionResult<AiTaskDTO[]>> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("UNAUTHORIZED");
  }
  try {
    const tasks = await listAiTasks(ctx.restaurantId);
    return success(tasks);
  } catch (err: any) {
    return failure(err.message || "Görevler yüklenemedi");
  }
};

/** Super Admin: Get Live OpenRouter Credits and Global AI stats */
export const getSuperAdminAiStatsAction = async (): Promise<
  ActionResult<{
    credits: {
      totalCredits: number;
      totalUsage: number;
      remainingUsd: number;
      isLowBalance: boolean;
    };
    setting: any;
    models: any[];
  }>
> => {
  const admin = await getAdminContextOrNull();
  if (!admin) {
    return failure("UNAUTHORIZED");
  }

  try {
    const [credits, setting, models] = await Promise.all([
      fetchOpenRouterLiveCredits(),
      getAiSetting(),
      getOrInitModelConfigs(),
    ]);

    return success({
      credits,
      setting: {
        id: setting.id,
        openRouterApiKey: setting.openRouterApiKey ? "sk-or-***" + setting.openRouterApiKey.slice(-8) : "",
        defaultVisionModel: setting.defaultVisionModel,
        defaultTextModel: setting.defaultTextModel,
        defaultImageModel: setting.defaultImageModel,
        lowBalanceThresholdUsd: Number(setting.lowBalanceThresholdUsd),
        maxCostPerRequestUsd: Number(setting.maxCostPerRequestUsd),
      },
      models: models.map((m) => ({
        id: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        provider: m.provider,
        taskType: m.taskType,
        qualityLevel: m.qualityLevel,
        creditCost: m.creditCost,
        actualCostEst: Number(m.actualCostEst),
        isEnabled: m.isEnabled,
      })),
    });
  } catch (err: any) {
    return failure(err.message || "İstatistikler alınamadı");
  }
};

/** Super Admin: Test OpenRouter connection */
export const testOpenRouterAction = async (
  customKey?: string,
): Promise<ActionResult<{ valid: boolean; label?: string; error?: string }>> => {
  const admin = await getAdminContextOrNull();
  if (!admin) return failure("UNAUTHORIZED");

  const res = await testOpenRouterKeyConnection(customKey);
  return success(res);
};

/** Super Admin: Update OpenRouter Settings */
export const updateAiSettingAction = withAdminValidation(
  aiSettingUpdateSchema,
  (data) => updateAiSetting(data),
);

/** Super Admin: Recharge restaurant AI credits */
export const adminRechargeAiCreditAction = withAdminValidation(
  aiAdminCreditRechargeSchema,
  (data) => adminRecharge(data.restaurantId, data.amount, data.description),
);
