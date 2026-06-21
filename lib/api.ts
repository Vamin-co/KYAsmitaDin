// Client-side fetch helper for the app's JSON API. Throws on non-ok with the server message.
export async function api<T = Record<string, unknown>>(
  path: string,
  method: "POST" | "PATCH" | "DELETE" = "POST",
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}
