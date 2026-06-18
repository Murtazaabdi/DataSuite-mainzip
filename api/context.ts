import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Authentication is optional here
    // For development/testing, inject a mock user if no auth is provided
    if (process.env.NODE_ENV === "development") {
      const now = new Date();
      ctx.user = {
        id: 999,
        unionId: "email:test@dev.local",
        name: "Test Developer",
        email: "test@dev.local",
        avatar: null,
        role: "admin",
        tier: "enterprise",
        status: "approved",
        totpSecret: null,
        totpEnabled: false,
        totpVerified: false,
        createdAt: now,
        updatedAt: now,
        lastSignInAt: now,
      } as User;
    }
  }
  return ctx;
}
