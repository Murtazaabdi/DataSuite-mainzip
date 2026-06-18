---
name: 2FA & Auth Design
description: How password and TOTP secrets are stored, and how the two-step login flow works.
---

## Rule
Email user passwords go in `passwordHash` (bcrypt). TOTP secrets go in `totpSecret`. These must never share the same column.

**Why:** The original design reused `totpSecret` for bcrypt password hashes, which made it impossible to enable 2FA without losing the user's password.

## How to apply
- Registration (`auth.register`): hash password → store in `passwordHash`.
- 2FA setup (`user.setup2FA`): generate TOTP secret → store in `totpSecret` (does NOT overwrite `passwordHash`).
- Login step 1 (`auth.loginEmail`): check `passwordHash` (fall back to `totpSecret` for legacy accounts that predate the column). If `totpEnabled`, return `{ requires2FA: true }` without setting a session cookie.
- Login step 2 (`auth.loginTotp`): re-validate password + verify TOTP code → issue session cookie.
- Legacy migration: on first successful `loginEmail` for old accounts, copy `totpSecret` (password hash) to `passwordHash` and clear `totpSecret`.

## Schema
- `passwordHash TEXT` added to both `db/schema.ts` (MySQL) and the SQLite init in `api/queries/connection.ts`.
- SQLite migration uses `ALTER TABLE users ADD COLUMN passwordHash TEXT` in `initializeSqliteSchema` with silent error catch.

## Shared TOTP helpers
All TOTP logic lives in `api/lib/totp.ts` (pure JS HMAC-SHA1, no external dep). Import `generateTOTPSecret` and `verifyTOTP` from there.
