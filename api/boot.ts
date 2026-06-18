import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { createGoogleOAuthStartHandler, createGoogleOAuthCallbackHandler } from "./auth/google";
import { createYandexOAuthStartHandler, createYandexOAuthCallbackHandler } from "./auth/yandex";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Kimi OAuth
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Google OAuth
app.get(Paths.googleOAuthStart, createGoogleOAuthStartHandler());
app.get(Paths.googleOAuthCallback, createGoogleOAuthCallbackHandler());

// Yandex OAuth
app.get(Paths.yandexOAuthStart, createYandexOAuthStartHandler());
app.get(Paths.yandexOAuthCallback, createYandexOAuthCallbackHandler());

// tRPC
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
