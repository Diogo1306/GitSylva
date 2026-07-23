# GitSylva — Interaction Specification

What is clickable, what changes, and the keyboard/selection/drag/scroll/focus/loading rules
per surface. Pairs with `animation-specs/animations.md` and `README.md` §12 (real vs mock).

## Global
- **Keyboard (dynamic per OS — Ctrl on Windows/Linux, ⌘ on macOS):** `Ctrl/⌘+K` Command
  Palette · `Ctrl/⌘+Enter` commit (in Working Copy) · `Ctrl/⌘+P` push · `Ctrl/⌘+Shift+L`
  pull · `Ctrl/⌘+R` fetch · `Ctrl/⌘+B` new branch · `Ctrl/⌘+S` stash · `Esc` closes the topmost overlay
  (palette → modal → context menu). Shortcuts are rebindable in Settings → Shortcuts.
- **Focus:** overlays trap focus; first field autofocuses; `Esc` returns focus to the trigger.
  Visible focus ring on inputs/buttons (use `--accent`).
- **Outside-click:** clicking the scrim closes palette/modal; clicking anywhere closes the
  branch context menu; the app root `onClick` clears the menu.
- **Selection persistence:** selected commit, active repo/tab, view, and all prefs persist
  across reloads (localStorage in prototype → config store in Tauri).

## Titlebar / window
- macOS: traffic-light dots (left) → close/minimize/zoom (Tauri window API). Windows:
  min/max/close (right); close hover turns red `#E81123`.
- Titlebar is a **single row** (never two). Empty areas + toolbar gaps = **drag region**;
  buttons stop propagation. Primary buttons are 36px tall; important rows 40px; secondary
  actions ≥32×32px. Real implementation uses native `button`, ARIA states and full keyboard
  support; `prefers-reduced-motion` is respected.
- Zoom/maximize toggles the max icon; minimize plays the minimize animation.

## Repository selector (header) — there is NO permanent tab bar and NO rail
- The header shows only the current repo (`name / branch ▾`). **Click** opens the selector
  dropdown with sections **ABERTOS** (open repos — context preserved), **FIXADOS** (pinned)
  and **RECENTES**. A repo appears in exactly one section; open + pinned shows a ★ star in
  ABERTOS.
- **Click a row** → switch to (or open) that repo. Each row has a **"…" menu**: Fixar /
  Remover dos fixados · Mostrar no explorador · Copiar caminho · Fechar repositório (danger,
  separated by a divider; only for open repos, never the last one).
- Closing the active repo switches to the last-used open repo. **"+" (36×36px)** → the Add
  Repository page (Local / Clone / Create) — never a quick menu.

## Sidebar
- **Workspace nav:** Working Copy / History / Stashes → set `view`; active item = `--sel`.
  Working Copy shows a count badge (staged+unstaged).
- **Branches:** click = select + focus in the tree; **Checkout is always visible on the
  selected branch** (hover/focus reveals it on the others — never hover-only for the
  selection) and "Merge em [current]" appears on the selected non-current branch.
  **Right-click** = context menu: Checkout, Merge into current…, Rebase…, Rename…, Copy name,
  Delete (danger, behind a divider; hidden for current branch). Search is behind the loupe
  icon (≥32×32px target) and auto-appears with many branches, staying open while it has text.
- Remotes/Tags are listed; expandable rows.

## Toolbar
- **Fetch** → spinner + "A buscar…", ends with a falling leaf + toast/notification; clears
  the behind badge in the mock. **Discard** → disabled/greyed when nothing unstaged; else
  opens the red confirm modal (badge = unstaged count). **Terminal** → toast (mock).
  **Search** → Command Palette. **Settings** (gear) → Settings screen (remembers prevView).

## Contextual Git actions — there is NO global bottom action bar
- **Commit:** form + button always visible in Working Copy when there are changes; the
  "Alterações por commitar" node at the top of History opens staging + message + Commit.
  Button states the branch and staged count. `Ctrl/⌘+Enter` commits.
