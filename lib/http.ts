// Small helpers for route handlers: consistent JSON + AuthError handling.
import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, ...((data as object) ?? {}) }, init);
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// Wraps a handler, mapping AuthError -> proper status and any other throw -> 500.
export async function guard(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("route error:", e);
    const msg = e instanceof Error ? e.message : "Internal error";
    return fail(msg, 500);
  }
}
