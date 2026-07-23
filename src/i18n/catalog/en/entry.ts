import type { MessageValue } from "../../types";
import type { EntryKey } from "../pt/entry";

export const enEntry: Record<EntryKey, MessageValue> = {
  // ── onboarding: step captions ──────────────────────────────────────────────
  "onboarding.caption.login": "ENTER",
  "onboarding.caption.setup": "CUSTOMIZE",
  "onboarding.caption.grow": "PLANTED",

  // ── onboarding: login phase ────────────────────────────────────────────────
  "onboarding.login.welcome": "Welcome",
  "onboarding.login.subtitle": "Work on your local repositories right now.",
  "onboarding.login.continueLocally": "Continue locally",
  "onboarding.login.integrationsSoonLabel": "INTEGRATIONS: SOON",
  "onboarding.login.integrationsGroup": "Integrations: soon",
  "onboarding.login.continueWith": "Continue with {provider}",
  "onboarding.login.accountSoon": "Account login arrives in the sync phase",

  // ── onboarding: setup phase ────────────────────────────────────────────────
  "onboarding.setup.title": "Customize your garden",
  "onboarding.setup.subtitle": "You can change all of this later in Settings.",
  "onboarding.setup.themeLabel": "THEME",
  "onboarding.setup.themeGroup": "Theme",
  "onboarding.setup.treeStyleLabel": "TREE STYLE",
  "onboarding.setup.treeStyleGroup": "Tree style",
  "onboarding.setup.repoLayoutLabel": "OPEN REPOSITORIES",
  "onboarding.setup.repoLayoutGroup": "Open repositories",
  "onboarding.setup.layoutTabs": "Tabs (browser)",
  "onboarding.setup.layoutRail": "Sidebar",
  "onboarding.setup.plant": "Plant and enter",

  // ── onboarding: grow phase (rich text kept as inline <strong> segments) ─────
  "onboarding.grow.title": "Your forest is planted",
  "onboarding.grow.descPre": "The ",
  "onboarding.grow.workingCopy": "Working copy",
  "onboarding.grow.descMid1": " shows what changed, the ",
  "onboarding.grow.commitTree": "commit tree",
  "onboarding.grow.descMid2": " is your history, and ",
  "onboarding.grow.descPost": " opens the Command Palette at any time.",
  "onboarding.grow.goodCode": "happy coding.",

  // ── repo picker: chrome + tabs ─────────────────────────────────────────────
  "repo.screenLabel": "Add repository",
  "repo.tab.local": "Local",
  "repo.tab.clone": "Clone",
  "repo.choose": "Choose…",

  // ── repo picker: local (recents + folders scanned from ~/dev) ──────────────
  "repo.local.title": "Local repositories",
  "repo.local.searchLabel": "Search local repositories",
  "repo.local.removeTitle": "Remove from recent",
  "repo.local.removeAria": "Remove {name} from recent",
  "repo.local.empty": "No local repositories yet.",
  "repo.local.noMatch": "No matches for that search.",
  "repo.local.openPath": "Open path: {path}",
  "repo.local.cloneEllipsis": "Clone…",
  "repo.local.browseFolder": "Choose folder…",
  "repo.local.badgeOpen": "Already open",
  "repo.local.badgeInit": "Initialize",

  // ── repo picker: create new ────────────────────────────────────────────────
  "repo.create.title": "Create new repository",
  "repo.create.nameLabel": "Name",
  "repo.create.namePlaceholder": "my-project",
  "repo.create.parentLabel": "Root folder",
  "repo.create.runs": "Runs",
  "repo.create.runsIn": "in {path} on branch main.",
  "repo.create.defaultName": "name",
  "repo.create.creating": "Creating…",
  "repo.create.submit": "Create repository",

  // ── repo picker: clone ─────────────────────────────────────────────────────
  "repo.clone.title": "Clone repository",
  "repo.clone.urlLabel": "Source URL",
  "repo.clone.destLabel": "Destination folder",
  "repo.clone.into": "Clones into {path}.",
  "repo.clone.doneTitle": "Clone complete",
  "repo.clone.cloning": "Cloning…",

  // ── repo: open error (useOpenRepo) ─────────────────────────────────────────
  "repo.openError": "could not open the repository",

  // ── components: ConfirmDialog ──────────────────────────────────────────────
  "components.confirm.discard": "Discard",

  // ── components: DiffView ───────────────────────────────────────────────────
  "components.diff.modeGroupLabel": "Diff display mode",
  "components.diff.unified": "Unified",
  "components.diff.split": "Side by side",
  "components.diff.showMoreLines": {
    one: "Show {count} more line",
    other: "Show {count} more lines",
  },
  "components.diff.hiddenCount": { one: "({count} hidden)", other: "({count} hidden)" },
  "components.diff.tooLarge": "Diff too large — showing only the first part.",
  "components.diff.loadFull": "Load full diff",

  // ── components: ErrorBoundary ──────────────────────────────────────────────
  "components.error.title": "Something went wrong",
  "components.error.body":
    "An unexpected error occurred while rendering this screen. Your repositories were not affected.",
  "components.error.retry": "Try again",
  "components.error.home": "Back to start",
  "components.error.reload": "Reload app",

  // ── components: Notifications ──────────────────────────────────────────────
  "components.notif.dismiss": "Dismiss notification",

  // ── components: UpdatePrompt ───────────────────────────────────────────────
  "components.update.message":
    "Version {version} of GitSylva is available (you have {current}). Download and install now? The app restarts itself when done.",
  "components.update.confirm": "Update now",
  "components.update.downloading": "Downloading the update…",
  "components.update.failed": "could not update",

  // ── components: PanelResize ────────────────────────────────────────────────
  "components.panel.resizeTitle": "Drag to resize",
};
