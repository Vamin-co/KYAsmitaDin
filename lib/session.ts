// HMAC-signed session cookie (no DB session store; payload is small + verifiable).
import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "ky_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  delegateId: string;
  misId: string;
  iat: number;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(payloadB64: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(payloadB64).digest());
}

export function createToken(payload: Omit<SessionPayload, "iat">): string {
  const full: SessionPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(full)));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const json = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    const parsed = JSON.parse(json) as SessionPayload;
    if (!parsed.delegateId || !parsed.misId) return null;
    return parsed;
  } catch {
    return null;
  }
}

// For use in Route Handlers / Server Actions (where cookies are mutable).
export async function setSessionCookie(payload: Omit<SessionPayload, "iat">): Promise<void> {
  const jar = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  jar.set(COOKIE, createToken(payload), {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}
