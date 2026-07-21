import type { KeyboardEvent } from "react";

/**
 * Enter/Space activation for custom controls. Cancels the element's own native
 * Enter/Space activation (if any) and fires exactly one real click, so a single
 * onClick handler serves both pointer and keyboard. Works for real <button>s
 * and for role="button" elements alike.
 */
export function activateOnKeyDown<T extends HTMLElement>(e: KeyboardEvent<T>) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    e.currentTarget.click();
  }
}
