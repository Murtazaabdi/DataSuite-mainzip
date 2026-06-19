import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, auditLogs, aiUsage } from "@db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import {
  getFullOAuthConfig,
  saveOAuthConfig,
  clearCache,
  isGoogleConfigured,
} from "./lib/oauth-config";

export const adminRouter = createRouter({
  // ── Dashboard Stats ──
  stats: adminQuery.query(async () => {
    const db = getDb();
    const [
      totalUsers,
      pendingUsers,
      adminUsers,
      todayLogins,
    ] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(users),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(eq(users.status, "pending")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(eq(users.role, "admin")),
      (async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${users.id})` })
          .from(users)
          .where(gte(users.lastSignInAt, today));
        return result;
      })(),
    ]);

    // Get AI usage stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [aiToday, aiTotal] = await Promise.all([
      db
        .select({ count: sql<number>`COALESCE(SUM(${aiUsage.messageCount}), 0)` })
        .from(aiUsage)
        .where(gte(aiUsage.createdAt, today)),
      db
        .select({ count: sql<number>`COALESCE(SUM(${aiUsage.messageCount}), 0)` })
        .from(aiUsage),
    ]);

    return {
      totalUsers: totalUsers[0]?.count ?? 0,
      pendingUsers: pendingUsers[0]?.count ?? 0,
      adminUsers: adminUsers[0]?.count ?? 0,
      todayLogins: todayLogins[0]?.count ?? 0,
      aiUsageToday: aiToday[0]?.count ?? 0,
      aiUsageTotal: aiTotal[0]?.count ?? 0,
    };
  }),

  // ── List Users ──
  listUsers: adminQuery
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
        role: z.enum(["user", "admin"]).optional(),
        tier: z.enum(["free", "analyst", "data_scientist", "enterprise"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];

      if (input?.status) {
        filters.push(eq(users.status, input.status));
      }
      if (input?.role) {
        filters.push(eq(users.role, input.role));
      }
      if (input?.tier) {
        filters.push(eq(users.tier, input.tier));
      }

      let query = db.select().from(users);
      let countQuery = db.select({ count: sql<number>`COUNT(*)` }).from(users);

      if (filters.length > 0) {
        const whereClause = and(...filters);
        query = query.where(whereClause) as typeof query;
        countQuery = countQuery.where(whereClause) as typeof countQuery;
      }

      const [userList, totalCount] = await Promise.all([
        query
          .orderBy(desc(users.createdAt))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0),
        countQuery,
      ]);

      return {
        users: userList,
        total: totalCount[0]?.count ?? 0,
      };
    }),

  // ── Update User Status ──
  updateUser: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
        role: z.enum(["user", "admin"]).optional(),
        tier: z.enum(["free", "analyst", "data_scientist", "enterprise"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;

      await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      // Log audit
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "USER_UPDATED",
        entityType: "user",
        entityId: String(id),
        metadata: updates,
      });

      return { success: true };
    }),

  // ── Approve User ──
  approveUser: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(users.id, input.id));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "USER_APPROVED",
        entityType: "user",
        entityId: String(input.id),
      });

      return { success: true };
    }),

  // ── Reject User ──
  rejectUser: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(users.id, input.id));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "USER_REJECTED",
        entityType: "user",
        entityId: String(input.id),
      });

      return { success: true };
    }),

  // ── Suspend User ──
  suspendUser: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(users.id, input.id));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "USER_SUSPENDED",
        entityType: "user",
        entityId: String(input.id),
      });

      return { success: true };
    }),

  // ── Audit Logs ──
  listAuditLogs: adminQuery
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        action: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      let query = db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          metadata: auditLogs.metadata,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .orderBy(desc(auditLogs.createdAt));

      if (input?.action) {
        query = query.where(eq(auditLogs.action, input.action)) as typeof query;
      }

      const logs = await query.limit(input?.limit ?? 50).offset(input?.offset ?? 0);
      return logs;
    }),

  // ── AI Usage Overview ──
  aiUsageOverview: adminQuery.query(async () => {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [daily, topUsers, models] = await Promise.all([
      db
        .select({ count: sql<number>`COALESCE(SUM(${aiUsage.messageCount}), 0)` })
        .from(aiUsage)
        .where(gte(aiUsage.createdAt, today)),
      db
        .select({
          userId: aiUsage.userId,
          name: users.name,
          email: users.email,
          count: sql<number>`COALESCE(SUM(${aiUsage.messageCount}), 0)`,
        })
        .from(aiUsage)
        .leftJoin(users, eq(aiUsage.userId, users.id))
        .groupBy(aiUsage.userId)
        .orderBy(sql`count DESC`)
        .limit(10),
      db
        .select({
          model: aiUsage.model,
          count: sql<number>`COALESCE(SUM(${aiUsage.messageCount}), 0)`,
        })
        .from(aiUsage)
        .groupBy(aiUsage.model)
        .orderBy(sql`count DESC`),
    ]);

    return {
      daily: daily[0]?.count ?? 0,
      topUsers,
      models,
    };
  }),

  // ── OAuth Configuration ──
  getOAuthConfig: adminQuery.query(async () => {
    const config = getFullOAuthConfig();
    return {
      google: {
        clientId: config.googleClientId || "",
        clientSecretMasked: config.googleClientSecret
          ? `${config.googleClientSecret.slice(0, 4)}${"•".repeat(Math.max(0, (config.googleClientSecret.length || 12) - 4))}`
          : "",
        configured: isGoogleConfigured(),
      },
    };
  }),

  saveGoogleOAuth: adminQuery
    .input(
      z.object({
        clientId: z.string().min(1, "Client ID is required"),
        clientSecret: z.string().min(1, "Client Secret is required"),
      })
    )
    .mutation(async ({ input }) => {
      saveOAuthConfig({
        googleClientId: input.clientId.trim(),
        googleClientSecret: input.clientSecret.trim(),
      });
      clearCache();
      return { success: true };
    }),

  clearGoogleOAuth: adminQuery.mutation(async () => {
    saveOAuthConfig({ googleClientId: "", googleClientSecret: "" });
    clearCache();
    return { success: true };
  }),
});
