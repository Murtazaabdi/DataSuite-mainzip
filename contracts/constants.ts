export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
  googleOAuthStart: "/api/oauth/google",
  googleOAuthCallback: "/api/oauth/google/callback",
  yandexOAuthStart: "/api/oauth/yandex",
  yandexOAuthCallback: "/api/oauth/yandex/callback",
} as const;
