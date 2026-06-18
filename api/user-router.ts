import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { generateTOTPSecret, verifyTOTP } from "./lib/totp";

export const userRouter = createRouter({
  profile: authedQuery.query(async ({ ctx }) => {
    return ctx.user;
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  /** Generate a TOTP secret and return QR code URL (does NOT enable 2FA yet) */
  setup2FA: authedQuery.query(async ({ ctx }) => {
    const secret = generateTOTPSecret(ctx.user.name || ctx.user.email || ctx.user.unionId);
    const db = getDb();

    // Store the pending TOTP secret (totpEnabled stays false until verified)
    await db
      .update(users)
      .set({ totpSecret: secret.base32, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauthUrl,
      qrCodeUrl: secret.qrCodeUrl,
    };
  }),

  /** Confirm the TOTP code and enable 2FA */
  verify2FA: authedQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!rows.length || !rows[0].totpSecret) {
        return { success: false, message: "2FA not initialized. Please start setup again." };
      }

      const row = rows[0];
      const isValid = verifyTOTP(row.totpSecret, input.code);
      if (!isValid) {
        return { success: false, message: "Invalid verification code. Please try again." };
      }

      // Migrate legacy password storage: if totpSecret was the bcrypt hash, move it to passwordHash first
      // (Only applies to email users who registered before the passwordHash column was added)
      const updates: Record<string, any> = {
        totpEnabled: true,
        totpVerified: true,
        updatedAt: new Date(),
      };
      // The totpSecret here is the TOTP base32 secret we just stored in setup2FA, so keep it.
      // Ensure passwordHash is set for email users (migrate legacy if needed)
      if (!row.passwordHash && row.unionId.startsWith("email:") && row.totpSecret && !row.totpEnabled) {
        // This shouldn't happen in normal flow since setup2FA already overwrote totpSecret,
        // but just in case: don't migrate here — it was already migrated during loginEmail.
      }

      await db.update(users).set(updates).where(eq(users.id, ctx.user.id));
      return { success: true, message: "2FA enabled successfully." };
    }),

  /** Disable 2FA after verifying the current code */
  disable2FA: authedQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

      if (!rows.length || !rows[0].totpEnabled || !rows[0].totpSecret) {
        return { success: false, message: "2FA is not enabled." };
      }

      const isValid = verifyTOTP(rows[0].totpSecret, input.code);
      if (!isValid) {
        return { success: false, message: "Invalid verification code." };
      }

      await db
        .update(users)
        .set({ totpSecret: null as any, totpEnabled: false, totpVerified: false, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: "2FA disabled successfully." };
    }),

  get2FAStatus: authedQuery.query(async ({ ctx }) => {
    return {
      enabled: ctx.user.totpEnabled ?? false,
      verified: ctx.user.totpVerified ?? false,
    };
  }),
});
