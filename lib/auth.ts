import type { NextRequest } from "next/server";

export const authCookieName = "audio_review_session";

const encoder = new TextEncoder();
const sessionTtlSeconds = 60 * 60 * 24 * 7;

type SessionPayload = {
  username: string;
  exp: number;
};

function base64UrlEncode(input: string | ArrayBuffer) {
  const bytes = typeof input === "string" ? encoder.encode(input) : new Uint8Array(input);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return atob(padded);
}

function timingSafeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return diff === 0;
}

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return base64UrlEncode(signature);
}

export function getAuthConfig() {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!username || !password || !secret) {
    throw new Error("AUTH_USERNAME, AUTH_PASSWORD, and AUTH_SECRET must be configured.");
  }

  return { username, password, secret };
}

export function getSessionMaxAge() {
  return sessionTtlSeconds;
}

export async function createSessionToken(username: string) {
  const { secret } = getAuthConfig();
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const { username, secret } = getAuthConfig();
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await signPayload(payload, secret);

  if (!timingSafeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);

    return parsed.username === username && typeof parsed.exp === "number" && parsed.exp > now;
  } catch {
    return false;
  }
}

export async function isAuthenticated(request: NextRequest) {
  try {
    return await verifySessionToken(request.cookies.get(authCookieName)?.value);
  } catch {
    return false;
  }
}
