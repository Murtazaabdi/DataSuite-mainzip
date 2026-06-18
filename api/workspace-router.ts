import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { workspaces } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const workspaceRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const items = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, ctx.user.id))
      .orderBy(desc(workspaces.updatedAt));
    return items;
  }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const items = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.id, input.id),
            eq(workspaces.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!items.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }
      return items[0];
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        contentJson: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(workspaces).values({
        userId: ctx.user.id,
        title: input.title,
        contentJson: input.contentJson || { blocks: [] },
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        contentJson: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;

      await db
        .update(workspaces)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(workspaces.id, id),
            eq(workspaces.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(workspaces)
        .where(
          and(
            eq(workspaces.id, input.id),
            eq(workspaces.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
