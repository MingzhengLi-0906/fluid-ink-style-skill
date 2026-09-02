# Repository Guidelines

## Synchronized Skill Copies

This repository is the shareable Git copy of the installed Codex skill at `C:\Users\ROG\.codex\skills\fluid-ink-figure\`.

Any task that changes, fixes, extends, documents, or optimizes `fluid-ink-figure` must apply the same skill-content change to both this repository and the installed copy in the same task. Keep `SKILL.md`, `agents/`, `assets/`, `references/`, and `scripts/` identical across both locations.

Repository-only files such as `.git/`, `.gitattributes`, `AGENTS.md`, `README.md`, and `LICENSE` are not part of the mirrored payload. Preserve them when synchronizing. After every change, compare the mirrored payload and run `quick_validate.py` against both copies. Do not report completion while either copy is stale.

## Scope

The skill creates or transforms standalone interactive Stable Fluids ink-wash figures. It does not generate scroll-driven narrative websites. Keep its input routing, approval gates, hidden-attractor invariant, dynamic pigment-channel behavior, interaction boundaries, and verification requirements synchronized.
