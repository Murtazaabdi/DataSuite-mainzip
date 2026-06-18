import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const normalised = email.toLowerCase().trim();
  // Email-registered users have unionId = "email:<email>"
  return findUserByUnionId(`email:${normalised}`);
}

export async function upsertUser(data: InsertUser) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Helper to convert any value to ISO string
  const toISOString = (val: any): string => {
    if (!val) return nowISO;
    if (typeof val === 'string') return val;
    if (val instanceof Date) return val.toISOString();
    return nowISO;
  };
  
  const values: any = {
    ...data,
    createdAt: toISOString(data.createdAt),
    updatedAt: toISOString(data.updatedAt),
    lastSignInAt: toISOString(data.lastSignInAt),
  };
  const db = getDb();

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
  }

  try {
    // Try MySQL onDuplicateKeyUpdate first
    await (db as any)
      .insert(schema.users)
      .values(values)
      .onDuplicateKeyUpdate({ set: values });
  } catch (err: any) {
    // Fall back to SQLite onConflict
    if (err.message && (err.message.includes("is not a function") || err.message.includes("no such function") || err.message.includes("can only bind"))) {
      // For SQLite, try to insert first, then update if it fails
      try {
        await db.insert(schema.users).values(values);
      } catch (insertErr: any) {
        if (insertErr.message && insertErr.message.includes("UNIQUE")) {
          // Update the existing record
          await db
            .update(schema.users)
            .set({
              ...values,
              updatedAt: nowISO,
            })
            .where(eq(schema.users.unionId, values.unionId!));
        } else {
          throw insertErr;
        }
      }
    } else {
      throw err;
    }
  }
}
