import * as cookie from "cookie";
import { z } from "zod/v4";
import * as bcrypt from "bcryptjs";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { upsertUser, findUserByEmail, findUserByUnionId } from "./queries/users";
import { env } from "./lib/env";
import { verifyTOTP } from "./lib/totp";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

function setSessionCookie(ctx: { resHeaders: Headers; req: Request }, token: string) {
  const cookieOpts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: cookieOpts.httpOnly,
      path: cookieOpts.path,
      sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "none",
      secure: cookieOpts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  /** Register a new user with email + password */
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(8).max(128),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      const unionId = `email:${email}`;

      const existing = await findUserByUnionId(unionId);
      if (existing) {
        throw new Error("An account with this email already exists.");
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      await upsertUser({
        unionId,
        name: input.name.trim(),
        email,
        passwordHash,
        status: "approved",
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({ unionId, clientId: "local" });
      setSessionCookie(ctx, token);
      return { success: true, requires2FA: false };
    }),

  /**
   * Sign in with email + password.
   * Returns requires2FA=true if the user has TOTP enabled —
   * caller must then call loginTotp with the 6-digit code.
   */
  loginEmail: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);

      if (!user || !user.unionId.startsWith("email:")) {
        throw new Error("Invalid email or password.");
      }

      const db = getDb();
      const dbRows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      if (!dbRows.length) throw new Error("Invalid email or password.");
      const row = dbRows[0];

      // Support legacy accounts where password was stored in totpSecret field
      const hashToCheck = row.passwordHash || (row.totpEnabled ? null : row.totpSecret);
      if (!hashToCheck) throw new Error("Invalid email or password.");

      const valid = await bcrypt.compare(input.password, hashToCheck);
      if (!valid) throw new Error("Invalid email or password.");

      if (row.status === "suspended") {
        throw new Error("Your account has been suspended. Contact support.");
      }

      // Migrate legacy accounts: copy totpSecret (used as password) to passwordHash
      if (!row.passwordHash && row.totpSecret && !row.totpEnabled) {
        await db.update(users).set({ passwordHash: row.totpSecret, totpSecret: null as any }).where(eq(users.id, row.id));
      }

      // If 2FA is enabled, do NOT issue a session — signal client to collect TOTP code
      if (row.totpEnabled) {
        return { success: true, requires2FA: true };
      }

      const token = await signSessionToken({ unionId: user.unionId, clientId: "local" });
      setSessionCookie(ctx, token);
      return { success: true, requires2FA: false };
    }),

  /**
   * Second step of login when 2FA is enabled.
   * Re-validates password + verifies TOTP code, then issues session.
   */
  loginTotp: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
        totpCode: z.string().length(6),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);

      if (!user || !user.unionId.startsWith("email:")) {
        throw new Error("Invalid credentials.");
      }

      const db = getDb();
      const dbRows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      if (!dbRows.length) throw new Error("Invalid credentials.");
      const row = dbRows[0];

      const hashToCheck = row.passwordHash || (row.totpEnabled ? null : row.totpSecret);
      if (!hashToCheck) throw new Error("Invalid credentials.");

      const passwordValid = await bcrypt.compare(input.password, hashToCheck);
      if (!passwordValid) throw new Error("Invalid credentials.");

      if (row.status === "suspended") {
        throw new Error("Your account has been suspended. Contact support.");
      }

      if (!row.totpEnabled || !row.totpSecret) {
        throw new Error("2FA is not enabled for this account.");
      }

      const totpValid = verifyTOTP(row.totpSecret, input.totpCode);
      if (!totpValid) {
        throw new Error("Invalid authenticator code. Please try again.");
      }

      const token = await signSessionToken({ unionId: user.unionId, clientId: "local" });
      setSessionCookie(ctx, token);
      return { success: true };
    }),

  /** Check which OAuth providers are configured */
  oauthProviders: publicQuery.query(() => ({
    google: !!env.googleClientId,
    yandex: !!env.yandexClientId,
    kimi: !!env.appId && !!env.kimiAuthUrl,
  })),
});
