import cors from "cors";
import express from "express";
import { z } from "zod";

export const recipeSchema = z.object({
  title: z.string().min(2).max(120),
  cuisine: z.string().min(2).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]),
  ingredients: z.array(z.string().min(1)).min(1),
  steps: z.string().min(10).max(2000)
});

export function createApp(pool) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "catalog-api" });
  });

  app.get("/recipes", async (req, res) => {
    const { cuisine } = req.query;
    const result = cuisine
      ? await pool.query("SELECT * FROM recipes WHERE lower(cuisine) = lower($1) ORDER BY id DESC", [cuisine])
      : await pool.query("SELECT * FROM recipes ORDER BY id DESC");
    res.json(result.rows);
  });

  app.get("/recipes/:id", async (req, res) => {
    const result = await pool.query("SELECT * FROM recipes WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    res.json(result.rows[0]);
  });

  app.post("/recipes", async (req, res) => {
    const parsed = recipeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid recipe", details: parsed.error.flatten() });
      return;
    }

    const recipe = parsed.data;
    const result = await pool.query(
      `INSERT INTO recipes (title, cuisine, difficulty, ingredients, steps)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [recipe.title, recipe.cuisine, recipe.difficulty, recipe.ingredients, recipe.steps]
    );
    res.status(201).json(result.rows[0]);
  });

  app.delete("/recipes/:id", async (req, res) => {
    const result = await pool.query("DELETE FROM recipes WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    res.status(204).end();
  });

  return app;
}
