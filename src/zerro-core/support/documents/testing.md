# Testing Core

Use the [repository verification matrix](../../../../docs/agents/verification.md) for the final gate. During implementation, exercise the contract directly:

| Change                            | Focused coverage                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Domain rule or projector          | Edge cases and the resulting domain values                                       |
| Command compiler                  | Validation, concrete operations and resulting state                              |
| Materializer or patch application | Applied patch, predicted effects, primary-only transport and reducer integration |
| Projection wiring                 | Relevant inputs recompute, unrelated inputs preserve references                  |
| Session or read facade            | Snapshot reads and deterministic demo regression                                 |
| Replica or sync                   | Reload, undo/redo, canonical rebase and acknowledgements                         |
| Package boundary                  | `api-boundary.test.ts`                                                           |

Use [test builders](../testing/) for focused fixtures and pin locale, time and size for [demo scenarios](../demo/README.md). Keep meaningful fields visible in the fixture. Any surviving legacy comparison needs a `LEGACY-PARITY BRIDGE` marker and a concrete exit condition.

## Manual smoke

For changes to replica persistence, command shape or sync transport, exercise initial load, budget or goal edit, transaction edit, reload with pending commands, undo/redo, explicit push and logout history reset. Record which steps passed and whether the server was real or simulated.
