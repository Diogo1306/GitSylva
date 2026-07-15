import { invoke as tauriInvoke } from "@tauri-apps/api/core";

// Central instrumentation for every Tauri call plus global error capture.
// The backend logs its own execution time; this side measures the full
// round-trip (IPC + serialization) and keeps an in-memory ring for the
// perf report (window.__gsPerf() / window.__gsPerfDump()).

export type CallRecord = {
  cmd: string;
  ms: number;
  ok: boolean;
  /** Approximate result size: chars for strings, items for arrays. */
  size: number;
  error?: string;
};

const RING_MAX = 300;
const ring: CallRecord[] = [];

function push(rec: CallRecord) {
  ring.push(rec);
  if (ring.length > RING_MAX) ring.splice(0, ring.length - RING_MAX);
}

function approxSize(result: unknown): number {
  if (typeof result === "string") return result.length;
  if (Array.isArray(result)) return result.length;
  return result == null ? 0 : 1;
}

// Errors are forwarded to the Rust log file so crashes in the field leave a
// trail. Self-disables if the backend (or the command) is unavailable, e.g.
// running in a plain browser.
let backendLogOk = true;
function toBackendLog(level: "info" | "warn" | "error", message: string) {
  if (!backendLogOk) return;
  tauriInvoke("frontend_log", { level, message }).catch(() => {
    backendLogOk = false;
  });
}

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const t0 = performance.now();
  try {
    const result = await tauriInvoke<T>(cmd, args);
    const ms = Math.round(performance.now() - t0);
    push({ cmd, ms, ok: true, size: approxSize(result) });
    if (ms >= 500) console.warn(`[invoke] ${cmd}: ${ms}ms`);
    return result;
  } catch (e) {
    const ms = Math.round(performance.now() - t0);
    const msg = (e as { message?: string })?.message ?? String(e);
    push({ cmd, ms, ok: false, size: 0, error: msg });
    // Command failures are expected (conflicts, no upstream, …) — info level.
    console.info(`[invoke] ${cmd} falhou após ${ms}ms: ${msg}`);
    throw e;
  }
}

export type PerfSummary = Record<
  string,
  { count: number; errors: number; avg: number; max: number; over100: number; over500: number; over1s: number; over5s: number }
>;

export function perfSummary(): PerfSummary {
  const out: PerfSummary = {};
  for (const r of ring) {
    const s = (out[r.cmd] ??= { count: 0, errors: 0, avg: 0, max: 0, over100: 0, over500: 0, over1s: 0, over5s: 0 });
    s.count += 1;
    if (!r.ok) s.errors += 1;
    s.avg += r.ms; // sum for now; divided below
    s.max = Math.max(s.max, r.ms);
    if (r.ms > 100) s.over100 += 1;
    if (r.ms > 500) s.over500 += 1;
    if (r.ms > 1000) s.over1s += 1;
    if (r.ms > 5000) s.over5s += 1;
  }
  for (const s of Object.values(out)) s.avg = Math.round(s.avg / s.count);
  return out;
}

// ── Global error capture ─────────────────────────────────────────────────────

// Hard cap: a render loop throwing per frame must not flood the log.
let reported = 0;
function report(kind: string, message: string, detail?: string) {
  if (reported >= 40) return;
  reported += 1;
  const line = `[${kind}] ${message}${detail ? `\n${detail}` : ""}`;
  console.error(line);
  toBackendLog("error", line);
}

/** Uncaught exceptions and unhandled promise rejections → console + Rust log. */
export function installGlobalErrorCapture() {
  window.addEventListener("error", (e) => {
    report("window.onerror", `${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`, e.error?.stack);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string; stack?: string } | null;
    report("unhandledrejection", r?.message ?? String(e.reason), r?.stack);
  });
}

/** Called by error boundaries so render crashes reach the same log. */
export function reportRenderError(error: Error, componentStack: string) {
  report("react-render", error.message, `${error.stack ?? ""}\n${componentStack}`);
}

declare global {
  interface Window {
    __gsPerf?: () => PerfSummary;
    __gsPerfDump?: () => CallRecord[];
  }
}
window.__gsPerf = perfSummary;
window.__gsPerfDump = () => [...ring];
