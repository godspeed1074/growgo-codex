import { HttpsError } from "firebase-functions/v2/https";

export interface CraftingRecipeDefinition {
  id: string;
  level: number;
  craftingXp: number;
  ingredients: Readonly<Record<string, number>>;
}

/**
 * This is deliberately server-side. The crafting screen can describe a
 * recipe, but only this catalogue can consume materials and produce its item.
 */
export const craftingRecipeCatalog = Object.freeze<CraftingRecipeDefinition[]>([
  { id: "flour", level: 1, craftingXp: 25, ingredients: { wheat: 2 } },
  { id: "sugar", level: 2, craftingXp: 40, ingredients: { sugar_cane: 2 } },
  { id: "energy_bar", level: 3, craftingXp: 75, ingredients: { sugar: 1, wheat: 1 } },
  { id: "corn_meal", level: 4, craftingXp: 90, ingredients: { corn: 1 } },
  { id: "sweet_corn_snack", level: 5, craftingXp: 100, ingredients: { corn_meal: 1, sugar: 1 } },
  { id: "purified_water", level: 6, craftingXp: 100, ingredients: { water: 1 } },
  { id: "bread", level: 7, craftingXp: 125, ingredients: { flour: 1, purified_water: 1 } },
  { id: "energy_drink", level: 8, craftingXp: 250, ingredients: { sugar: 1, purified_water: 1 } },
  { id: "battered_fish", level: 9, craftingXp: 300, ingredients: { fish: 1, flour: 1, purified_water: 1 } },
  { id: "butter", level: 11, craftingXp: 350, ingredients: { milk: 1 } },
  { id: "buttered_corn", level: 12, craftingXp: 400, ingredients: { corn: 1, butter: 1 } },
  { id: "cream", level: 13, craftingXp: 425, ingredients: { milk: 1 } },
  { id: "milk_chocolate_bar", level: 14, craftingXp: 500, ingredients: { cream: 1, sugar: 1, cocoa_beans: 1 } },
  { id: "sugar_syrup", level: 15, craftingXp: 525, ingredients: { sugar: 1, water: 1 } },
  { id: "fairy_bread", level: 16, craftingXp: 550, ingredients: { sugar: 2, bread: 1 } },
  { id: "pasta", level: 17, craftingXp: 575, ingredients: { flour: 1, purified_water: 1 } },
  { id: "chocolate_energy_drink", level: 18, craftingXp: 650, ingredients: { cocoa_beans: 1, sugar: 1, water: 1 } },
  { id: "battered_trout", level: 19, craftingXp: 700, ingredients: { fish: 1, flour: 1, water: 1 } },
  { id: "egg_tomato_sandwich", level: 21, craftingXp: 700, ingredients: { bread: 1, egg: 1, tomato: 1 } },
  { id: "omelette", level: 22, craftingXp: 750, ingredients: { egg: 1, milk: 1, tomato: 1 } },
  { id: "cream_of_tomato_soup", level: 23, craftingXp: 800, ingredients: { tomato: 1, cream: 1 } },
  { id: "spaghetti_marinara", level: 24, craftingXp: 850, ingredients: { pasta: 1, tomato: 1 } },
  { id: "pancakes", level: 25, craftingXp: 900, ingredients: { flour: 1, egg: 1, milk: 1 } },
  { id: "chocolate_brownies", level: 26, craftingXp: 950, ingredients: { flour: 1, sugar: 1, cocoa_beans: 1 } },
  { id: "chocolate_croissant", level: 27, craftingXp: 1000, ingredients: { flour: 1, butter: 1, cocoa_beans: 1 } },
  { id: "chocolate_cake", level: 28, craftingXp: 1100, ingredients: { flour: 1, sugar: 1, cocoa_beans: 1, egg: 1, milk: 1 } },
  { id: "baked_salmon", level: 29, craftingXp: 1200, ingredients: { fish: 1, butter: 1, tomato: 1 } }
]);

const recipesById = new Map(craftingRecipeCatalog.map((recipe) => [recipe.id, recipe]));

export function getCraftingRecipe(recipeId: string): CraftingRecipeDefinition {
  const recipe = recipesById.get(recipeId);
  if (!recipe) {
    throw new HttpsError("invalid-argument", "That recipe is not available.");
  }
  return recipe;
}

export function getCraftingLevelForXp(totalXp: number): number {
  let level = 1;
  let threshold = 0;

  while (level < 1_000) {
    const xpForCurrentLevel = Math.round(100 * Math.pow(1.2, level - 1));
    if (totalXp < threshold + xpForCurrentLevel) return level;
    threshold += xpForCurrentLevel;
    level += 1;
  }

  return level;
}
