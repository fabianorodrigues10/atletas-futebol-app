import * as Linking from "expo-linking";
import * as ReactNative from "react-native";
import Constants from "expo-constants";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const bundleId = "space.manus.atletas_futebol_app.t20260216110851";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL by deriving from the current connection.
 * 
 * Strategy:
 * 1. On web: Replace port 8081 with 3000 in the hostname
 * 2. On native (Expo Go): Use hardcoded URL (works reliably in Manus environment)
 */
export function getApiBaseUrl(): string {
  console.log('[getApiBaseUrl] Platform:', ReactNative.Platform.OS);
  
  // On web, derive from current hostname by replacing port 8081 with 3000
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    console.log('[getApiBaseUrl] Web hostname:', hostname);
    
    // Handle local development: 127.0.0.1:8081 -> 127.0.0.1:3000
    if (hostname.includes("127.0.0.1") || hostname.includes("localhost")) {
      return `${protocol}//127.0.0.1:3000`;
    }
    
    // Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      console.log('[getApiBaseUrl] Derived API hostname:', apiHostname);
      return `${protocol}//${apiHostname}`;
    }
  }

  // On native (Expo Go), use hardcoded URL - this is the most reliable approach
  if (ReactNative.Platform.OS !== "web") {
    const hardcodedApiUrl = "https://3000-ibvr91xzqokolokpeserq-cc9ce21a.us1.manus.computer";
    console.log('[getApiBaseUrl] Using hardcoded API URL for native:', hardcodedApiUrl);
    return hardcodedApiUrl;
  }

  // Fallback to environment variable if set
  if (API_BASE_URL && API_BASE_URL.trim()) {
    console.log('[getApiBaseUrl] Using API_BASE_URL env:', API_BASE_URL);
    return API_BASE_URL.replace(/\/$/, "");
  }

  // Final fallback
  return "https://3000-ibvr91xzqokolokpeserq-cc9ce21a.us1.manus.computer";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

/**
 * Get the redirect URI for OAuth callback.
 * - Web: uses API server callback endpoint
 * - Native: uses deep link scheme
 */
export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/oauth/callback`;
  } else {
    return Linking.createURL("/oauth/callback", {
      scheme: env.deepLinkScheme,
    });
  }
};

export const getLoginUrl = () => {
  const redirectUri = getRedirectUri();
  const state = encodeState(redirectUri);

  const url = new URL(`${OAUTH_PORTAL_URL}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Start OAuth login flow.
 *
 * On native platforms (iOS/Android), open the system browser directly so
 * the OAuth callback returns via deep link to the app.
 *
 * On web, this simply redirects to the login URL.
 *
 * @returns Always null, the callback is handled via deep link.
 */
export async function startOAuthLogin(): Promise<string | null> {
  const loginUrl = getLoginUrl();

  if (ReactNative.Platform.OS === "web") {
    // On web, just redirect
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
    return null;
  }

  const supported = await Linking.canOpenURL(loginUrl);
  if (!supported) {
    console.warn("[OAuth] Cannot open login URL: URL scheme not supported");
    return null;
  }

  try {
    await Linking.openURL(loginUrl);
  } catch (error) {
    console.error("[OAuth] Failed to open login URL:", error);
  }

  return null;
}
