## Public / private boundary

This checkout holds two repositories. `private/` is a separate, unpublished git
repository, ignored by `.gitignore`; everything else is public on GitHub.

- **Public** — anything a reader learns _about the code that already exists_:
  source, `CONTEXT.md`, `docs/`, the Zerro Core documents, build and run docs.
- **Private** — anything a stranger would learn _about the future or about the
  maintainer_: roadmap, product decisions, money, users, unreleased work,
  operational specifics.

For a borderline file, ask whether it describes what already works or states an
intent. Intent goes in `private/`. The same line applies to commit messages and
branch names in the public repository: say what was done, not why or what comes
next.

A public document never links into `private/`: the target does not exist for
anyone reading the repository on GitHub. Name the file as plain text instead,
with its section, and say it is not part of this repository.

`git` from the checkout root commits to the **public** repository. Commit
private notes with `git -C private …`. Never move a file out of `private/`
unless asked to. See `private/README.md`.

## Agent skills

### Issue tracker

Issues live as Markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout with root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

### Verification

Use the public command tiers and change-routing matrix in
`docs/agents/verification.md`. Run focused tests during the implementation loop,
then the required aggregate verification tier once before handoff. Changed or
related-test selection is a convenience, not proof that every required gate ran.
