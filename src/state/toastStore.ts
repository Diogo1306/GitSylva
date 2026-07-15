import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";
export type Toast = { id: number; text: string; kind: ToastKind; exiting: boolean };

type ToastState = {
  toasts: Toast[];
  push: (text: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

// Errors stay long enough to be read (and can always be dismissed by click).
const DURATION: Record<ToastKind, number> = { info: 2600, success: 2600, error: 8000 };
const EXIT_MS = 220;

// Pending auto-dismiss handles, cleared on manual dismiss so a toast never
// runs its exit twice.
const timers = new Map<number, number>();

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (text, kind = "info") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind, exiting: false }] }));
    timers.set(id, window.setTimeout(() => get().dismiss(id), DURATION[kind]));
  },
  dismiss: (id) => {
    const handle = timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      timers.delete(id);
    }
    const target = get().toasts.find((t) => t.id === id);
    if (!target || target.exiting) return;
    // Exit animation first, removal after it finishes.
    set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)) }));
    window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), EXIT_MS);
  },
}));

/** Imperative helper for non-component callers. */
export function toast(text: string, kind: ToastKind = "info") {
  useToastStore.getState().push(text, kind);
}
