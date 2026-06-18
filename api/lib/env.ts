import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string): string {
  return process.env[name] ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  // Google OAuth
  googleClientId: optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET"),
  // Yandex OAuth
  yandexClientId: optional("YANDEX_CLIENT_ID"),
  yandexClientSecret: optional("YANDEX_CLIENT_SECRET"),
  // Cloud Execution
  replitApiKey: optional("REPLIT_API_KEY"),
};

// Helper function to get environment variables
export function getEnv(name: string, defaultValue: string = ""): string {
  return process.env[name] ?? defaultValue;
}
