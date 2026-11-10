# Private Markdown tracker

Specs and tickets live in `private/work/<feature>/` in the main checkout, outside this repository. From a linked worktree, locate the main checkout with:

```sh
dirname "$(git rev-parse --path-format=absolute --git-common-dir)"
```

Use `spec.md` for the feature and `issues/01-<slug>.md` onward for individual tickets. Publishing means writing the file and committing it in the private repository. Fetch a ticket by its path or number. Put its [triage label](triage-labels.md) on a `Status:` line and append discussion under `## Comments`. Keep shipped specs and tickets as records. Record lasting public code decisions in [ADRs](../adr/).

## Wayfinding

Use `map.md` for Notes, Decisions-so-far and Fog. Each numbered child ticket has a question, `Type:` (`research`, `prototype`, `grilling` or `task`) and any `Blocked by:` numbers.

Claim the lowest-numbered open, unclaimed ticket whose dependencies are all resolved. Save `Status: claimed` before starting. To finish, append `## Answer`, set `Status: resolved`, and add the gist and ticket link to Decisions-so-far.
