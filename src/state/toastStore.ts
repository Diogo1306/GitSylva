import { create } from "zustand";

export type Toast = { id: number; text: string };

type ToastState = {
  toasts: Toast[];
  push: (text: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (text) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, text }] }));
    // Auto-dismiss after a few seconds.
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper for non-component callers. */
export function toast(text: string) {
  useToastStore.getState().push(text);
}
