import { prisma } from "@/lib/prisma";
import { getEffectiveOpenRouterKey } from "./ai-setting.service";
import type { AiTaskType, QualityLevel } from "@/generated/prisma/client";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
  };
  error?: {
    message: string;
    code?: number;
  };
}

export const callOpenRouter = async ({
  messages,
  model = "google/gemini-2.5-flash",
  temperature = 0.2,
  responseFormat,
  restaurantId,
  operationType = "MENU_DIGITIZATION",
  qualityLevel = "STANDARD",
  chargedCredits = 0,
}: {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  responseFormat?: { type: "json_object" };
  restaurantId?: string;
  operationType?: AiTaskType;
  qualityLevel?: QualityLevel;
  chargedCredits?: number;
}): Promise<{
  content: string;
  images?: string[];
  tokensUsed: number;
  model: string;
  actualCostUsd: number;
}> => {
  const apiKey = await getEffectiveOpenRouterKey();
  const startTime = Date.now();
  const endpoint = "https://openrouter.ai/api/v1/chat/completions";

  const tryModel = async (activeModel: string) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://adisyonex.vercel.app",
        "X-Title": "Adisyonex AI Studio",
      },
      body: JSON.stringify({
        model: activeModel,
        messages,
        temperature,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`OpenRouter API hatası (${res.status}): ${errBody || res.statusText}`);
    }

    const data = (await res.json()) as OpenRouterResponse;
    if (data.error) {
      throw new Error(`OpenRouter hata mesajı: ${data.error.message}`);
    }

    const choice = data.choices?.[0];
    let content = choice?.message?.content || "";

    // Check if images are returned in choice.message.images (OpenRouter image format)
    const images: string[] = [];
    const rawImages = (choice?.message as any)?.images;
    if (Array.isArray(rawImages)) {
      for (const img of rawImages) {
        const url = img?.image_url?.url || img?.url || (typeof img === "string" ? img : null);
        if (url) images.push(url);
      }
    }

    if (images.length > 0 && !content.startsWith("data:image/") && !content.startsWith("http")) {
      content = images[0];
    }

    if (!content && images.length === 0) {
      throw new Error("OpenRouter boş yanıt döndürdü.");
    }

    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    const totalTokens = data.usage?.total_tokens ?? 0;
    const actualCostUsd = data.usage?.cost ?? 0.0001;
    const durationMs = Date.now() - startTime;

    // Log real usage and cost if restaurantId is provided
    if (restaurantId) {
      await prisma.aiUsageLog
        .create({
          data: {
            restaurantId,
            operationType,
            qualityLevel,
            model: activeModel,
            promptTokens,
            completionTokens,
            totalTokens,
            actualProviderCost: actualCostUsd,
            chargedCredits,
            durationMs,
            status: "COMPLETED",
          },
        })
        .catch((e) => console.error("Failed to write AiUsageLog:", e));
    }

    return {
      content,
      images,
      tokensUsed: totalTokens,
      model: activeModel,
      actualCostUsd,
    };
  };

  try {
    return await tryModel(model);
  } catch (err: any) {
    if (restaurantId) {
      await prisma.aiUsageLog
        .create({
          data: {
            restaurantId,
            operationType,
            qualityLevel,
            model,
            durationMs: Date.now() - startTime,
            status: "FAILED",
            errorMessage: err.message,
            chargedCredits: 0,
          },
        })
        .catch(() => {});
    }
    throw err;
  }
};
