// Admin: create / edit / open / close questions.
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";

export const runtime = "nodejs";

function cleanAnswers(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((a) => String(a).trim())
    .filter((a) => a.length > 0);
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      prompt?: string;
      acceptedAnswers?: string[];
      sortOrder?: number;
    };
    const prompt = (body.prompt ?? "").trim();
    if (!prompt) return fail("Question text is required", 400);
    const accepted = cleanAnswers(body.acceptedAnswers);
    if (accepted.length === 0) return fail("Add at least one accepted answer", 400);

    const db = getDb();
    const { data, error } = await db
      .from("questions")
      .insert({
        prompt,
        accepted_answers: accepted,
        status: "draft",
        sort_order: body.sortOrder ?? 0,
        created_by: admin.id,
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok({ question: data });
  });
}

export async function PATCH(req: NextRequest) {
  return guard(async () => {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      prompt?: string;
      acceptedAnswers?: string[];
      status?: "draft" | "open" | "closed";
    };
    const id = (body.id ?? "").trim();
    if (!id) return fail("Missing question id", 400);

    const db = getDb();
    const patch: Record<string, unknown> = {};
    if (typeof body.prompt === "string") {
      const p = body.prompt.trim();
      if (!p) return fail("Question text cannot be empty", 400);
      patch.prompt = p;
    }
    if (body.acceptedAnswers) {
      const accepted = cleanAnswers(body.acceptedAnswers);
      if (accepted.length === 0) return fail("Add at least one accepted answer", 400);
      patch.accepted_answers = accepted;
    }
    if (body.status) {
      patch.status = body.status;
      if (body.status === "open") {
        patch.opened_at = new Date().toISOString();
        // keep exactly one question open for delegates
        await db.from("questions").update({ status: "closed", closed_at: new Date().toISOString() })
          .eq("status", "open").neq("id", id);
      }
      if (body.status === "closed") patch.closed_at = new Date().toISOString();
    }
    if (Object.keys(patch).length === 0) return fail("Nothing to update", 400);

    const { data, error } = await db
      .from("questions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return ok({ question: data });
  });
}
