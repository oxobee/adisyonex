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
  };
  error?: {
    message: string;
    code?: number;
  };
}

const DEFAULT_VISION_MODEL = "google/gemini-2.0-flash-001";
const DEFAULT_TEXT_MODEL = "google/gemini-2.0-flash-001";
const FALLBACK_TEXT_MODEL = "openai/gpt-4o-mini";

export const callOpenRouter = async ({
  messages,
  model = DEFAULT_TEXT_MODEL,
  temperature = 0.3,
  responseFormat,
}: {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  responseFormat?: { type: "json_object" };
}): Promise<{ content: string; tokensUsed: number; model: string }> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ortam değişkeni tanımlanmamış. Lütfen API anahtarınızı ekleyin.");
  }

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
    if (!choice?.message?.content) {
      throw new Error("OpenRouter boş yanıt döndürdü.");
    }

    return {
      content: choice.message.content,
      tokensUsed: data.usage?.total_tokens ?? 0,
      model: activeModel,
    };
  };

  try {
    return await tryModel(model);
  } catch (err) {
    // If primary failed and fallback exists, try fallback
    if (model !== FALLBACK_TEXT_MODEL) {
      console.warn(`[OpenRouter] ${model} başarısız oldu, ${FALLBACK_TEXT_MODEL} deneniyor:`, err);
      return await tryModel(FALLBACK_TEXT_MODEL);
    }
    throw err;
  }
};

export { DEFAULT_VISION_MODEL, DEFAULT_TEXT_MODEL, FALLBACK_TEXT_MODEL };
