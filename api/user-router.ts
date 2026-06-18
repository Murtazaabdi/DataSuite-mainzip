import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export const userRouter = createRouter({
  // Get current user profile
  profile: authedQuery.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // Update profile
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
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  // Setup 2FA TOTP
  setup2FA: authedQuery.query(async ({ ctx }) => {
    // Generate a TOTP secret
    const secret = generateTOTPSecret(ctx.user.name || ctx.user.email || ctx.user.unionId);
    const db = getDb();

    // Store the secret temporarily (not enabled until verified)
    await db
      .update(users)
      .set({
        totpSecret: secret.base32,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id));

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauthUrl,
      qrCodeUrl: secret.qrCodeUrl,
    };
  }),

  // Verify and enable 2FA
  verify2FA: authedQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user.length || !user[0].totpSecret) {
        return { success: false, message: "2FA not initialized" };
      }

      const isValid = verifyTOTP(user[0].totpSecret, input.code);
      if (!isValid) {
        return { success: false, message: "Invalid verification code" };
      }

      await db
        .update(users)
        .set({
          totpEnabled: true,
          totpVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: "2FA enabled successfully" };
    }),

  // Disable 2FA
  disable2FA: authedQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user.length || !user[0].totpSecret || !user[0].totpEnabled) {
        return { success: false, message: "2FA is not enabled" };
      }

      const isValid = verifyTOTP(user[0].totpSecret, input.code);
      if (!isValid) {
        return { success: false, message: "Invalid verification code" };
      }

      await db
        .update(users)
        .set({
          totpSecret: null,
          totpEnabled: false,
          totpVerified: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: "2FA disabled successfully" };
    }),

  // Get 2FA status
  get2FAStatus: authedQuery.query(async ({ ctx }) => {
    return {
      enabled: ctx.user.totpEnabled ?? false,
      verified: ctx.user.totpVerified ?? false,
    };
  }),
});

// ─── TOTP Helper Functions ───
function generateTOTPSecret(accountName: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const label = encodeURIComponent(`DS-PaaS:${accountName}`);
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=DS-PaaS`;

  // Simple QR code data URL (will be generated client-side)
  return {
    base32: secret,
    otpauthUrl,
    qrCodeUrl: otpauthUrl,
  };
}

function verifyTOTP(secret: string, code: string): boolean {
  // Simple TOTP verification using time-based window
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  // Check current window and adjacent windows
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor(now / timeStep) + i;
    const expectedCode = generateTOTPCode(secret, counter);
    if (expectedCode === code) {
      return true;
    }
  }
  return false;
}

function generateTOTPCode(secret: string, counter: number): string {
  // HMAC-SHA1 based TOTP
  const key = base32ToBytes(secret);
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp >>= 8;
  }

  const code = hmacSha1(key, counterBytes);
  const offset = code[code.length - 1] & 0x0f;
  const binary =
    ((code[offset] & 0x7f) << 24) |
    ((code[offset + 1] & 0xff) << 16) |
    ((code[offset + 2] & 0xff) << 8) |
    (code[offset + 3] & 0xff);
  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

function base32ToBytes(base32: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits: number[] = [];
  for (const char of base32.toUpperCase()) {
    const val = chars.indexOf(char);
    if (val === -1) continue;
    for (let i = 4; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  return new Uint8Array(bytes);
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;

  // Pad key to block size
  let paddedKey: Uint8Array;
  if (key.length > blockSize) {
    paddedKey = sha1(key);
  } else {
    paddedKey = new Uint8Array(blockSize);
    paddedKey.set(key);
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }

  // HMAC = hash(o_key_pad || hash(i_key_pad || message))
  const inner = sha1(concatBytes(iKeyPad, message));
  return sha1(concatBytes(oKeyPad, inner));
}

function sha1(data: Uint8Array): Uint8Array {
  // Simplified SHA-1 implementation
  const h0 = 0x67452301;
  const h1 = 0xefcdab89;
  const h2 = 0x98badcfe;
  const h3 = 0x10325476;
  const h4 = 0xc3d2e1f0;

  const originalLength = data.length;
  const paddedLength = Math.ceil((originalLength + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[originalLength] = 0x80;

  const view = new DataView(padded.buffer);
  const lengthBits = BigInt(originalLength * 8);
  view.setBigUint64(paddedLength - 8, lengthBits, false);

  let [a, b, c, d, e] = [h0, h1, h2, h3, h4];

  for (let i = 0; i < paddedLength; i += 64) {
    const w = new Uint32Array(80);
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 80; j++) {
      w[j] = leftRotate(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    }

    let [tA, tB, tC, tD, tE] = [a, b, c, d, e];

    for (let j = 0; j < 80; j++) {
      let f: number, k: number;
      if (j < 20) {
        f = (tB & tC) | (~tB & tD);
        k = 0x5a827999;
      } else if (j < 40) {
        f = tB ^ tC ^ tD;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (tB & tC) | (tB & tD) | (tC & tD);
        k = 0x8f1bbcdc;
      } else {
        f = tB ^ tC ^ tD;
        k = 0xca62c1d6;
      }

      const temp = (leftRotate(tA, 5) + f + tE + k + w[j]) >>> 0;
      [tE, tD, tC, tB, tA] = [tD, tC, leftRotate(tB, 30), tA, temp];
    }

    a = (a + tA) >>> 0;
    b = (b + tB) >>> 0;
    c = (c + tC) >>> 0;
    d = (d + tD) >>> 0;
    e = (e + tE) >>> 0;
  }

  const result = new Uint8Array(20);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, a, false);
  resultView.setUint32(4, b, false);
  resultView.setUint32(8, c, false);
  resultView.setUint32(12, d, false);
  resultView.setUint32(16, e, false);

  return result;
}

function leftRotate(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}
