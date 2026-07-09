# Workflow

## Branches

- master. Stable and tested. Only receives merges from develop.
- develop. Integration branch. All work merges here first.
- feature/<name>. One branch per task or feature, created from develop.

## Flow

1. Start a task: create feature/<name> from develop.
2. Work in small commits. Messages in English. No Claude co-author.
3. When done: merge feature/<name> into develop with --no-ff, then delete the
   feature branch.
4. At a milestone: merge develop into master.

## Example

```
git checkout develop
git pull
git checkout -b feature/open-repo
# work and commit
git checkout develop
git merge --no-ff feature/open-repo -m "Merge feature/open-repo into develop"
git push
git branch -d feature/open-repo
```

## Commit messages

- English, plain, no emojis, no em-dashes.
- Short and clear, present tense. Example: "Add get_status command".
