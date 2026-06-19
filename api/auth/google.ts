import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { signSessionToken } from "../kimi/session";
import { upsertUser } from "../queries/users";
import { getGoogleConfig, isGoogleConfigured } from "../lib/oauth-config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const SCOPES = "openid email profile";

function getRedirectUri(origin: string) {
  return `${origin}/api/oauth/google/callback`;
}

export function createGoogleOAuthStartHandler() {
  return (c: Context) => {
    if (!isGoogleConfigured()) {
      return c.json({ error: "Google OAuth is not configured" }, 503);
    }
    const { clientId } = getGoogleConfig();
    const origin = new URL(c.req.url).origin;
    const redirectUri = getRedirectUri(origin);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "select_account",
      state: btoa(origin),
    });
    return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`, 302);
  };
}

export function createGoogleOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const error = c.req.query("error");
    const state = c.req.query("state");

    if (error || !code) {
      return c.redirect("/login?error=google_denied", 302);
    }

    try {
      const { clientId, clientSecret } = getGoogleConfig();
      const origin = state ? atob(state) : new URL(c.req.url).origin;
      const redirectUri = getRedirectUri(origin);

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
      }

      const tokens = (await tokenRes.json()) as { access_token: string };

      const profileRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!profileRes.ok) throw new Error("Failed to fetch Google profile");

      const profile = (await profileRes.json()) as {
        sub: string;
        name?: string;
        email?: string;
        picture?: string;
      };

      const unionId = `google:${profile.sub}`;

      await upsertUser({
        unionId,
        name: profile.name ?? profile.email ?? "Google User",
        email: profile.email?.toLowerCase(),
        avatar: profile.picture,
        status: "approved",
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({ unionId, clientId: "google" });
      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/dashboard", 302);
    } catch (err) {
      console.error("[Google OAuth] Callback failed", err);
      return c.redirect("/login?error=google_failed", 302);
    }
  };
}
