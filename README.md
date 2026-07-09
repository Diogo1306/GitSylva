# GitSylva

Desktop Git client where history is shown as a living tree.

The goal is a clean and simple app for everyday git work: open a repository, see
your changes, stage files, commit, and view history as a tree graph.

## Status

In development. Starting with the MVP.

Phased roadmap:

- Phase 0. Foundation: project set up, design system and base theme, connection
  to the system git, open a repository.
- Phase 1. Commit MVP: view changes, stage per file, discard, write a message,
  make a real commit, view the history graph and the diff.
- Phase 2. Sync: pull, push, fetch, switch and create branches.
- Phase 3. Power: stashes, tags, merge, quick search, multiple repositories.
- Phase 4. Polish: themes, tree styles, animations, onboarding, settings.

## Tech

- Tauri 2 for the desktop shell.
- React, TypeScript and Vite for the interface.
- Rust backend that talks to the system git through a subprocess.

The app uses the git already installed on the machine, so commits keep your
identity and push and pull use your existing credentials.

## Requirements

- Git installed and configured.
- Node.js and npm.
- Rust, to build the app.

## Development

Branching model: master is stable, develop integrates, and each task is a
feature branch off develop. See `docs/workflow.md` for the flow.

## License

Personal project.
