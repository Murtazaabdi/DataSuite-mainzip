import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sqlQueries } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const sqlRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const items = await db
      .select()
      .from(sqlQueries)
      .where(eq(sqlQueries.userId, ctx.user.id))
      .orderBy(desc(sqlQueries.updatedAt));
    return items;
  }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const items = await db
        .select()
        .from(sqlQueries)
        .where(
          and(
            eq(sqlQueries.id, input.id),
            eq(sqlQueries.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!items.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Query not found" });
      }
      return items[0];
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        queryText: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(sqlQueries).values({
        userId: ctx.user.id,
        name: input.name,
        queryText: input.queryText,
        description: input.description || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        queryText: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;

      await db
        .update(sqlQueries)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(sqlQueries.id, id),
            eq(sqlQueries.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(sqlQueries)
        .where(
          and(
            eq(sqlQueries.id, input.id),
            eq(sqlQueries.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Execute a SQL query against the database
  execute: authedQuery
    .input(z.object({ query: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const startTime = Date.now();
        const query = input.query.toLowerCase().trim();

        // For development/MVP, return mock data
        // In production, connect to actual database
        let mockData = generateMockData(query);

        const executionTime = Date.now() - startTime;

        if (query.startsWith("select")) {
          return {
            success: true,
            rows: mockData.rows,
            columns: mockData.columns,
            rowCount: mockData.rows.length,
            executionTime,
          };
        } else if (query.startsWith("insert")) {
          return {
            success: true,
            rows: [],
            columns: [],
            rowCount: 1,
            message: "1 row(s) inserted successfully",
            executionTime,
          };
        } else if (query.startsWith("update")) {
          return {
            success: true,
            rows: [],
            columns: [],
            rowCount: 1,
            message: "1 row(s) updated successfully",
            executionTime,
          };
        } else if (query.startsWith("delete")) {
          return {
            success: true,
            rows: [],
            columns: [],
            rowCount: 1,
            message: "1 row(s) deleted successfully",
            executionTime,
          };
        }

        return {
          success: true,
          rows: [],
          columns: [],
          rowCount: 0,
          message: "Query executed successfully",
          executionTime,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to execute query",
          rows: [],
          columns: [],
          rowCount: 0,
          executionTime: 0,
        };
      }
    }),

  // Get database schema (list of tables)
  schema: authedQuery.query(async () => {
    return {
      success: true,
      tables: [
        { name: "users", columns: ["id", "unionId", "name", "email", "tier", "status"] },
        { name: "dashboards", columns: ["id", "userId", "title", "description", "isPublic"] },
        { name: "sql_queries", columns: ["id", "userId", "name", "queryText", "description"] },
        { name: "workspaces", columns: ["id", "userId", "title", "contentJson"] },
        { name: "ai_conversations", columns: ["id", "userId", "title"] },
        { name: "ai_messages", columns: ["id", "conversationId", "role", "content"] },
        { name: "ai_usage", columns: ["id", "userId", "model", "tokensUsed"] },
        { name: "audit_logs", columns: ["id", "userId", "action", "entityType", "entityId"] },
      ],
    };
  }),
});

function generateMockData(query: string) {
  // Extract table name from query
  const fromMatch = query.match(/from\s+(\w+)/);
  const tableName = fromMatch ? fromMatch[1] : "data";

  if (tableName.includes("sales") || query.includes("revenue") || query.includes("order")) {
    return {
      columns: ["id", "date", "region", "product", "revenue", "quantity"],
      rows: Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        date: `2024-0${(i % 12) + 1}-15`,
        region: ["North", "South", "East", "West"][i % 4],
        product: ["Product A", "Product B", "Product C", "Product D"][i % 4],
        revenue: Math.floor(Math.random() * 50000) + 10000,
        quantity: Math.floor(Math.random() * 500) + 50,
      })),
    };
  }

  if (tableName.includes("user") || query.includes("customer")) {
    return {
      columns: ["id", "name", "email", "tier", "status", "created_at"],
      rows: Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        name: ["Alice Johnson", "Bob Smith", "Carol White", "David Brown", "Eve Davis", "Frank Miller"][i],
        email: `user${i + 1}@example.com`,
        tier: ["free", "analyst", "data_scientist", "enterprise"][i % 4],
        status: ["approved", "pending", "suspended"][i % 3],
        created_at: `2024-0${(i % 12) + 1}-${10 + i}`,
      })),
    };
  }

  // Default mock data
  return {
    columns: ["id", "name", "value", "category", "created_at"],
    rows: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100,
      category: ["A", "B", "C"][i % 3],
      created_at: `2024-01-${(i % 28) + 1}`,
    })),
  };
}
