import { createApp } from "./app.js";
import { createPool, migrate } from "./db.js";

const port = Number(process.env.PORT || 3001);
const pool = createPool();

await migrate(pool);

const server = createApp(pool).listen(port, () => {
  console.log(`catalog-api listening on ${port}`);
});

process.on("SIGTERM", async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});

