# Non-Redux consumers

`zerro-core/headless` exports snapshot reads, selected command compilers, and
pure replica operations. It owns no mutable state, HTTP, persistence, or tool
registration. The backup adapter also consumes this entrypoint.

The repository-local CLI has been removed. Its implementation history is in
Git. The unimplemented Tool-layer design lives in
`private/work/agent-tools/spec.md`, and the earlier design notes are preserved
in `private/work/core-simplification/previous-documents.md`. Neither file is part
of this repository.

See [Architecture](./architecture.md#module-boundaries) for the current
entrypoints and [Testing](./testing.md) for their dependency checks.
