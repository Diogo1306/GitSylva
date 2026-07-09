import { getCurrentWindow } from "@tauri-apps/api/window";

// Window controls for the custom (frameless) titlebar. Wrapped so they no-op
// gracefully if the app is opened outside Tauri (e.g. a plain browser).

export async function winMinimize() {
  try {
    await getCurrentWindow().minimize();
  } catch {
    /* not in a Tauri window */
  }
}

export async function winToggleMaximize() {
  try {
    await getCurrentWindow().toggleMaximize();
  } catch {
    /* not in a Tauri window */
  }
}

export async function winClose() {
  try {
    await getCurrentWindow().close();
  } catch {
    /* not in a Tauri window */
  }
}
