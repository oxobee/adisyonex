import { describe, expect, it } from "vitest";

import { aiCommitMenuSchema } from "./ai";

describe("aiCommitMenuSchema", () => {
  it("normalizes common AI output variations before a menu is saved", () => {
    const parsed = aiCommitMenuSchema.parse({
      categories: ["  Burgerler  "],
      items: [
        {
          name: "  Mantarlı Burger ",
          categoryName: " Burgerler ",
          price: "325",
          calories: "640",
          prepTimeMinutes: "15",
          dietaryType: "vegetarian",
          allergens: [{ name: "Gluten" }, " Süt "],
          variants: [
            { name: " Büyük ", price: "375" },
            { name: "", price: 0 },
          ],
        },
      ],
    });

    expect(parsed.categories).toEqual(["Burgerler"]);
    expect(parsed.items[0]).toMatchObject({
      name: "Mantarlı Burger",
      categoryName: "Burgerler",
      price: 325,
      calories: 640,
      prepTimeMinutes: 15,
      dietaryType: "VEG",
      allergens: ["Gluten", "Süt"],
      variants: [{ name: "Büyük", price: 375 }],
    });
  });

  it("keeps an unknown dietary label empty instead of rejecting the full import", () => {
    const parsed = aiCommitMenuSchema.parse({
      categories: ["İçecekler"],
      items: [
        {
          name: "Limonata",
          categoryName: "İçecekler",
          price: 90,
          dietaryType: "Bilinmiyor",
        },
      ],
    });

    expect(parsed.items[0]?.dietaryType).toBeUndefined();
  });
});
