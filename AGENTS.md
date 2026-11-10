## Repository boundary

The checkout root is public on GitHub. Keep descriptions of implemented code, the glossary, ADRs and development guides here. Public branch names and commit messages describe completed work.

`private/` is a separate unpublished Git repository in the main checkout. Store plans, unreleased work, product decisions, user or financial data and maintainer operations there. Never move a file out of it without an explicit request. If a private reference is essential in public prose, give the file and section as plain text and say it is outside this repository.

Commit private edits freely with `git -C private …`. A public commit requires the maintainer's decision.

## Working conventions

- Specs, tickets and triage live in the private tracker. For ticket paths, worktree lookup and status conventions see the [tracker guide](docs/agents/issue-tracker.md) and [triage labels](docs/agents/triage-labels.md). Use `.scratch/` for disposable output.
- Use the [domain guide](docs/agents/domain.md) when naming concepts or changing a contract covered by an ADR.
- Follow the [verification matrix and test design rules](docs/agents/verification.md). Run focused checks while editing and the required aggregate tier once before handoff. Changed-test selection alone does not cover the matrix.
- Browser checks use two workers and task-relevant stories in both themes. Run the full browser suite only on explicit request or for genuinely global UI changes. Explain the scope before starting it.
