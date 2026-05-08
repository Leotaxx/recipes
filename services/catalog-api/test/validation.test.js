import assert from "node:assert/strict";
import test from "node:test";
import { recipeSchema } from "../src/app.js";

test("accepts a valid recipe payload", () => {
  const parsed = recipeSchema.safeParse({
    title: "Veggie Tacos",
    cuisine: "Mexican",
    difficulty: "easy",
    ingredients: ["tortilla", "beans"],
    steps: "Warm tortillas, fill with beans and vegetables."
  });

  assert.equal(parsed.success, true);
});

test("rejects unsupported difficulty values", () => {
  const parsed = recipeSchema.safeParse({
    title: "Veggie Tacos",
    cuisine: "Mexican",
    difficulty: "extreme",
    ingredients: ["tortilla", "beans"],
    steps: "Warm tortillas, fill with beans and vegetables."
  });

  assert.equal(parsed.success, false);
});
