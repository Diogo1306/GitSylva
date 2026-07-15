import { create } from "zustand";
import { persist } from "zustand/middleware";

type OnboardState = {
  onboarded: boolean;
  finish: () => void;
  replay: () => void;
};

// Persisted so the welcome flow shows only on first run. "Rever ecrã de
// boas-vindas" in Settings calls replay().
export const useOnboardStore = create<OnboardState>()(
  persist(
    (set) => ({
      onboarded: false,
      finish: () => set({ onboarded: true }),
      replay: () => set({ onboarded: false }),
    }),
    { name: "gitsylva-onboard", version: 0 },
  ),
);
