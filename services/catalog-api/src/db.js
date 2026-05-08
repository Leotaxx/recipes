import pg from "pg";

const { Pool } = pg;

export function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false
  });
}

export async function migrate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
      ingredients TEXT[] NOT NULL DEFAULT '{}',
      steps TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM recipes");
  if (rows[0].count === 0) {
    await pool.query(
      `INSERT INTO recipes (title, cuisine, difficulty, ingredients, steps)
       VALUES
       ($1, $2, $3, $4, $5),
       ($6, $7, $8, $9, $10),
       ($11, $12, $13, $14, $15)`,
      [
        "Tomato Pasta",
        "Italian",
        "easy",
        ["pasta", "tomato", "garlic", "basil"],
        "Boil pasta, simmer tomato sauce, combine and serve.",
        "Chickpea Curry",
        "Indian",
        "medium",
        ["chickpeas", "onion", "curry powder", "spinach"],
        "Cook aromatics, add chickpeas and spices, simmer until thick.",
        "Miso Noodle Bowl",
        "Japanese",
        "easy",
        ["noodles", "miso", "mushrooms", "spring onion"],
        "Whisk miso broth, cook noodles, add vegetables and garnish."
      ]
    );
  }
}

