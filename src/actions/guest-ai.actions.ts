"use server";

import { prisma } from "@/lib/prisma";
import { callOpenRouter } from "@/services/ai/openrouter.service";
import { success, failure, type ActionResult } from "@/types";

export interface GuestAiMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface RecommendedProductDTO {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly imageUrl?: string | null;
  readonly description?: string | null;
  readonly isChefSpecial?: boolean;
  readonly isAiFeatured?: boolean;
  readonly dietaryType?: string | null;
  readonly categoryName?: string | null;
}

export interface GuestAiResponse {
  readonly reply: string;
  readonly recommendedProducts: readonly RecommendedProductDTO[];
  readonly suggestedPrompts?: readonly string[];
}

export const askGuestAiAction = async ({
  username,
  tableId: _tableId,
  query,
  chatHistory = [],
}: {
  username: string;
  tableId?: string;
  query: string;
  chatHistory?: readonly GuestAiMessage[];
}): Promise<ActionResult<GuestAiResponse>> => {
  try {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return failure("Lütfen bir soru veya istek yazın.");
    }

    // 1. Fetch restaurant and active menu items
    const restaurant = await prisma.restaurant.findUnique({
      where: { username },
      include: {
        categories: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
        menuItems: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            shortDescription: true,
            price: true,
            dietaryType: true,
            allergens: true,
            isChefSpecial: true,
            isAiFeatured: true,
            categoryId: true,
            images: {
              select: { url: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!restaurant) {
      return failure("Restoran bilgisi bulunamadı.");
    }

    if (restaurant.qrAiEnabled === false) {
      return failure("Yapay zeka danışmanı bu restoranda şu an aktif değil.");
    }

    // Prepare compact menu metadata for AI prompt
    const categoryMap = new Map(restaurant.categories.map((c) => [c.id, c.name]));
    const compactMenu = restaurant.menuItems.map((item) => {
      let allergenList: string[] = [];
      if (Array.isArray(item.allergens)) {
        allergenList = (item.allergens as Array<{ name?: string }>)
          .map((a) => a.name?.toLowerCase().trim() || "")
          .filter(Boolean);
      }
      return {
        id: item.id,
        name: item.name,
        category: categoryMap.get(item.categoryId) || "Genel",
        price: Number(item.price),
        description: item.shortDescription || "",
        dietary: item.dietaryType || "REGULAR",
        allergens: allergenList,
        isChefSpecial: Boolean(item.isChefSpecial),
        isAiFeatured: Boolean(item.isAiFeatured),
      };
    });

    const systemPrompt = `Sen "${restaurant.name}" restoranının seçkin, kibar, samimi ve lezzet konusunda uzman Yapay Zeka Menü Danışmanısın (AI Concierge).
Misafir sana masa QR menüsü üzerinden sorular soruyor, öneri ve rehberlik istiyor.

AŞAĞIDAKİ RESTORAN MENÜSÜ DIŞINDA ASLA HİÇBİR ŞEY ÖNERME VE UYDURMA:
${JSON.stringify(compactMenu, null, 1)}

ÖNEMLİ VE TAVİZSİZ KURALLAR:
1. SADECE verilen menüdeki ürünlerden bahset. Menüde olmayan bir yiyecek/içecek sorulursa kibarca menüde bulunmadığını belirtip en yakın menü ürününü tavsiye et.
2. ÖNERİ ÖNCELİĞİ:
   - Misafir genel bir öneri istediğinde ("ne önerirsin?", "en popüler nedir?", "şefin tavsiyesi" vb.), her zaman "isAiFeatured: true" veya "isChefSpecial: true" olarak işaretlenmiş lezzetleri öncelikle tavsiye et.
3. KESİN ALERJEN VE DİYET UYUMU (HAYATİ ÖNEMDEDİR):
   - Misafir "glutensiz", "çölyak", "vegan", "vejetaryen", "fıstıksız" veya herhangi bir kısıtlama belirttiğinde:
   - Örneğin "glutensiz ne önerirsin?" derse: Alerjenlerinde "gluten", "buğday", "un" bulunan veya unlu/hamurlu olan (pizza, hamburger ekmeği, makarna vb.) ürünleri KESİNLİKLE VE ASLA ÖNERME!
   - Yalnızca alerjen listesinde gluten olmayan, doğal olarak glutensiz veya glutensiz hazırlanan ürünleri öner.
   - Eğer kısıtlamaya uyan ürün yoksa, bunu dürüstçe ve açıkça misafire bildir, yanlış öneri yapma.
4. YANIT FORMATI:
   Yanıtını SADECE ve KESİNLİKLE geçerli bir JSON nesnesi olarak döndür:
   {
     "reply": "Samimi, iştah açıcı ve nazik Türkçe açıklama metni...",
     "recommendedProductIds": ["id1", "id2"],
     "suggestedPrompts": ["Glutensiz tatlı var mı?", "Şefin özel tavsiyesi nedir?"]
   }
   - "recommendedProductIds": Misafire özellikle önerdiğin 1 ila 4 ürünün 'id' değerlerini içeren dizi. Misafir özel bir ürün sormadıysa veya uygun ürün yoksa boş dizi [] bırak.
   - "suggestedPrompts": Misafirin sorabileceği 2-3 adet kısa Türkçe hızlı soru/buton önerisi.
`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...chatHistory.slice(-4).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: cleanQuery },
    ];

    let aiRawResponse = "";
    try {
      const aiRes = await callOpenRouter({
        messages,
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        responseFormat: { type: "json_object" },
        restaurantId: restaurant.id,
        operationType: "MENU_DIGITIZATION",
      });
      aiRawResponse = aiRes.content;
    } catch {
      // If AI service has a hiccup, we fall back to smart local matching below
      aiRawResponse = "";
    }

    let parsedReply = "";
    let recommendedIds: string[] = [];
    let suggestedPrompts: string[] = [];

    if (aiRawResponse) {
      try {
        const jsonMatch = aiRawResponse.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiRawResponse);
        parsedReply = parsed.reply || "";
        recommendedIds = Array.isArray(parsed.recommendedProductIds)
          ? parsed.recommendedProductIds
          : [];
        suggestedPrompts = Array.isArray(parsed.suggestedPrompts)
          ? parsed.suggestedPrompts
          : [];
      } catch {
        parsedReply = aiRawResponse;
      }
    }

    // Fallback if AI returned empty or failed
    if (!parsedReply) {
      const qLower = cleanQuery.toLowerCase();
      const isGlutenQuery = qLower.includes("gluten") || qLower.includes("çölyak");
      const isChefQuery = qLower.includes("şef") || qLower.includes("özel");
      const isVeganQuery = qLower.includes("vegan");
      const isVegQuery = qLower.includes("vejetaryen") || qLower.includes("vejeteryan");

      let filtered = restaurant.menuItems;

      if (isGlutenQuery) {
        filtered = filtered.filter((it) => {
          const allergens = Array.isArray(it.allergens)
            ? (it.allergens as Array<{ name?: string }>).map((a) => a.name?.toLowerCase() || "")
            : [];
          const hasGluten = allergens.some((a) => a.includes("gluten") || a.includes("buğday"));
          const nameHasGluten =
            it.name.toLowerCase().includes("makarna") ||
            it.name.toLowerCase().includes("pizza") ||
            it.name.toLowerCase().includes("burger ekmeği");
          return !hasGluten && !nameHasGluten;
        });
      } else if (isChefQuery) {
        filtered = filtered.filter((it) => it.isChefSpecial);
      } else if (isVeganQuery || isVegQuery) {
        filtered = filtered.filter((it) => it.dietaryType === "VEG");
      }

      // Prioritize AI featured & chef specials
      filtered.sort((a, b) => {
        const scoreA = (a.isAiFeatured ? 2 : 0) + (a.isChefSpecial ? 1 : 0);
        const scoreB = (b.isAiFeatured ? 2 : 0) + (b.isChefSpecial ? 1 : 0);
        return scoreB - scoreA;
      });

      const topPicks = filtered.slice(0, 3);
      recommendedIds = topPicks.map((it) => it.id);

      if (isGlutenQuery) {
        parsedReply = topPicks.length > 0
          ? `Sizin için menümüzden gluten içermeyen güvenli lezzetlerimizi seçtim. Afiyetle tercih edebilirsiniz!`
          : `Menümüzde şu an için glutensiz olarak işaretlenmiş özel bir seçenek bulunmamaktadır. Dilerseniz sipariş verirken garsonunuza danışabilirsiniz.`;
      } else if (isChefQuery) {
        parsedReply = `Şefimizin bugün için misafirlerimize özellikle tavsiye ettiği imza lezzetler aşağıdadır:`;
      } else {
        parsedReply = `Sizin için menümüzün en sevilen ve öne çıkan lezzetlerini derledim:`;
      }

      suggestedPrompts = [
        "Glutensiz seçenekler neler?",
        "Şefin tavsiyesi nedir?",
        "Popüler tatlılar hangileri?",
      ];
    }

    // Resolve products from recommended IDs
    const recommendedProducts: RecommendedProductDTO[] = recommendedIds
      .map((id) => restaurant.menuItems.find((it) => it.id === id))
      .filter((it): it is NonNullable<typeof it> => it !== null && it !== undefined)
      .map((it) => ({
        id: it.id,
        name: it.name,
        price: Number(it.price),
        imageUrl: it.images[0]?.url || null,
        description: it.shortDescription || null,
        isChefSpecial: Boolean(it.isChefSpecial),
        isAiFeatured: Boolean(it.isAiFeatured),
        dietaryType: it.dietaryType || null,
        categoryName: categoryMap.get(it.categoryId) || null,
      }));

    return success({
      reply: parsedReply,
      recommendedProducts,
      suggestedPrompts,
    });
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Yapay zeka asistanı yanıt verirken bir hata oluştu.",
    );
  }
};
