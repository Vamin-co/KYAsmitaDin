// Auth helpers: resolve the current delegate from the signed session cookie, against the DB.
import "server-only";
import { readSession } from "./session";
import { getDb } from "./supabase";
import type { Delegate } from "./types";

// Returns the active delegate for the current session, or null.
// A deactivated delegate is treated as logged out (login blocked, but ledger preserved).
export async function getSessionDelegate(): Promise<Delegate | null> {
  const session = await readSession();
  if (!session) return null;
  const db = getDb();
  const { data, error } = await db
    .from("delegates")
    .select("*")
    .eq("id", session.delegateId)
    .maybeSingle();
  if (error || !data) return null;
  const delegate = data as Delegate;
  if (!delegate.is_active) return null;
  return delegate;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// For route handlers: returns the delegate or throws AuthError(401).
export async function requireDelegate(): Promise<Delegate> {
  const d = await getSessionDelegate();
  if (!d) throw new AuthError("Not authenticated", 401);
  return d;
}

// For route handlers: returns an admin delegate or throws AuthError(401/403).
export async function requireAdmin(): Promise<Delegate> {
  const d = await requireDelegate();
  if (!d.is_admin) throw new AuthError("Admin only", 403);
  return d;
}
