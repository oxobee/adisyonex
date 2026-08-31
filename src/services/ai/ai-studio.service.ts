import { prisma } from "@/lib/prisma";
import type {
  AiCopywriterInput,
  AiImageGenInput,
  AiMenuDigitizeInput,
} from "@/lib/validators/ai";
import {
  createMenuCategory,
  findCategoriesByRestaurant,
} from "@/repositories/menu-category.repository";
import { createItem } from "@/services/menu-item.service";
import type {
  AiCopywriterResultDTO,
  AiDigitizedMenuDTO,
  AiTaskDTO,
} from "@/types/ai";
import {
  assertAndDeductCredits,
  refundCredits,
} from "./ai-credit.service";
import {
  callOpenRouter,
  DEFAULT_TEXT_MODEL,
  DEFAULT_VISION_MODEL,
} from "./openrouter.service";

const CREDIT_COSTS = {
  MENU_DIGITIZE: 10,
  COPYWRITER: 2,
  IMAGE_GEN: 15,
};

/** Digitize a physical menu (Image, PDF, or Raw Text) into structured Menu DTO */
export const digitizeMenu = async (
  restaurantId: string,
  input: AiMenuDigitizeInput,
): Promise<{ task: AiTaskDTO; menu: AiDigitizedMenuDTO }> => {
  const cost = CREDIT_COSTS.MENU_DIGITIZE;

  // 1. Create PENDING task record
  const task = await prisma.aiTask.create({
    data: {
      restaurantId,
      type: "MENU_DIGITIZATION",
      status: "PROCESSING",
      creditsSpent: cost,
      inputPayload: input as any,
    },
  });

  // 2. Deduct credits
  await assertAndDeductCredits(
    restaurantId,
    cost,
    "MENU_DIGITIZATION",
    task.id,
    "Menü Fotoğrafı / Belgesi Dijitalleştirme",
  );

  try {
    const systemPrompt = `Sen profesyonel bir restoran menü dijitalleştirme ve OCR uzmanısın.
Sana verilen menü görselini/metnini analiz et ve TÜRKÇE formatta eksiksiz bir JSON döndür.
Yanıtın SADECE geçerli bir JSON nesnesi olmalı:
{
  "restaurantName": "Opsiyonel restoran adı",
  "categories": [
    {
      "name": "Kategori Adı (Örn: Burgerler, Başlangıçlar, İçecekler)",
      "description": "Kategori açıklaması (varsa)",
      "items": [
        {
          "name": "Ürün Adı",
          "price": 250,
          "shortDescription": "İçerik açıklaması",
          "categoryName": "Ait olduğu kategori adı",
          "dietaryType": "VEG" | "NON_VEG" | "EGG" | null,
          "prepTimeMinutes": 15,
          "calories": 450,
          "allergens": ["Gluten", "Süt/Laktoz"],
          "variants": [
            { "name": "Tek Köfte", "price": 250 },
            { "name": "Çift Köfte", "price": 340 }
          ]
        }
      ]
    }
  ]
}
Fiyatları sadece sayı (number) olarak ver. Para birimi sembolü koyma. Fiyat bulunamazsa 0 ver.`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (input.fileUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Bu menü görselindeki tüm kategorileri, ürünleri, fiyatları, açıklamaları ve varyantları eksiksiz çıkart.",
          },
          {
            type: "image_url",
            image_url: { url: input.fileUrl },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Lütfen aşağıdaki menü metnini JSON menü yapısına dönüştür:\n\n${input.rawText ?? ""}`,
      });
    }

    const aiRes = await callOpenRouter({
      messages,
      model: input.fileUrl ? DEFAULT_VISION_MODEL : DEFAULT_TEXT_MODEL,
      responseFormat: { type: "json_object" },
    });

    let parsed: AiDigitizedMenuDTO;
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      const match = aiRes.content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("AI çıktısı JSON formatında çözümlenemedi.");
      }
    }

    // 3. Mark task completed
    const updatedTask = await prisma.aiTask.update({
      where: { id: task.id },
      data: {
        status: "COMPLETED",
        modelUsed: aiRes.model,
        tokensUsed: aiRes.tokensUsed,
        resultPayload: parsed as any,
      },
    });

    return {
      task: {
        id: updatedTask.id,
        restaurantId: updatedTask.restaurantId,
        type: updatedTask.type,
        status: updatedTask.status,
        modelUsed: updatedTask.modelUsed,
        tokensUsed: updatedTask.tokensUsed,
        creditsSpent: updatedTask.creditsSpent,
        inputPayload: updatedTask.inputPayload as any,
        resultPayload: updatedTask.resultPayload as any,
        errorMessage: updatedTask.errorMessage,
        createdAt: updatedTask.createdAt.toISOString(),
      },
      menu: parsed,
    };
  } catch (err: any) {
    // Refund on failure
    await refundCredits(
      restaurantId,
      cost,
      "MENU_DIGITIZATION_FAILED",
      task.id,
      "Hata sebebiyle menü dijitalleştirme kredisi iade edildi",
    );

    await prisma.aiTask.update({
      where: { id: task.id },
      data: {
        status: "FAILED",
        errorMessage: err.message || "Menü işlenirken bir hata oluştu",
      },
    });

    throw err;
  }
};

/** Generate Appetizing Copywriting & Nutritional Estimates */
export const generateItemCopywriting = async (
  restaurantId: string,
  input: AiCopywriterInput,
): Promise<AiCopywriterResultDTO> => {
  const cost = CREDIT_COSTS.COPYWRITER;

  await assertAndDeductCredits(
    restaurantId,
    cost,
    "COPYWRITER",
    undefined,
    `"${input.itemName}" için AI metin yazarlığı`,
  );

  try {
    const systemPrompt = `Sen gastronomi ve menü pazarlaması konusunda uzman bir AI metin yazarısın.
Sana verilen ürün adı ve detaylarına göre iştah açıcı, satış artıran açıklamalar ve tahmini besin değerleri üret.
Yanıtın SADECE aşağıdaki JSON formatında olmalı:
{
  "name": "Ürün Adı",
  "shortDescription": "Menü kartları için 1-2 cümlelik vurucu, lezzet dolu açıklama",
  "longDescription": "Ürün detay modalı için lezzet hikayesini ve pişirme tekniğini anlatan zengin açıklama",
  "suggestedCalories": 550,
  "suggestedAllergens": ["Gluten", "Süt/Laktoz"],
  "marketingTags": ["Şefin Önerisi", "En Çok Satan", "Gurme Lezzet"]
}`;

    const userPrompt = `Ürün: ${input.itemName}
Kategori: ${input.categoryName ?? "Genel"}
Malzemeler: ${input.ingredients ?? "Standart şef tarifi"}
Ton: ${input.tone}`;

    const aiRes = await callOpenRouter({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: DEFAULT_TEXT_MODEL,
      responseFormat: { type: "json_object" },
    });

    const parsed: AiCopywriterResultDTO = JSON.parse(aiRes.content);
    return parsed;
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      cost,
      "COPYWRITER_FAILED",
      undefined,
      "Hata sebebiyle metin yazarlığı kredisi iade edildi",
    );
    throw err;
  }
};

/** Generate Food Image Prompts & Visual Assets */
export const generateFoodImagePrompt = async (
  restaurantId: string,
  input: AiImageGenInput,
): Promise<{ prompt: string; style: string; negativePrompt: string }> => {
  const cost = 1; // 1 credit for prompt craft

  await assertAndDeductCredits(
    restaurantId,
    cost,
    "IMAGE_PROMPT_CRAFT",
    undefined,
    `"${input.itemName}" için görsel stüdyo promptu`,
  );

  const styleGuides: Record<string, string> = {
    STUDIO_FOOD: "Professional commercial food photography, clean studio softbox lighting, 8k resolution, macro food shot, shallow depth of field, award-winning culinary magazine shot, extremely appetizing",
    RUSTIC: "Rustic wooden table, warm natural sunlight, artisanal craft presentation, authentic restaurant vibe, depth and rich textures",
    MODERN_MINIMAL: "Minimalist slate plating, sleek modern fine dining presentation, sharp highlights, high-end Michelin star aesthetics",
    FAST_FOOD_VIBRANT: "Hyper-vibrant colors, mouthwatering dynamic sizzle, juicy texture, bold punchy advertising shot, appetizing drip",
    DARK_GOURMET: "Moody dark food photography, dramatic chiaroscuro side lighting, rich shadows, luxurious culinary presentation",
  };

  const styleGuide = styleGuides[input.style] ?? styleGuides.STUDIO_FOOD;
  const prompt = `${input.itemName}, ${input.itemDescription ?? "delicious fresh culinary dish"}, ${styleGuide}, photorealistic, ultra-detailed, 8k uhd`;
  const negativePrompt = "blurry, low quality, distorted, plastic look, fake, watermark, text, signature";

  return { prompt, style: input.style, negativePrompt };
};

/** Commit digitized items into actual MenuCategory and MenuItem tables */
export const commitDigitizedMenu = async (
  restaurantId: string,
  categories: string[],
  items: Array<{
    name: string;
    categoryName: string;
    price: number;
    shortDescription?: string;
    calories?: number | null;
    prepTimeMinutes?: number | null;
    dietaryType?: any;
    allergens?: string[];
    variants?: Array<{ name: string; price: number }>;
  }>,
): Promise<{ importedCategoriesCount: number; importedItemsCount: number }> => {
  // 1. Get or create categories
  const existingCategories = await findCategoriesByRestaurant(restaurantId);
  const categoryMap = new Map<string, string>(); // name.toLowerCase() -> id

  for (const cat of existingCategories) {
    categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
  }

  let createdCategoriesCount = 0;
  for (const catName of categories) {
    const trimmed = catName.trim();
    if (!categoryMap.has(trimmed.toLowerCase())) {
      const created = await createMenuCategory(restaurantId, {
        name: trimmed,
        description: undefined,
        sortOrder: existingCategories.length + createdCategoriesCount,
        isActive: true,
      });
      categoryMap.set(trimmed.toLowerCase(), created.id);
      createdCategoriesCount++;
    }
  }

  // 2. Create menu items
  let createdItemsCount = 0;
  for (const item of items) {
    const categoryId = categoryMap.get(item.categoryName.toLowerCase().trim());
    if (!categoryId) continue;

    const allergens = (item.allergens ?? []).map((name) => ({
      name,
      icon: "⚠️",
    }));

    await createItem(restaurantId, {
      categoryId,
      name: item.name.trim(),
      price: item.price,
      shortDescription: item.shortDescription || undefined,
      longDescription: undefined,
      itemType: "SERVED",
      dietaryType: item.dietaryType || undefined,
      prepTimeMinutes: item.prepTimeMinutes ?? 15,
      calories: item.calories ?? null,
      allergens: allergens as any,
      priceTaxInclusive: true,
      goodsGstRate: undefined,
      hsnSacCode: undefined,
      sortOrder: createdItemsCount,
      isActive: true,
      modifierGroupIds: [],
      variants: (item.variants ?? []).map((v, idx) => ({
        name: v.name,
        price: v.price,
        sortOrder: idx,
        isActive: true,
      })),
    });

    createdItemsCount++;
  }

  return {
    importedCategoriesCount: createdCategoriesCount,
    importedItemsCount: createdItemsCount,
  };
};

export const listAiTasks = async (
  restaurantId: string,
  limit = 20,
): Promise<AiTaskDTO[]> => {
  const tasks = await prisma.aiTask.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return tasks.map((t) => ({
    id: t.id,
    restaurantId: t.restaurantId,
    type: t.type,
    status: t.status,
    modelUsed: t.modelUsed,
    tokensUsed: t.tokensUsed,
    creditsSpent: t.creditsSpent,
    inputPayload: t.inputPayload as any,
    resultPayload: t.resultPayload as any,
    errorMessage: t.errorMessage,
    createdAt: t.createdAt.toISOString(),
  }));
};
