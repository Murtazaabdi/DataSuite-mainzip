import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { signSessionToken } from "../kimi/session";
import { upsertUser } from "../queries/users";

const YANDEX_AUTH_URL = "https://oauth.yandex.com/authorize";
const YANDEX_TOKEN_URL = "https://oauth.yandex.com/token";
const YANDEX_USERINFO_URL = "https://login.yandex.ru/info";

function getRedirectUri(origin: string) {
  return `${origin}/api/oauth/yandex/callback`;
}

export function createYandexOAuthStartHandler() {
  return (c: Context) => {
    if (!env.yandexClientId) {
      return c.json({ error: "Yandex OAuth is not configured" }, 503);
    }
    const origin = new URL(c.req.url).origin;
    const redirectUri = getRedirectUri(origin);
    const params = new URLSearchParams({
      client_id: env.yandexClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state: btoa(origin),
    });
    return c.redirect(`${YANDEX_AUTH_URL}?${params.toString()}`, 302);
  };
}

export function createYandexOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const error = c.req.query("error");
    const state = c.req.query("state");

    if (error || !code) {
      return c.redirect("/login?error=yandex_denied", 302);
    }

    try {
      const origin = state ? atob(state) : new URL(c.req.url).origin;
      const redirectUri = getRedirectUri(origin);

      // Exchange code for access token
      const tokenRes = await fetch(YANDEX_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${env.yandexClientId}:${env.yandexClientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!tokenRes.ok) {
        throw new Error(`Yandex token exchange failed: ${await tokenRes.text()}`);
      }

      const tokens = await tokenRes.json() as { access_token: string };

      // Fetch user profile
      const profileRes = await fetch(`${YANDEX_USERINFO_URL}?format=json`, {
        headers: { Authorization: `OAuth ${tokens.access_token}` },
      });
      if (!profileRes.ok) throw new Error("Failed to fetch Yandex profile");

      const profile = await profileRes.json() as {
        id: string;
        real_name?: string;
        display_name?: string;
        default_email?: string;
        default_avatar_id?: string;
      };

      const unionId = `yandex:${profile.id}`;
      const avatar = profile.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
        : undefined;

      await upsertUser({
        unionId,
        name: profile.real_name ?? profile.display_name ?? "Yandex User",
        email: profile.default_email?.toLowerCase(),
        avatar,
        status: "approved",
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({ unionId, clientId: "yandex" });
      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/dashboard", 302);
    } catch (err) {
      console.error("[Yandex OAuth] Callback failed", err);
      return c.redirect("/login?error=yandex_failed", 302);
    }
  };
}
