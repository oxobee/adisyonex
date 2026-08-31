"use server";

import { withAdminValidation, withManagerValidation } from "@/actions/helpers";
import {
  aiAdminCreditRechargeSchema,
  aiCommitMenuSchema,
  aiCopywriterInputSchema,
  aiImageGenInputSchema,
  aiMenuDigitizeInputSchema,
} from "@/lib/validators/ai";
import {
  adminRecharge,
  getOrCreateWallet,
  listTransactions,
} from "@/services/ai/ai-credit.service";
import {
  commitDigitizedMenu,
  digitizeMenu,
  generateFoodImagePrompt,
  generateItemCopywriting,
  listAiTasks,
} from "@/services/ai/ai-studio.service";
import { failure, success, type ActionResult } from "@/types";
import type {
  AiCopywriterResultDTO,
  AiCreditTransactionDTO,
  AiCreditWalletDTO,
  AiDigitizedMenuDTO,
  AiTaskDTO,
} from "@/types/ai";
import { getManagerContextOrNull } from "@/lib/manager-auth";

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

/** Digitize menu from image, PDF or raw text */
export const digitizeMenuAction = withManagerValidation(
  aiMenuDigitizeInputSchema,
  (data, ctx) => digitizeMenu(ctx.restaurantId, data),
);

/** Generate appetizing product descriptions & nutrition */
export const generateItemCopywritingAction = withManagerValidation(
  aiCopywriterInputSchema,
  (data, ctx) => generateItemCopywriting(ctx.restaurantId, data),
);

/** Generate food photography visual prompts */
export const generateFoodImagePromptAction = withManagerValidation(
  aiImageGenInputSchema,
  (data, ctx) => generateFoodImagePrompt(ctx.restaurantId, data),
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

/** Admin action to recharge restaurant AI credits */
export const adminRechargeAiCreditAction = withAdminValidation(
  aiAdminCreditRechargeSchema,
  (data) => adminRecharge(data.restaurantId, data.amount, data.description),
);
