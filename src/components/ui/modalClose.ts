import { createContext, useContext } from "react";

/** Lets nested actions (e.g. a Cancel button) close the Modal shell with its
 * exit animation. Provided by <Modal>; falls back to the raw onClose. */
export const ModalCloseContext = createContext<(() => void) | null>(null);

export function useModalClose(fallback: () => void): () => void {
  const ctx = useContext(ModalCloseContext);
  return ctx ?? fallback;
}
