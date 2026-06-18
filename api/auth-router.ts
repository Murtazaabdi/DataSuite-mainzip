import * as cookie from "cookie";
import { z } from "zod/v4";
import * as bcrypt from "bcryptjs";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { upsertUser, findUserByEmail, findUserByUnionId } from "./queries/users";
import { env } from "./lib/env";

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

      // Check if account already exists
      const existing = await findUserByUnionId(unionId);
      if (existing) {
        throw new Error("An account with this email already exists.");
      }

      // bcrypt hash stored in totpSecret (repurposed for email-auth users)
      const passwordHash = await bcrypt.hash(input.password, 12);

      await upsertUser({
        unionId,
        name: input.name.trim(),
        email,
        totpSecret: passwordHash,
        status: "approved",
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({ unionId, clientId: "local" });
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

      return { success: true };
    }),

  /** Sign in with email + password */
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

      // Must exist and be an email-registered user (unionId starts with "email:")
      if (!user || !user.unionId.startsWith("email:") || !user.totpSecret) {
        throw new Error("Invalid email or password.");
      }

      const valid = await bcrypt.compare(input.password, user.totpSecret);
      if (!valid) {
        throw new Error("Invalid email or password.");
      }

      if (user.status === "suspended") {
        throw new Error("Your account has been suspended. Contact support.");
      }

      const token = await signSessionToken({
        unionId: user.unionId,
        clientId: "local",
      });

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

      return { success: true };
    }),

  /** Check which OAuth providers are configured */
  oauthProviders: publicQuery.query(() => ({
    google: !!env.googleClientId,
    yandex: !!env.yandexClientId,
    kimi: !!env.appId && !!env.kimiAuthUrl,
  })),
});
