import { drizzle } from "drizzle-orm/mysql2";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import Database from "better-sqlite3";

const fullSchema = { ...schema, ...relations };

let instance: any;

function initializeSqliteSchema(db: Database.Database) {
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unionId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      tier TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'pending',
      passwordHash TEXT,
      totpSecret TEXT,
      totpEnabled INTEGER NOT NULL DEFAULT 0,
      totpVerified INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastSignInAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT,
      metadata TEXT,
      ipAddress TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS dashboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      layoutJson TEXT,
      widgetsJson TEXT,
      isPublic INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sql_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      queryText TEXT NOT NULL,
      description TEXT,
      resultSchema TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      contentJson TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversationId) REFERENCES ai_conversations(id)
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      model TEXT,
      tokensUsed INTEGER,
      costUsd REAL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `;

  const statements = createTablesSql.split(';').filter(s => s.trim());
  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        console.error('Error creating table:', err.message);
      }
    }
  }

  // Migrations for existing tables (safe: ALTER TABLE … ADD COLUMN IF NOT EXISTS is unsupported in SQLite,
  // so we catch the "duplicate column" error and ignore it)
  const migrations = [
    `ALTER TABLE users ADD COLUMN passwordHash TEXT`,
  ];
  for (const m of migrations) {
    try { db.exec(m); } catch (_) { /* column already exists — ignore */ }
  }
}

export function getDb() {
  if (!instance) {
    const isDevelopment = !env.isProduction && process.env.USE_SQLITE !== "false";
    
    if (isDevelopment) {
      try {
        // Use SQLite for development (local file-based database)
        const db = new Database("datasuite.db");
        initializeSqliteSchema(db);
        instance = drizzleSqlite(db, { schema: fullSchema });
        console.log("✅ Connected to SQLite database (development mode)");
      } catch (err) {
        console.error("Failed to create SQLite database, falling back to MySQL:", err);
        instance = drizzle(env.databaseUrl, {
          mode: "planetscale",
          schema: fullSchema,
        });
      }
    } else {
      // Production: Use cloud MySQL (PlanetScale)
      // DATABASE_URL format: mysql://user:password@host/database?sslaccept=skip
      instance = drizzle(env.databaseUrl, {
        mode: "planetscale",
        schema: fullSchema,
      });
      console.log("✅ Connected to cloud MySQL database (PlanetScale)");
    }
  }
  return instance;
}
