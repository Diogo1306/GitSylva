import { create } from "zustand";
import { useThemeStore } from "./themeStore";

// Notification stack timing (notifIn 300ms pop, auto-dismiss ~4s, hover pauses timer, notifOut 340ms exit before removal). Toasts = quick confirmations; notifications carry async git results.

export type NotifKind = "success" | "info" | "warning" | "error";
/** Category gates emission via the Settings → Notificações toggles. */
export type NotifCategory = "push" | "fetch" | "conflict" | "general";

export type AppNotification = {
  id: number;
  title: string;
  sub?: string;
  kind: NotifKind;
  exiting: boolean;
};

type NotifState = {
  notifications: AppNotification[];
  push: (title: string, sub?: string, kind?: NotifKind, category?: NotifCategory) => void;
  dismiss: (id: number) => void;
  pause: (id: number) => void;
  resume: (id: number) => void;
};

const AUTO_DISMISS = 4000;
const EXIT_MS = 340;
const MAX_STACK = 4;

let nextId = 1;
// Timer bookkeeping lives outside the store: id → handle + remaining time.
const timers = new Map<number, { handle: number; startedAt: number; remaining: number }>();

function clearTimer(id: number) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t.handle);
    timers.delete(id);
  }
}

export const useNotificationStore = create<NotifState>((set, get) => ({
  notifications: [],
  push: (title, sub, kind = "success", category = "general") => {
    const prefs = useThemeStore.getState();
    if (category === "push" && !prefs.notifPush) return;
    if (category === "fetch" && !prefs.notifFetch) return;
    if (category === "conflict" && !prefs.notifConflicts) return;

    const id = nextId++;
    set((s) => ({ notifications: [...s.notifications, { id, title, sub, kind, exiting: false }] }));
    // Cap the stack: dismiss the oldest live card when over the limit.
    const live = get().notifications.filter((n) => !n.exiting);
    if (live.length > MAX_STACK) get().dismiss(live[0].id);
    const handle = window.setTimeout(() => get().dismiss(id), AUTO_DISMISS);
    timers.set(id, { handle, startedAt: Date.now(), remaining: AUTO_DISMISS });
  },
  dismiss: (id) => {
    clearTimer(id);
    const target = get().notifications.find((n) => n.id === id);
    if (!target || target.exiting) return;
    // Exit animation plays first; removal happens after it finishes.
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, exiting: true } : n)) }));
    window.setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    }, EXIT_MS);
  },
  pause: (id) => {
    const t = timers.get(id);
    if (!t) return;
    clearTimeout(t.handle);
    t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt));
  },
  resume: (id) => {
    const t = timers.get(id);
    if (!t) return;
    t.startedAt = Date.now();
    t.handle = window.setTimeout(() => useNotificationStore.getState().dismiss(id), Math.max(400, t.remaining));
  },
}));

/** Imperative helper for non-component callers. */
export function notify(title: string, sub?: string, kind: NotifKind = "success", category: NotifCategory = "general") {
  useNotificationStore.getState().push(title, sub, kind, category);
}
