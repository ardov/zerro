# Issue tracker: Local Markdown

Issues and specs (you may know a spec as a PRD) for this repo live as markdown
files under `private/work/`. That directory belongs to the separate private
repository mounted at `private/` and is not part of this repository: a spec or a
ticket is a statement of intent, and intent stays private (see `AGENTS.md`).

`.scratch/` stays for genuinely throwaway files — command output, drafts,
anything that can be deleted without loss. Nothing durable lives there.

## Resolving the path

`private/` exists only in the main checkout; it is a separate repository rather
than a tracked directory, so it is absent from every git worktree. Resolve the
paths below against the **main checkout root**, not the working directory. From
a worktree, that root is `dirname "$(git rev-parse --git-common-dir)"`.

## Conventions

- One feature per directory: `private/work/<feature-slug>/`
- The spec is `private/work/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `private/work/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` — never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `private/work/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Committing

The tracker lives in the private repository, so it is committed with `git -C private …` and never with `git` from the checkout root. Commit tracker changes as you make them, without asking — publishing a spec or moving a ticket's status is exactly the kind of change that should land in the history right away. That standing permission covers the private repository only.

## When the work ships

The spec and its tickets stay in `private/work/` as the record of what was intended. The decision that outlives the work — the one a reader of the code needs — goes to `docs/adr/` in this repository.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `private/work/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `private/work/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `private/work/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
