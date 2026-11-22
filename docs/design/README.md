# Design notes

What the player app looks like, and what looking at it closely has found. Nothing in this folder is specification; `docs/spec/` and `docs/adr/` remain the sources of truth.

| File                                                                           | Covers                                                                                                                                                                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [2026-11-21-player-app-findings.md](2026-11-21-player-app-findings.md)         | 69 things in the player app's screens that look unintended, inconsistent or unfinished, found while drawing it; checked against the code and spec. Nine were fixed on 22 November 2026 and are marked |
| [`scripts/figma-board`](../../scripts/figma-board/README.md) (outside `docs/`) | The generator that draws every state of every route in a Figma file, with the flow and the design tokens, and how to redraw the board                                                                 |

The board itself lives in the founder's Figma account, not in the repository.
