import { prisma } from "@/lib/prisma";
import type {
  AiCopywriterInput,
  AiImageGenInput,
  AiMenuDigitizeInput,
} from "@/lib/validators/ai";
import { scrapeMenuUrl } from "@/lib/url-scraper";
import {
  createMenuCategory,
  findCategoriesByRestaurant,
} from "@/repositories/menu-category.repository";
import {
  createModifierGroup,
  findModifierGroupsByRestaurant,
} from "@/repositories/modifier-group.repository";
import { createItem } from "@/services/menu-item.service";
import { addItemImageForRestaurant } from "@/services/menu-image.service";
import type {
  AiCopywriterResultDTO,
  AiDigitizedMenuDTO,
  AiTaskDTO,
} from "@/types/ai";
import {
  assertAndDeductCredits,
  refundCredits,
} from "./ai-credit.service";
import { getModelForTaskAndTier } from "./ai-setting.service";
import { callOpenRouter } from "./openrouter.service";
import type { QualityLevel } from "@/generated/prisma/client";

/** Digitize a physical menu (Multiple Images, PDF, or Raw Text) into structured Menu DTO */
export const digitizeMenu = async (
  restaurantId: string,
  input: AiMenuDigitizeInput,
): Promise<{ task: AiTaskDTO; menu: AiDigitizedMenuDTO }> => {
  const { modelId, creditCost } = await getModelForTaskAndTier("MENU_DIGITIZATION", "STANDARD");

  // 1. Create PENDING task record
  const task = await prisma.aiTask.create({
    data: {
      restaurantId,
      type: "MENU_DIGITIZATION",
      status: "PROCESSING",
      creditsSpent: creditCost,
      inputPayload: input as any,
    },
  });

  // 2. Deduct credits
  await assertAndDeductCredits(
    restaurantId,
    creditCost,
    "MENU_DIGITIZATION",
    task.id,
    "Menü Fotoğrafı / Belgesi Dijitalleştirme",
  );

  try {
    const systemPrompt = `Sen uzman bir restoran menü dijitalleştirme, OCR ve gastronomi yapay zekasısın.
Sana verilen menü görselini/metnini analiz et ve aşağıdaki kurallara harfiyen uy:
1. Menüde yer almayan hiçbir ürün veya temel fiyat UYDURMA. Fiyat okunamıyorsa 0 veya null bırak.
2. KATEGORİLEME:
   - Metinde açık bir kategori başlığı yoksa bile ürünleri içeriğine göre en uygun Türkçe kategoriye ata (Örn: Cheesecake ve Sufle -> "Tatlılar", Latte ve Çay -> "İçecekler", Burger ve Patates -> "Burgerler", Kebaplar -> "Kebaplar", vb.).
3. EK SEÇENEK GRUPLARI (Modifier Groups / Soslar / Ekstralar / Seçimler):
   - Ürünün altında yer alan "Sos Seçenekleri", "Ekstralar", "Seçenekler", "Malzemeler", "Pişme Derecesi" gibi seçimleri "modifierGroups" alanına çıkar.
   - Her grup için:
     - "name": Grubun adı (Örn: "Sos Seçenekleri", "Ekstralar", "Peynir Seçimi").
     - "isRequired": Zorunlu seçim mi? (Sos veya temel seçim ise true, ekstra ekleme ise false).
     - "minSelect": Minimum seçim adedi (Zorunlu ise 1, opsiyonel ise 0).
     - "maxSelect": Maksimum seçim adedi (Tek seçim ise 1, birden fazla seçilebiliyorsa seçenek sayısı).
     - "modifiers": Seçeneklerin listesi:
       - "name": Seçenek adı (Örn: "Sade", "Çikolata Sos", "Lotus Sos", "Vanilyalı Dondurma").
       - "priceDelta": Fiyat farkı (Örn: "Ücretsiz" veya "Bedava" -> 0, "+30 TL" -> 30, "+40 TL" -> 40, "30 TL" -> 30).
4. VARYANTLAR (Porsiyon / Boyut Fiyatları):
   - Eğer ürünün boyut/porsiyon fiyatları varsa "variants" dizisine ekle (Örn: "Tek Porsiyon": 220, "1.5 Porsiyon": 330).
5. ALERJEN, BESLENME VE KALORİ TAHMİNİ:
   - "dietaryType": Ürünün içeriğine göre "VEG" (Vejetaryen), "NON_VEG" (Et/Tavuk/Balık içeren) veya "EGG" (Yumurtalı/unlu tatlılar vb.) olarak belirle.
   - "calories": Porsiyon başına tahmini kalori (Örn: San Sebastian Cheesecake -> 480, Sufle -> 520, Burger -> 750, vb.).
   - "allergens": Üründe bulunması muhtemel alerjenleri Türkçe dizi olarak yaz (Örn: ["Gluten", "Süt/Laktoz", "Yumurta", "Fındık/Fıstık", "Soya"]).
   - "prepTimeMinutes": Ortalama hazırlanma süresi (Örn: 10, 15, 20).
6. Yanıtın SADECE geçerli bir JSON olmalıdır:
{
  "restaurantName": "Restoran Adı",
  "categories": [
    {
      "name": "Kategori Adı",
      "description": "Kategori açıklaması (varsa)",
      "items": [
        {
          "name": "Ürün Adı",
          "price": 220,
          "shortDescription": "İçerik ve malzeme açıklaması",
          "categoryName": "Kategori Adı",
          "dietaryType": "VEG" | "NON_VEG" | "EGG" | null,
          "prepTimeMinutes": 15,
          "calories": 480,
          "allergens": ["Gluten", "Süt/Laktoz", "Yumurta"],
          "variants": [
            { "name": "Tek Porsiyon", "price": 220 }
          ],
          "modifierGroups": [
            {
              "name": "Sos Seçenekleri",
              "minSelect": 1,
              "maxSelect": 1,
              "isRequired": true,
              "modifiers": [
                { "name": "Sade", "priceDelta": 0 },
                { "name": "Çikolata Sos", "priceDelta": 30 },
                { "name": "Lotus Sos", "priceDelta": 35 }
              ]
            },
            {
              "name": "Ekstralar",
              "minSelect": 0,
              "maxSelect": 5,
              "isRequired": false,
              "modifiers": [
                { "name": "Vanilyalı Dondurma", "priceDelta": 40 },
                { "name": "Çilek", "priceDelta": 30 }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (input.fileUrls && input.fileUrls.length > 0) {
      const userContent: any[] = [
        {
          type: "text",
          text: `Aşağıdaki ${input.fileUrls.length} adet menü sayfasını eksiksiz analiz et, tüm kategorileri, ürünleri, fiyatları ve açıklamaları JSON olarak çıkar:`,
        },
      ];
      for (const url of input.fileUrls) {
        userContent.push({
          type: "image_url",
          image_url: { url },
        });
      }
      messages.push({ role: "user", content: userContent });
    } else if (input.fileUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Bu menü görselindeki tüm ürünleri ve fiyatları çıkar:" },
          { type: "image_url", image_url: { url: input.fileUrl } },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Aşağıdaki menü metnini JSON menü yapısına dönüştür:\n\n${input.rawText ?? ""}`,
      });
    }

    const aiRes = await callOpenRouter({
      messages,
      model: modelId,
      responseFormat: { type: "json_object" },
      restaurantId,
      operationType: "MENU_DIGITIZATION",
      chargedCredits: creditCost,
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
    await refundCredits(
      restaurantId,
      creditCost,
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

/** Digitize a live Menu from a Website URL */
export const digitizeMenuFromUrl = async (
  restaurantId: string,
  url: string,
): Promise<{ task: AiTaskDTO; menu: AiDigitizedMenuDTO }> => {
  const { modelId, creditCost } = await getModelForTaskAndTier("MENU_URL_ANALYSIS", "STANDARD");

  // 1. Scrape Web Page with SSRF protection
  const scraped = await scrapeMenuUrl(url);

  // 2. Create task & deduct credits
  const task = await prisma.aiTask.create({
    data: {
      restaurantId,
      type: "MENU_URL_ANALYSIS",
      status: "PROCESSING",
      creditsSpent: creditCost,
      inputPayload: { url, pageTitle: scraped.pageTitle },
    },
  });

  await assertAndDeductCredits(
    restaurantId,
    creditCost,
    "MENU_URL_ANALYSIS",
    task.id,
    `"${url}" adresinden menü çıkarma`,
  );

  try {
    const systemPrompt = `Sen web sitelerinden menü verisi çıkartan bir AI ve gastronomi uzmanısın.
Sana verilen web sitesi içeriğini analiz ederek kategorileri, ürünleri, açıklamaları, fiyatları, ek seçenek gruplarını (modifierGroups), beslenme türünü, alerjenleri ve kaloriyi eksiksiz bir JSON olarak döndür.
Uydurma veri üretme; sitede olmayan fiyatları null bırak.
JSON formatı:
{
  "restaurantName": "${scraped.pageTitle ?? "Menü"}",
  "categories": [
    {
      "name": "Kategori Adı",
      "items": [
        {
          "name": "Ürün Adı",
          "price": 100,
          "shortDescription": "Açıklama",
          "categoryName": "Kategori Adı",
          "dietaryType": "VEG" | "NON_VEG" | "EGG" | null,
          "prepTimeMinutes": 15,
          "calories": 450,
          "allergens": ["Gluten", "Süt/Laktoz"],
          "variants": [
            { "name": "Porsiyon", "price": 100 }
          ],
          "modifierGroups": [
            {
              "name": "Ek Seçenekler",
              "minSelect": 0,
              "maxSelect": 5,
              "isRequired": false,
              "modifiers": [
                { "name": "Ekstra Peynir", "priceDelta": 20 }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

    const aiRes = await callOpenRouter({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Web Sitesi Başlığı: ${scraped.pageTitle ?? ""}\n\nİçerik:\n${scraped.text}`,
        },
      ],
      model: modelId,
      responseFormat: { type: "json_object" },
      restaurantId,
      operationType: "MENU_URL_ANALYSIS",
      chargedCredits: creditCost,
    });

    let parsed: AiDigitizedMenuDTO;
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      const match = aiRes.content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { categories: [] };
    }

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
    await refundCredits(
      restaurantId,
      creditCost,
      "MENU_URL_ANALYSIS_FAILED",
      task.id,
      "Hata sebebiyle URL analiz kredisi iade edildi",
    );

    await prisma.aiTask.update({
      where: { id: task.id },
      data: {
        status: "FAILED",
        errorMessage: err.message || "URL analizi başarısız oldu",
      },
    });
    throw err;
  }
};

