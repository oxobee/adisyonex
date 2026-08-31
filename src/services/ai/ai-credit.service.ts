import { prisma } from "@/lib/prisma";
import type { AiCreditTransactionDTO, AiCreditWalletDTO } from "@/types/ai";

export const INSUFFICIENT_CREDITS = "AI_INSUFFICIENT_CREDITS";

export const getOrCreateWallet = async (
  restaurantId: string,
): Promise<AiCreditWalletDTO> => {
  let wallet = await prisma.aiCreditWallet.findUnique({
    where: { restaurantId },
  });

  if (!wallet) {
    wallet = await prisma.aiCreditWallet.create({
      data: {
        restaurantId,
        balance: 100, // 100 free starter credits
        totalUsed: 0,
      },
    });

    // Record initial grant transaction
    await prisma.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: 100,
        type: "BONUS_GRANT",
        action: "INITIAL_WELCOME_GRANT",
        description: "Hoş Geldiniz Hediye AI Kredisi",
      },
    });
  }

  return {
    id: wallet.id,
    restaurantId: wallet.restaurantId,
    balance: wallet.balance,
    totalUsed: wallet.totalUsed,
  };
};

/** Atomic credit deduction with transaction log */
export const assertAndDeductCredits = async (
  restaurantId: string,
  amount: number,
  action: string,
  referenceId?: string,
  description?: string,
): Promise<{ walletId: string; balance: number }> => {
  const wallet = await getOrCreateWallet(restaurantId);

  if (wallet.balance < amount) {
    throw new Error(
      `Yetersiz AI Kredisi. Bu işlem için ${amount} kredi gerekiyor, mevcut bakiyeniz: ${wallet.balance} kredi.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.aiCreditWallet.update({
      where: { restaurantId },
      data: {
        balance: { decrement: amount },
        totalUsed: { increment: amount },
      },
    });

    await tx.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: "USAGE_DEDUCT",
        action,
        referenceId,
        description: description ?? `${action} için ${amount} kredi harcandı`,
      },
    });

    return { walletId: wallet.id, balance: updated.balance };
  });
};

/** Refund credits in case of AI task failure */
export const refundCredits = async (
  restaurantId: string,
  amount: number,
  action: string,
  referenceId?: string,
  description?: string,
): Promise<void> => {
  const wallet = await getOrCreateWallet(restaurantId);

  await prisma.$transaction(async (tx) => {
    await tx.aiCreditWallet.update({
      where: { restaurantId },
      data: {
        balance: { increment: amount },
        totalUsed: { decrement: amount },
      },
    });

    await tx.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: "REFUND",
        action,
        referenceId,
        description: description ?? `Hata sebebiyle ${amount} kredi iade edildi`,
      },
    });
  });
};

/** Admin manual credit recharge */
export const adminRecharge = async (
  restaurantId: string,
  amount: number,
  description?: string,
): Promise<AiCreditWalletDTO> => {
  const wallet = await getOrCreateWallet(restaurantId);

  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.aiCreditWallet.update({
      where: { restaurantId },
      data: {
        balance: { increment: amount },
      },
    });

    await tx.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: "ADMIN_RECHARGE",
        action: "ADMIN_MANUAL_RECHARGE",
        description: description ?? `Yönetici tarafından ${amount} kredi yüklendi`,
      },
    });

    return w;
  });

  return {
    id: updated.id,
    restaurantId: updated.restaurantId,
    balance: updated.balance,
    totalUsed: updated.totalUsed,
  };
};

export const listTransactions = async (
  restaurantId: string,
  limit = 50,
): Promise<AiCreditTransactionDTO[]> => {
  const wallet = await getOrCreateWallet(restaurantId);

  const items = await prisma.aiCreditTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return items.map((t) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    action: t.action,
    referenceId: t.referenceId,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
  }));
};
