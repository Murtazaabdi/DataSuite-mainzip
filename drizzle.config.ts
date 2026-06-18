import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isDevelopment = process.env.NODE_ENV !== "production" && process.env.USE_SQLITE !== "false";

const config = isDevelopment
  ? defineConfig({
      schema: "./db/schema.ts",
      out: "./db/migrations",
      dialect: "sqlite",
      dbCredentials: {
        url: "file:datasuite.db",
      },
    })
  : defineConfig({
      schema: "./db/schema.ts",
      out: "./db/migrations",
      dialect: "mysql",
      dbCredentials: {
        url: process.env.DATABASE_URL || "",
      },
    });

export default config;
