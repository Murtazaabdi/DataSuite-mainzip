import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "data", "oauth-config.json");

export type OAuthProviderConfig = {
  googleClientId?: string;
  googleClientSecret?: string;
  yandexClientId?: string;
  yandexClientSecret?: string;
};

let _cache: OAuthProviderConfig | null = null;

function readConfigFile(): OAuthProviderConfig {
  if (_cache !== null) return _cache;
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    _cache = JSON.parse(raw) as OAuthProviderConfig;
  } catch {
    _cache = {};
  }
  return _cache;
}

function writeConfigFile(config: OAuthProviderConfig) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    _cache = config;
  } catch (e) {
    console.error("[oauth-config] Failed to persist config:", e);
  }
}

export function getGoogleConfig(): { clientId: string; clientSecret: string } {
  const cfg = readConfigFile();
  return {
    clientId: cfg.googleClientId || process.env.GOOGLE_CLIENT_ID || "",
    clientSecret:
      cfg.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || "",
  };
}

export function isGoogleConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleConfig();
  return Boolean(clientId && clientSecret);
}

export function getFullOAuthConfig(): OAuthProviderConfig {
  const cfg = readConfigFile();
  return {
    googleClientId: cfg.googleClientId || process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret:
      cfg.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || "",
    yandexClientId: cfg.yandexClientId || process.env.YANDEX_CLIENT_ID || "",
    yandexClientSecret:
      cfg.yandexClientSecret || process.env.YANDEX_CLIENT_SECRET || "",
  };
}

export function saveOAuthConfig(updates: Partial<OAuthProviderConfig>): OAuthProviderConfig {
  const current = readConfigFile();
  const updated: OAuthProviderConfig = { ...current, ...updates };
  // Remove empty strings to keep file clean
  for (const k of Object.keys(updated) as Array<keyof OAuthProviderConfig>) {
    if (updated[k] === "") delete updated[k];
  }
  writeConfigFile(updated);
  return updated;
}

export function clearCache() {
  _cache = null;
}
