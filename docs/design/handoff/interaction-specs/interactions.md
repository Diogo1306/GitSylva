# GitSylva — Interaction Specification

What is clickable, what changes, and the keyboard/selection/drag/scroll/focus/loading rules
per surface. Pairs with `animation-specs/animations.md` and `README.md` §12 (real vs mock).

## Global
- **Keyboard:** `⌘K` open Command Palette · `⌘Enter` commit (in Working Copy) · `⌘P` push ·
  `⌘⇧L` pull · `⌘R` fetch · `⌘B` new branch · `⌘S` stash · `Esc` closes the topmost overlay
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
- Titlebar empty areas + toolbar gaps = **drag region**. Buttons stop propagation.
- Zoom/maximize toggles the max icon; minimize plays the minimize animation.

## Repository tabs / rail
- **Click tab** → switch repo (updates branch, ahead/behind, graph, sidebar). Active tab has
  `--sel` bg + border, bolder label.
- **✕ on tab** → close repo (can't close the last one → toast). **"+"** → Add Repository.
- **Group chip click** → collapse/expand the group (caret rotates; members hide/show).
  **Right-click group chip** → close all tabs in the group (keeps ≥1 open).
- **Rail mode** mirrors all of the above in the left project list; the active project row is
  highlighted and shows its branch.
- Groups work identically in tabs and rail.

## Sidebar
- **Workspace nav:** Working Copy / History / Stashes → set `view`; active item = `--sel`.
  Working Copy shows a count badge (staged+unstaged).
- **Branches:** click = checkout (updates trunk/HEAD, bottom-bar branch, commit-target).
  **Right-click** = context menu: Checkout, Merge into current…, Rebase…, Rename…, Copy name,
  Delete (danger; hidden for current branch). Each gives a toast; Delete removes the branch.
- Remotes/Tags are listed; expandable rows.

## Toolbar
- **Fetch** → spinner + "A buscar…", ends with a falling leaf + toast/notification; clears
  the behind badge in the mock. **Discard** → disabled/greyed when nothing unstaged; else
  opens the red confirm modal (badge = unstaged count). **Terminal** → toast (mock).
  **Search** → Command Palette. **Settings** (gear) → Settings screen (remembers prevView).

## Bottom action bar
- **Commit** (badge = staged count) → Working Copy. **Pull** (behind badge) / **Push** (ahead
  badge) → respective modal listing the commits, then updates ahead/behind + `origin/main`
  chip. **Branch/Merge/Tag/Stash** → their modals. Right side shows `repo / branch ↑ahead ↓behind`.

## History
- **Click commit row** → loads CommitDetailPanel (author, date, hash pill, message, +/−,
  changed files, diff). Selected row = `--sel`.
- **Filter input** filters the commit list. Graph column scrolls with the list (shared scroll).
- **Click a file** in the detail → focuses its diff.
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
  **Discard** → removes the stash, toast. Empty state with guidance when none.

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

## Command Palette (⌘K)
- Fuzzy search across **Repositories, Branches, Commits, Actions**. Arrow keys move selection,
  Enter runs it, Esc closes. Selecting a commit jumps to History with it selected; a branch
  offers checkout; an action fires (open modal / navigate).

## Loading & error states
- Loading = spinner on the acting control + disabled state (Fetch, Clone, SSH test). Success =
  green toast/notification; warning/error = red (`--ddT`). Destructive actions (Discard,
  Delete branch, Reset settings) always require a confirm modal (danger variant).
- Disabled controls: reduced opacity + `cursor: default`, no hover lift.
