import { env } from "cloudflare:workers";

// When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set (review apps), the API
// routes use Supabase. Otherwise they use the Cloudflare D1 binding `DB`.
const cfg = () => env as unknown as { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string };

export function supabaseEnabled() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = cfg();
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export class SupabaseError extends Error {
  constructor(public status: number, public code: string | undefined, message: string) {
    super(message);
  }
  get isUniqueViolation() {
    return this.code === "23505";
  }
}

/** Minimal PostgREST client. `path` is the table plus query, e.g. `attendance?id=eq.x`. */
export async function sb<T = unknown>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = cfg();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase is not configured");
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { code?: string; message?: string };
    throw new SupabaseError(response.status, err.code, err.message ?? `Supabase ${response.status}`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
