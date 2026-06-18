import { authRouter } from "./auth-router";
import { aiRouter } from "./ai-router";
import { adminRouter } from "./admin-router";
import { userRouter } from "./user-router";
import { dashboardRouter } from "./dashboard-router";
import { workspaceRouter } from "./workspace-router";
import { sqlRouter } from "./sql-router";
import { codeRouter } from "./code-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  ai: aiRouter,
  admin: adminRouter,
  user: userRouter,
  dashboard: dashboardRouter,
  workspace: workspaceRouter,
  sql: sqlRouter,
  code: codeRouter,
});

export type AppRouter = typeof appRouter;
