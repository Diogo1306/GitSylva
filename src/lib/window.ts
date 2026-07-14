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

/** Plays the handoff's winMinimize animation (scale/fade toward the taskbar)
 * before actually minimizing; the style is cleared so restore looks normal. */
export async function winMinimizeAnimated(animate: boolean) {
  const root = document.getElementById("root");
  if (animate && root) {
    root.style.animation = "winMinimize 600ms ease both";
    await new Promise((r) => window.setTimeout(r, 280));
    await winMinimize();
    window.setTimeout(() => {
      root.style.animation = "";
    }, 420);
  } else {
    await winMinimize();
  }
}

export async function winIsMaximized(): Promise<boolean> {
  try {
    return await getCurrentWindow().isMaximized();
  } catch {
    return false;
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