- **Pull / Push / Fetch:** header buttons with ↓/↑ badges; below 1100px they group into a
  single **Sync** button with a menu (arrow keys, Esc closes and returns focus, outside click
  closes; `aria-expanded`/`aria-haspopup`/`role="menu"` in the real app).
- **Stash:** "Guardar stash…" in the Working Copy header when there are changes; primary
  "Criar stash" on the Stashes screen.
- **Tag / Revert / Branch daqui:** visible buttons in the commit detail (hidden when no
  commit is selected). Advanced actions (cherry-pick, interactive rebase, reset, copy hash,
  rename/delete branch) live in the "…" menu — destructive ones behind a divider, in the
  danger color, with explicit confirmation.
- **Merge:** selecting a non-current branch in the sidebar shows a visible "Merge em
  [current]" action next to Checkout.

## History
- **Click commit row** → loads CommitDetailPanel (author, date, hash pill, message, +/−,
  changed files, diff). Selected row = `--sel`.
- **Filter input** filters the commit list. Graph column scrolls with the list (shared scroll).
- **Click a file** in the detail → selects it and opens the diff automatically.
- **Collapsible diff:** the DIFF header has a ≥36px "Ocultar diff ▾"/"Mostrar diff ▸" button
  (`aria-expanded`, visible focus). Hides only the diff code — metadata, message, actions and
  file list stay. Default: open ≥980px window width, closed below; a manual choice wins for
  the session, survives commit switches, and persists per repository. Transition: ~180ms fade,
  no heavy layout animation. Discrete empty state when there is nothing to show.
- **Close detail:** a separate ✕ closes the whole right panel; selecting a commit reopens it.
  ("Ocultar diff" ≠ "Fechar detalhe" — never merged into one control.)
- Resizable divider between list and CommitDetailPanel (min widths in README §8).

## Working Copy
- **Checkbox / row toggle** → move file between Unstaged and Staged (`fileIn` animation).
  **"Preparar tudo"** stages all; **"Descartar"** opens the discard confirm.
- **Select a file** → its diff renders in the right pane (mono, colored add/del/hunk lines).
  At narrow widths the diff stacks under the selected file.
- **Commit box:** type message → **Commit em <branch>** enabled only with ≥1 staged file;
  commit adds a node to the graph, clears staged, bumps ahead, returns to History.
- Empty state when the working copy is clean.

## Stashes
- **Apply** → returns stashed files to the working copy (removes the stash), toast.
  **Discard** → removes the stash, toast. Buttons are 36px tall. Header has a primary
  **"Criar stash"** button; the empty state says "Ainda não existem stashes." with a
  "Guardar alterações num stash" button (no references to a nonexistent toolbar Stash button).

## Add Repository
- Segmented tabs **Local / Remote / Clone / Add / Create**. Local shows searchable recent
  repos with status badge + path; **→** opens one. Clone shows URL + destination + a
  progress/spinner state (mock). **Create** makes a new folder/repo. **Fechar** returns to
  History.

## Settings
- Left **section nav**; content scrolls; nav **scroll-spy** highlights the section at the top,
  and clicking a nav item scrolls to it. **← Voltar** returns to prevView.
- Controls: theme preview cards, tree-style radio cards (with icons), branch-color swatches,
  segmented density/language/notification-location, pill toggles (autofetch, GPG, prune, LFS
  per repo, signing…), text inputs (name/email), Shortcuts (click row → record → key/Esc),
  SSH keys (generate modal, test-connection states, copy public, remove), Cleanup (clear
  cache + toast; reset-all → danger confirm modal). Every change saves immediately.

## Command Palette (Ctrl+K / ⌘K)
- Fuzzy search across **Repositories, Branches, Commits, Actions**. Arrow keys move selection,
  Enter runs it, Esc closes. Selecting a commit jumps to History with it selected; a branch
  offers checkout; an action fires (open modal / navigate).

## Loading & error states
- Loading = spinner on the acting control + disabled state (Fetch, Clone, SSH test). Success =
  green toast/notification; warning/error = red (`--ddT`). Destructive actions (Discard,
  Delete branch, Reset settings) always require a confirm modal (danger variant).
- Disabled controls: reduced opacity + `cursor: default`, no hover lift.
