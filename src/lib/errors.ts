// Extracts a readable message from anything a Tauri invoke / react-query error
// can be. `String(error)` on an invoke error object renders "[object Object]".
export function errMsg(e: unknown, fallback = "ocorreu um erro"): string {
  if (typeof e === "string" && e.trim()) return e;
  if (e instanceof Error && e.message.trim()) return e.message;
  const m = (e as { message?: unknown } | null)?.message;
  if (typeof m === "string" && m.trim()) return m;
  return fallback;
}
