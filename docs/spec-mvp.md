# GitSylva. MVP Spec

Date: 2026-07-09

## Goal

A desktop app for everyday git work, with a nice look and history shown as a
tree. This spec covers the MVP, that is Phases 0 and 1 of the roadmap. The later
phases are listed but not detailed here.

## Scope

In:

- Open a folder and validate that it is a git repository.
- View the working copy changes.
- Stage and unstage files, stage all, discard with confirmation.
- Write a message and make a real commit.
- View the history as a tree graph.
- View the diff of a file.
- Batman theme and the base identity, with the design system in tokens.

Out of the MVP:

- Pull, push, fetch, switch and create branches. Phase 2.
- Stashes, tags, merge, quick search, multiple repositories. Phase 3.
- Other themes, tree styles, animations, onboarding with login, full settings,
  SSH keys, notifications. Phase 4.

## Roadmap

- Phase 0. Foundation. Project set up, design system and base theme, connection
  to the system git, open a repository, minimal splash.
- Phase 1. Commit MVP. Working copy, stage, discard, commit, history graph, diff.
- Phase 2. Sync. Pull, push, fetch, switch and create branches.
- Phase 3. Power. Stashes, tags, merge, quick search, multiple repositories.
- Phase 4. Polish. Themes, tree styles, animations, onboarding, settings.

## Architecture

Two layers inside the Tauri app, with a single typed boundary.

- Frontend in React and TypeScript. All the interface, themes, graph and app
  state. It talks to the backend only through a typed api layer.
- Backend in Rust. One thin module per git area. Each command runs the system
  git in the repo folder, captures the output and returns a typed result or an
  error.

The app uses the git already installed on the machine. That way commits keep the
user identity and, later, push and pull use the existing credentials.

## Project structure

```
gitsylva/
  src-tauri/
    src/
      main.rs
      error.rs            GitError
      git/
        mod.rs
        repo.rs           open and validate repo
        status.rs         read changes
        stage.rs          stage, unstage, discard
        commit.rs         make a commit
        log.rs            read history
        diff.rs           read the diff of a file
    tauri.conf.json
    Cargo.toml
  src/
    main.tsx
    App.tsx
    lib/api.ts            typed boundary to the backend
    state/                app state with Zustand
    theme/                tokens and Batman theme
    components/           reusable UI
    features/
      repo/
      working-copy/
      history/
      commit/
  index.html
  package.json
  vite.config.ts
```

## Backend commands in the MVP

- open_repo(path). Validates and returns path, current branch, head and whether
  it is empty.
- get_status(path). List of changed files with staged and unstaged state,
  including new and deleted.
- stage_file(path, file) and unstage_file(path, file).
- stage_all(path).
- discard_file(path, file). Confirmation is handled in the interface.
- commit(path, message). Returns the commit result.
- get_log(path, limit). List of commits with hash, parents, author, date,
  subject and branch or tag refs.
- get_diff(path, file, staged). Returns the unified patch of the file.

Computing the graph layout from the commits and their parents is done in the
frontend, in a pure and testable function.

## MVP screens

- No repo open. Empty state with a button to pick a folder. Minimal splash with
  the logo.
- Working copy. Staged and unstaged lists, stage per file, stage all, discard
  with confirmation, message box, commit button and a diff panel for the
  selected file.
- History. Tree graph of commits and commit detail with its files and diff.

## Data flow

- Open folder. The backend validates and the state stores the repo path.
- Read status. The backend runs git status and returns the changed files.
- Stage, unstage, stage all or discard. Runs the matching git command and then
  reloads the status.
- Commit. Runs git commit, reloads status and history, and the interface drops a
  leaf.
- Select file. Runs git diff and shows the patch.
- History. Runs git log with the parents of each commit. The graph layout is
  computed in the frontend.

## Frontend state

- Git data with TanStack Query, with cache and automatic reload after each
  action that changes the repo.
- Small app state with Zustand, for the current repo, the selected file, the
  active view and the theme.

## Themes and design system

- Color tokens as CSS variables, per theme, on the document root.
- The MVP ships only the Batman theme, taken from the prototype.
- The Space Grotesk font is bundled in the app, with no dependency on the
  internet.
- Built around tokens from the start, so the later themes are just new data and
  not a rewrite.

## Errors

- Each backend command returns a result or a GitError with a code and the
  message coming from git.
- The interface shows errors as toasts or inline messages next to the action.
  Examples: folder that is not a git repo, nothing to commit, file in conflict.
- Guard states handled: no repo open, repo with no commits, detached head.

## Testing

- Rust. Git read tests using temporary repositories created in the test itself,
  for status, log and diff.
- Frontend. The function that computes the graph is pure and tested on its own.
  Component tests for the file lists and the diff.
- Manual. Test the full commit cycle on a real repository.

## Requirements and environment

- Git installed and configured. Confirmed, version 2.49.
- Node.js and npm. Confirmed.
- Rust, to be installed to build the app.
- Windows first. The tech supports Mac and Linux later.
