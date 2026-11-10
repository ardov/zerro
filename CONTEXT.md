# Zerro vocabulary

## Replica

| Term              | Meaning                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Canonical state   | Latest data accepted from Zenmoney.                                                                                                                                                        |
| Replica           | Canonical state together with the root user's pending commands.                                                                                                                            |
| Outbox            | Ordered local commands awaiting acknowledgment. Also the durable undo stack when local persistence is available.                                                                           |
| Redo stack        | Commands undone in this session and available to reapply.                                                                                                                                  |
| Canonical journal | Retained linear history of accepted states. A **checkpoint** is a complete state. A **transition** is a compact change between consecutive states. An empty pull advances the cursor only. |
| Push run          | A deliberate sync captures a fixed Outbox prefix. Later commands wait for the next run.                                                                                                    |
| Chunk             | One size-bounded request in a Push run. An accepted response advances the replica before delivery continues.                                                                               |
| Cleanup phase     | Deletion tail of a multi-Chunk run after upserts. Accounts go first, child tags before their parents.                                                                                      |
| Backup            | Complete file exported from the confirmed canonical state.                                                                                                                                 |
| Restore           | Undoable change that reconciles the replica with a backup or retained history point.                                                                                                       |
| Foreign backup    | Backup belonging to another root user. Restore maps it into the signed-in root and remaps entity identities.                                                                               |

## Navigation and layout

| Term              | Meaning                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Screen            | Restorable overlay. History stores its descriptor and view. Entity data stays live and unfinished input belongs to the mounted editor.         |
| Screen instance   | One opening of a repeatable Screen. The same entity can appear in independent instances.                                                       |
| List/Details pair | A list and its owned Details. Selecting another row replaces Details. Explicit list close dismisses the pair. Back dismisses the top instance. |
| Details           | Content owned by a list's secondary area, currently a transaction editor.                                                                      |
| Popup             | Temporary overlay dismissed by Back or page navigation.                                                                                        |
| Slot              | Address-preserving history entry that absorbs Back for a Popup.                                                                                |
| Rail              | Narrow desktop navigation strip.                                                                                                               |
| Canvas            | Background behind a page's panels.                                                                                                             |
| Panel             | Independently scrolling region of the canvas. Optional panels give way when space runs out.                                                    |
| Accounts panel    | Account and debtor list beside the transactions.                                                                                               |
| Month overview    | Budget summary with warnings, income, spending, transfers and money left to assign.                                                            |

## Storybook

A **Bench** lets a reader operate a component through args. A **Showcase** displays variants together. A **Scenario** exercises an application slice with fixtures. A **Check** exists for its assertions and can run without appearing in the browsing tree.