/** Generate Food Photography Image (Text-to-Image with 4 quality tiers) */
/** Generate Food Photography Image (Text-to-Image with 4 quality tiers) */
export const generateFoodImage = async (
  restaurantId: string,
  input: AiImageGenInput & { qualityLevel?: QualityLevel },
): Promise<{ imageUrl: string; prompt: string; creditsSpent: number }> => {
  const quality = input.qualityLevel ?? "STANDARD";
  const { modelId, creditCost } = await getModelForTaskAndTier("IMAGE_GENERATION", quality);

  await assertAndDeductCredits(
    restaurantId,
    creditCost,
    "IMAGE_GENERATION",
    undefined,
    `"${input.itemName}" için ${quality} kalite görsel üretimi`,
  );

  let styleDetail =
    "Soft warm restaurant studio lighting, appetizing natural steam, mouthwatering textures, shallow depth of field with soft bokeh background.";

  if (input.style === "WHITE_BACKGROUND") {
    styleDetail =
      "Pure seamless bright solid white studio infinity backdrop, high-key clean commercial studio lighting, soft subtle contact shadow under the plate, isolated modern food catalog presentation.";
  } else if (input.style === "RUSTIC") {
    styleDetail =
      "Warm natural sunlight, rustic dark aged wooden tabletop texture, artisan culinary ambiance, cozy authentic atmosphere.";
  } else if (input.style === "MODERN_MINIMAL") {
    styleDetail =
      "Minimalist fine dining plating on modern slate or artisanal stoneware, artistic culinary arrangement, sleek contemporary aesthetic.";
  } else if (input.style === "FAST_FOOD_VIBRANT") {
    styleDetail =
      "Vibrant saturated colors, dynamic mouthwatering sizzle, fresh dripping sauce and cheese stretch, bold appetizing contrast.";
  } else if (input.style === "DARK_GOURMET") {
    styleDetail =
      "Dark moody gourmet atmosphere, dramatic side rim lighting, rich shadows, luxury steakhouse and fine wine aesthetic.";
  }

  const prompt = `Professional gourmet culinary food photography of: ${input.itemName}.
${input.itemDescription ? `Plate composition & ingredients: ${input.itemDescription}. ` : ""}
Format & Composition: 1:1 SQUARE aspect ratio, centered close-up food plating, professional 45-degree culinary camera angle.
Lighting & Background Style: ${styleDetail}
Resolution & Quality: 8k resolution, ultra photorealistic, pin-sharp delicious textures.
CRITICAL NEGATIVE CONSTRAINTS - NO TEXT: Absolutely NO text, NO typography, NO words, NO letters, NO writing, NO numbers, NO subtitles, NO watermarks, NO brand logos, NO price tags, NO menu labels, NO human faces. The image must contain ONLY the delicious food dish cleanly presented.`;

  try {
    const aiRes = await callOpenRouter({
      messages: [{ role: "user", content: prompt }],
      model: modelId,
      restaurantId,
      operationType: "IMAGE_GENERATION",
      qualityLevel: quality,
      chargedCredits: creditCost,
    });

    let generatedUrl = "";
    if (aiRes.images && aiRes.images.length > 0) {
      generatedUrl = aiRes.images[0];
    } else if (aiRes.content.startsWith("data:image/") || aiRes.content.startsWith("http")) {
      generatedUrl = aiRes.content;
    } else {
      const match = aiRes.content.match(/(data:image\/[a-zA-Z]+;base64,[^"\s\)]+)|(https?:\/\/[^\s\)"']+)/);
      if (match) {
        generatedUrl = match[0];
      }
    }

    if (!generatedUrl || (!generatedUrl.startsWith("data:image/") && !generatedUrl.startsWith("http"))) {
      throw new Error("Görsel verisi alınamadı");
    }

    return {
      imageUrl: generatedUrl,
      prompt,
      creditsSpent: creditCost,
    };
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      creditCost,
      "IMAGE_GENERATION_FAILED",
      undefined,
      "Görsel üretimi başarısız oldu, krediniz geri yüklendi",
    );
    throw new Error("İşlem başarısız oldu, lütfen yeniden deneyiniz. Kredileriniz geri yüklendi.");
  }
};

/** Professionalize / Enhance an Amateur Food Photo (Image-to-Image) */
export const professionalizeFoodPhoto = async (
  restaurantId: string,
  input: {
    imageUrl: string;
    dishName: string;
    qualityLevel?: QualityLevel;
  },
): Promise<{ enhancedImageUrl: string; originalImageUrl: string; creditsSpent: number }> => {
  const quality = input.qualityLevel ?? "PROFESSIONAL";
  const { modelId, creditCost } = await getModelForTaskAndTier("PHOTO_PROFESSIONALIZATION", quality);

  await assertAndDeductCredits(
    restaurantId,
    creditCost,
    "PHOTO_PROFESSIONALIZATION",
    undefined,
    `"${input.dishName}" fotoğrafını profesyonelleştirme`,
  );

  const prompt = `Professional food photography enhancement of this exact dish: ${input.dishName}.
PRESERVE the original food contents, ingredients, portion size, and plating shape.
Format & Framing: 1:1 SQUARE aspect ratio, centered plate composition.
IMPROVE: Replace amateur lighting with warm softbox restaurant studio lighting, enhance appetizing steam and sizzle reflections, natural soft shadows, crystal-clear gourmet food plating aesthetics. Ultra high resolution.
CRITICAL NEGATIVE CONSTRAINTS - NO TEXT: Absolutely NO text, NO typography, NO words, NO letters, NO writing, NO numbers, NO watermarks, NO brand logos, NO signs. The image must contain ONLY the enhanced food dish cleanly presented.`;

  try {
    const aiRes = await callOpenRouter({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ],
      model: modelId,
      restaurantId,
      operationType: "PHOTO_PROFESSIONALIZATION",
      qualityLevel: quality,
      chargedCredits: creditCost,
    });

    let enhancedUrl = "";
    if (aiRes.images && aiRes.images.length > 0) {
      enhancedUrl = aiRes.images[0];
    } else if (aiRes.content.startsWith("data:image/") || aiRes.content.startsWith("http")) {
      enhancedUrl = aiRes.content;
    } else {
      const match = aiRes.content.match(/(data:image\/[a-zA-Z]+;base64,[^"\s\)]+)|(https?:\/\/[^\s\)"']+)/);
      if (match) {
        enhancedUrl = match[0];
      }
    }

    if (!enhancedUrl || (!enhancedUrl.startsWith("data:image/") && !enhancedUrl.startsWith("http"))) {
      throw new Error("İyileştirilmiş görsel verisi alınamadı");
    }

    return {
      enhancedImageUrl: enhancedUrl,
      originalImageUrl: input.imageUrl,
      creditsSpent: creditCost,
    };
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      creditCost,
      "PHOTO_PROFESSIONALIZE_FAILED",
      undefined,
      "Fotoğraf iyileştirme başarısız oldu, krediniz geri yüklendi",
    );
    throw new Error("İşlem başarısız oldu, lütfen yeniden deneyiniz. Kredileriniz geri yüklendi.");
  }
};

/** Generate Copywriting & Nutrition */
export const generateItemCopywriting = async (
  restaurantId: string,
  input: AiCopywriterInput,
): Promise<AiCopywriterResultDTO> => {
  const { modelId, creditCost } = await getModelForTaskAndTier("ITEM_DESCRIPTION", "STANDARD");

  await assertAndDeductCredits(
    restaurantId,
    creditCost,
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
      model: modelId,
      responseFormat: { type: "json_object" },
      restaurantId,
      operationType: "ITEM_DESCRIPTION",
      chargedCredits: creditCost,
    });

    const parsed: AiCopywriterResultDTO = JSON.parse(aiRes.content);
    return parsed;
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      creditCost,
      "COPYWRITER_FAILED",
      undefined,
      "Hata sebebiyle metin yazarlığı kredisi iade edildi",
    );
    throw err;
  }
};

