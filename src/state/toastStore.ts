import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";
export type Toast = { id: number; text: string; kind: ToastKind };

type ToastState = {
  toasts: Toast[];
  push: (text: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

// Errors stay long enough to be read (and can always be dismissed by click).
const DURATION: Record<ToastKind, number> = { info: 2600, success: 2600, error: 8000 };

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (text, kind = "info") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), DURATION[kind]);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper for non-component callers. */
export function toast(text: string, kind: ToastKind = "info") {
  useToastStore.getState().push(text, kind);
}
