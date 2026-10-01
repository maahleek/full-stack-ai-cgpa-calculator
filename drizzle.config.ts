import type { Config } from "drizzle-kit";

// Unlike the old drizzle.config.json, this reads DATABASE_URL from the
// environment at run time — so `npx drizzle-kit push` actually respects
// whatever DATABASE_URL is set in your terminal (local Docker by default,
// or a production URL if you've set $env:DATABASE_URL for that session).
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
    ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1") ? false : "require",
  },
} satisfies Config;
