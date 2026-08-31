import type {
  AiTaskStatus,
  AiTaskType,
  AiTransactionType,
  DietaryType,
} from "@/generated/prisma/client";

export type { AiTaskStatus, AiTaskType, AiTransactionType };

export interface AiCreditWalletDTO {
  readonly id: string;
  readonly restaurantId: string;
  readonly balance: number;
  readonly totalUsed: number;
}

export interface AiCreditTransactionDTO {
  readonly id: string;
  readonly amount: number;
  readonly type: AiTransactionType;
  readonly action: string;
  readonly referenceId: string | null;
  readonly description: string | null;
  readonly createdAt: string;
}

export interface AiTaskDTO {
  readonly id: string;
  readonly restaurantId: string;
  readonly type: AiTaskType;
  readonly status: AiTaskStatus;
  readonly modelUsed: string | null;
  readonly tokensUsed: number | null;
  readonly creditsSpent: number;
  readonly inputPayload: Record<string, unknown>;
  readonly resultPayload: Record<string, unknown> | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
}

export interface AiDigitizedItemDTO {
  name: string;
  price: number;
  shortDescription?: string;
  categoryName: string;
  dietaryType?: DietaryType | null;
  prepTimeMinutes?: number;
  calories?: number;
  allergens?: string[];
  variants?: { name: string; price: number }[];
  selected?: boolean;
}

export interface AiDigitizedCategoryDTO {
  name: string;
  description?: string;
  items: AiDigitizedItemDTO[];
}

export interface AiDigitizedMenuDTO {
  restaurantName?: string;
  categories: AiDigitizedCategoryDTO[];
}

export interface AiCopywriterResultDTO {
  name: string;
  shortDescription: string;
  longDescription?: string;
  suggestedCalories?: number;
  suggestedAllergens?: string[];
  marketingTags?: string[];
  suggestedPrice?: number;
}
