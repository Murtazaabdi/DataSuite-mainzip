import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { dashboards } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const dashboardRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const items = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.userId, ctx.user.id))
      .orderBy(desc(dashboards.updatedAt));
    return items;
  }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const items = await db
        .select()
        .from(dashboards)
        .where(
          and(
            eq(dashboards.id, input.id),
            eq(dashboards.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!items.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dashboard not found" });
      }
      return items[0];
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(dashboards).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description || null,
        layoutJson: [],
        widgetsJson: [],
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        layoutJson: z.any().optional(),
        widgetsJson: z.any().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;

      await db
        .update(dashboards)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dashboards.id, id),
            eq(dashboards.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(dashboards)
        .where(
          and(
            eq(dashboards.id, input.id),
            eq(dashboards.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
