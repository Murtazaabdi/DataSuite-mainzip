import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getEnv } from "./lib/env";

async function testDatabaseConnection(params: {
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const start = Date.now();

  try {
    if (params.type === "postgresql") {
      try {
        const { Client } = await import("pg" as any);
        const client = new Client({
          host: params.host,
          port: params.port,
          database: params.database,
          user: params.username,
          password: params.password,
          connectionTimeoutMillis: 5000,
          ssl: { rejectUnauthorized: false },
        });
        await client.connect();
        await client.query("SELECT 1");
        await client.end();
        return { success: true, message: "Connected", latencyMs: Date.now() - start };
      } catch {
        // pg not installed — simulate success for UI testing
        throw new Error("PostgreSQL client not installed. Run: npm install pg");
      }
    }

    if (params.type === "mysql") {
      const mysql2 = await import("mysql2/promise");
      const conn = await mysql2.createConnection({
        host: params.host,
        port: params.port,
        database: params.database,
        user: params.username,
        password: params.password,
        connectTimeout: 5000,
      });
      await conn.query("SELECT 1");
      await conn.end();
      return { success: true, message: "Connected", latencyMs: Date.now() - start };
    }

    // Other DB types — check basic connectivity
    const net = await import("net");
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection(params.port, params.host);
      socket.setTimeout(5000);
      socket.on("connect", () => { socket.destroy(); resolve(); });
      socket.on("error", reject);
      socket.on("timeout", () => reject(new Error("Connection timeout")));
    });
    return { success: true, message: `Reached ${params.host}:${params.port}`, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { success: false, message: error.message || "Connection failed" };
  }
}

async function fetchGoogleSheet(sheetId: string, tab: string): Promise<{
  columns: string[];
  rows: Record<string, unknown>[];
  meta: { sheetId: string; tab: string; total: number };
}> {
  const apiKey = getEnv("GOOGLE_SHEETS_API_KEY", "");
  const range = encodeURIComponent(`${tab}!A1:ZZ10000`);

  let url: string;
  if (apiKey) {
    url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  } else {
    // Try public CSV export
    url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}. Make sure the sheet is public or set GOOGLE_SHEETS_API_KEY.`);
  }

  if (apiKey) {
    const data = await response.json() as { values?: string[][] };
    const values = data.values ?? [];
    if (values.length === 0) return { columns: [], rows: [], meta: { sheetId, tab, total: 0 } };
    const columns = values[0];
    const rows = values.slice(1).map(row =>
      Object.fromEntries(columns.map((col, i) => [col, row[i] ?? ""]))
    );
    return { columns, rows, meta: { sheetId, tab, total: rows.length } };
  } else {
    // Parse CSV
    const text = await response.text();
    const lines = text.trim().split("\n").map(l =>
      l.split(",").map(v => v.replace(/^"|"$/g, "").trim())
    );
    if (lines.length === 0) return { columns: [], rows: [], meta: { sheetId, tab, total: 0 } };
    const columns = lines[0];
    const rows = lines.slice(1).map(row =>
      Object.fromEntries(columns.map((col, i) => [col, row[i] ?? ""]))
    );
    return { columns, rows, meta: { sheetId, tab, total: rows.length } };
  }
}

export const datasourcesRouter = createRouter({
  testConnection: authedQuery
    .input(z.object({
      type: z.string(),
      host: z.string(),
      port: z.number().optional().default(5432),
      database: z.string(),
      username: z.string(),
      password: z.string().optional().default(""),
    }))
    .mutation(async ({ input }) => {
      const result = await testDatabaseConnection(input as any);
      if (!result.success) {
        throw new Error(result.message);
      }
      return { success: true, message: result.message, latencyMs: result.latencyMs };
    }),

  fetchGoogleSheet: authedQuery
    .input(z.object({
      sheetId: z.string().min(1),
      tab: z.string().default("Sheet1"),
    }))
    .mutation(async ({ input }) => {
      return await fetchGoogleSheet(input.sheetId, input.tab);
    }),

  getEnvStatus: authedQuery.query(async () => {
    return {
      hasGoogleSheetsKey: !!getEnv("GOOGLE_SHEETS_API_KEY", ""),
      hasGeminiKey: !!getEnv("GEMINI_API_KEY", ""),
      hasGoogleOAuth: !!(getEnv("GOOGLE_CLIENT_ID", "") && getEnv("GOOGLE_CLIENT_SECRET", "")),
    };
  }),
});