/** Commit digitized items into actual MenuCategory and MenuItem tables */
export const commitDigitizedMenu = async (
  restaurantId: string,
  categories: string[],
  items: Array<{
    name: string;
    categoryName: string;
    price: number;
    shortDescription?: string | null;
    calories?: number | null;
    prepTimeMinutes?: number | null;
    dietaryType?: any;
    allergens?: string[];
    variants?: Array<{ name: string; price: number }>;
    modifierGroups?: Array<{
      name: string;
      minSelect?: number;
      maxSelect?: number;
      isRequired?: boolean;
      modifiers: Array<{ name: string; priceDelta: number }>;
    }>;
  }>,
): Promise<{ importedCategoriesCount: number; importedItemsCount: number; importedModifierGroupsCount: number }> => {
  const existingCategories = await findCategoriesByRestaurant(restaurantId);
  const categoryMap = new Map<string, string>();

  for (const cat of existingCategories) {
    categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
  }

  let createdCategoriesCount = 0;
  for (const catName of categories) {
    const trimmed = catName.trim();
    if (!trimmed) continue;
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

  // Pre-load existing modifier groups for restaurant
  const existingModifierGroups = await findModifierGroupsByRestaurant(restaurantId);
  const modifierGroupMap = new Map<string, string>();
  for (const group of existingModifierGroups) {
    modifierGroupMap.set(group.name.toLowerCase().trim(), group.id);
  }

  let createdModifierGroupsCount = 0;
  let createdItemsCount = 0;

  for (const item of items) {
    let categoryId = categoryMap.get(item.categoryName.toLowerCase().trim());
    if (!categoryId) {
      // Auto-create category if missing
      const catName = item.categoryName.trim() || "Genel";
      const created = await createMenuCategory(restaurantId, {
        name: catName,
        description: undefined,
        sortOrder: existingCategories.length + createdCategoriesCount,
        isActive: true,
      });
      categoryId = created.id;
      categoryMap.set(catName.toLowerCase(), categoryId);
      createdCategoriesCount++;
    }

    // Process & create/link modifier groups (Soslar, Ekstralar, Seçimler)
    const itemModifierGroupIds: string[] = [];
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      for (const grp of item.modifierGroups) {
        const trimmedGrpName = grp.name.trim();
        if (!trimmedGrpName || !grp.modifiers || grp.modifiers.length === 0) continue;

        let groupId = modifierGroupMap.get(trimmedGrpName.toLowerCase());
        if (!groupId) {
          try {
            const createdGroup = await createModifierGroup(restaurantId, {
              name: trimmedGrpName,
              minSelect: grp.minSelect ?? (grp.isRequired ? 1 : 0),
              maxSelect: grp.maxSelect ?? Math.max(1, grp.modifiers.length),
              isRequired: grp.isRequired ?? false,
              modifiers: grp.modifiers.map((m, mIdx) => ({
                name: m.name.trim(),
                priceDelta: Number(m.priceDelta) || 0,
                sortOrder: mIdx,
                isActive: true,
              })),
            });
            groupId = createdGroup.id;
            modifierGroupMap.set(trimmedGrpName.toLowerCase(), groupId);
            createdModifierGroupsCount++;
          } catch (e) {
            console.error("Failed to create modifier group:", trimmedGrpName, e);
          }
        }

        if (groupId && !itemModifierGroupIds.includes(groupId)) {
          itemModifierGroupIds.push(groupId);
        }
      }
    }

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
      modifierGroupIds: itemModifierGroupIds,
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
    importedModifierGroupsCount: createdModifierGroupsCount,
  };
};

