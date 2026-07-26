/**
 * pg currently treats sslmode=require|prefer|verify-ca as verify-full and
 * emits a deprecation warning. Prefer an explicit verify-full so behavior
 * stays the same when pg v9 adopts libpq semantics.
 *
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export function normalizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const mode = parsed.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      parsed.searchParams.set("sslmode", "verify-full");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