export const listAiTasks = async (
  restaurantId: string,
  limit = 50,
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

/** Quick Short Description Generator (2 Credits) */
export const generateQuickShortDesc = async (
  restaurantId: string,
  input: { name: string; categoryName?: string },
): Promise<{ text: string }> => {
  const cost = 2;
  await assertAndDeductCredits(
    restaurantId,
    cost,
    "QUICK_SHORT_DESC",
    undefined,
    `"${input.name}" için kısa açıklama üretimi`,
  );

  try {
    const prompt = `Ürün: ${input.name}
Kategori: ${input.categoryName ?? "Menü"}
GÖREV: Bu ürün için menü kartında yer alacak 1 cümlelik (maks. 100 karakter), iştah açıcı, vurucu ve net bir Türkçe kısa açıklama yaz.
SADECE açıklama metnini döndür, tırnak işareti veya ekleme yapma.`;

    const aiRes = await callOpenRouter({
      messages: [{ role: "user", content: prompt }],
      restaurantId,
      operationType: "ITEM_DESCRIPTION",
      chargedCredits: cost,
    });

    return { text: aiRes.content.trim().replace(/^["']|["']$/g, "") };
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      cost,
      "QUICK_SHORT_DESC_FAILED",
      undefined,
      "Kısa açıklama üretilemedi, kredi iade edildi",
    );
    throw err;
  }
};

/** Quick Long Description Generator (2 Credits) */
export const generateQuickLongDesc = async (
  restaurantId: string,
  input: { name: string; categoryName?: string; shortDescription?: string },
): Promise<{ text: string }> => {
  const cost = 2;
  await assertAndDeductCredits(
    restaurantId,
    cost,
    "QUICK_LONG_DESC",
    undefined,
    `"${input.name}" için detaylı açıklama üretimi`,
  );

  try {
    const prompt = `Ürün: ${input.name}
Kategori: ${input.categoryName ?? "Menü"}
Kısa Açıklama / Özellik: ${input.shortDescription ?? ""}
GÖREV: Bu ürün için detaylı içerik, pişirme tekniği, lezzet uyumu ve sunum detaylarını içeren 2-3 cümlelik zengin ve iştah kabartan bir Türkçe açıklama yaz.
SADECE açıklama metnini döndür, tırnak işareti veya başlık koyma.`;

    const aiRes = await callOpenRouter({
      messages: [{ role: "user", content: prompt }],
      restaurantId,
      operationType: "ITEM_DESCRIPTION",
      chargedCredits: cost,
    });

    return { text: aiRes.content.trim().replace(/^["']|["']$/g, "") };
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      cost,
      "QUICK_LONG_DESC_FAILED",
      undefined,
      "Detaylı açıklama üretilemedi, kredi iade edildi",
    );
    throw err;
  }
};

/** Estimate Item Calories with AI (2 Credits) */
export const estimateItemCalories = async (
  restaurantId: string,
  input: {
    name: string;
    categoryName?: string;
    shortDescription?: string;
    longDescription?: string;
    imageUrl?: string;
  },
): Promise<{ calories: number; explanation: string }> => {
  const cost = 2;
  await assertAndDeductCredits(
    restaurantId,
    cost,
    "ESTIMATE_CALORIES",
    undefined,
    `"${input.name}" için kalori analizi`,
  );

  try {
    const systemPrompt = `Sen bir beslenme uzmanı ve menü analistisin.
Verilen yemek adı, açıklaması ve malzemelerine göre 1 standart porsiyon için yaklaşık kalori (kcal) değerini hesapla.
SADECE JSON döndür:
{
  "calories": 450,
  "explanation": "200gr dana eti ve sos içeriğine göre tahmin"
}`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    const userText = `Yemek: ${input.name}\nKategori: ${input.categoryName ?? ""}\nAçıklama: ${
      input.shortDescription || input.longDescription || ""
    }`;

    if (input.imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: input.imageUrl } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userText });
    }

    const aiRes = await callOpenRouter({
      messages,
      responseFormat: { type: "json_object" },
      restaurantId,
      operationType: "ALLERGEN_CALORIE_EST",
      chargedCredits: cost,
    });

    const parsed = JSON.parse(aiRes.content);
    return {
      calories: Number(parsed.calories) || 350,
      explanation: parsed.explanation || "Standart porsiyon baz alınarak hesaplandı",
    };
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      cost,
      "ESTIMATE_CALORIES_FAILED",
      undefined,
      "Kalori tahmini yapılamadı, kredi iade edildi",
    );
    throw err;
  }
};

/** Auto-Detect Allergens using AI (2 Credits) */
export const detectItemAllergens = async (
  restaurantId: string,
  input: {
    name: string;
    categoryName?: string;
    shortDescription?: string;
    longDescription?: string;
  },
): Promise<{ allergens: Array<{ name: string; icon: string }> }> => {
  const cost = 2;
  await assertAndDeductCredits(
    restaurantId,
    cost,
    "ALLERGEN_CALORIE_EST",
    undefined,
    `"${input.name}" için AI alerjen tespiti`,
  );

  try {
    const systemPrompt = `Sen profesyonel bir gıda güvenliği ve gastronomi alerjen uzmanısın.
Verilen yemek adı, kategori ve açıklama bilgilerine göre bu yemekte bulunması muhtemel alerjenleri analiz et ve tespit et.
Tespit ettiğin her alerjen için uygun bir emoji ikonu belirle.
Örnek ikonlar:
- Gluten, Buğday: 🌾
- Süt, Peynir, Yoğurt, Tereyağı, Laktoz: 🥛
- Yumurta: 🥚
- Fıstık, Fındık, Badem, Kuruyemiş: 🥜
- Balık: 🐟
- Kabuklu Deniz Ürünleri, Karides: 🦐
- Soya: 🌱
- Susam: 🥯
- Acı Biber / Baharat: 🌶️
- Sarımsak: 🧄
- Soğan: 🧅
- Mantar: 🍄
- Kereviz: 🥬
- Hardal: 🌭
- Çikolata / Kakao: 🍫

Yanıtın SADECE aşağıdaki JSON formatında olmalı:
{
  "allergens": [
    { "name": "Gluten", "icon": "🌾" },
    { "name": "Süt Ürünleri", "icon": "🥛" }
  ]
}`;

    const userText = `Yemek Adı: ${input.name}\nKategori: ${input.categoryName ?? ""}\nKısa Açıklama: ${
      input.shortDescription ?? ""
    }\nDetaylı Açıklama: ${input.longDescription ?? ""}`;

    const aiRes = await callOpenRouter({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      responseFormat: { type: "json_object" },
      restaurantId,
      operationType: "ALLERGEN_CALORIE_EST",
      chargedCredits: cost,
    });

    const parsed = JSON.parse(aiRes.content);
    const rawAllergens = Array.isArray(parsed.allergens) ? parsed.allergens : [];
    return {
      allergens: rawAllergens
        .map((a: any) => ({
          name: String(a.name || "").trim(),
          icon: String(a.icon || "🌾").trim(),
        }))
        .filter((a: any) => a.name.length > 0),
    };
  } catch (err: any) {
    await refundCredits(
      restaurantId,
      cost,
      "ESTIMATE_ALLERGENS_FAILED",
      undefined,
      "Alerjen tespiti yapılamadı, kredi iade edildi",
    );
    throw err;
  }
};

/** Generate AI Image and Attach directly to Product (20 Credits) */
export const generateAndAttachItemImage = async (
  restaurantId: string,
  input: {
    itemId: string;
    name: string;
    description?: string;
  },
): Promise<{ imageId: string; imageUrl: string }> => {
  const gen = await generateFoodImage(restaurantId, {
    itemName: input.name,
    itemDescription: input.description,
    style: "STUDIO_FOOD",
    qualityLevel: "STANDARD",
  });

  let buffer: Buffer;
  if (gen.imageUrl.startsWith("data:image/")) {
    const base64Data = gen.imageUrl.replace(/^data:image\/\w+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  } else {
    const res = await fetch(gen.imageUrl);
    const ab = await res.arrayBuffer();
    buffer = Buffer.from(ab);
  }

  const image = await addItemImageForRestaurant(restaurantId, input.itemId, {
    buffer,
    type: "image/png",
    size: buffer.length,
  });

  return { imageId: image.id, imageUrl: image.url };
};

/** Enhance Existing Item Image and Attach directly to Product (40 Credits) */
export const enhanceAndAttachItemImage = async (
  restaurantId: string,
  input: {
    itemId: string;
    imageUrl: string;
    dishName: string;
  },
): Promise<{ imageId: string; imageUrl: string }> => {
  const enhanced = await professionalizeFoodPhoto(restaurantId, {
    imageUrl: input.imageUrl,
    dishName: input.dishName,
    qualityLevel: "PROFESSIONAL",
  });

  let buffer: Buffer;
  if (enhanced.enhancedImageUrl.startsWith("data:image/")) {
    const base64Data = enhanced.enhancedImageUrl.replace(/^data:image\/\w+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  } else {
    const res = await fetch(enhanced.enhancedImageUrl);
    const ab = await res.arrayBuffer();
    buffer = Buffer.from(ab);
  }

  const image = await addItemImageForRestaurant(restaurantId, input.itemId, {
    buffer,
    type: "image/png",
    size: buffer.length,
  });

  return { imageId: image.id, imageUrl: image.url };
};

