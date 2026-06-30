# AGENTS.md

These instructions apply to the entire repository.

## Product Direction

- Valgaron is an English-only fiction and fantasy worldbuilding prototype.
- Optimize for fast creative drafting, clear organization, and easy iteration on world records.
- The current product slice is a browser-local World Codex for places, factions, characters, lore notes, and timeline events.
- Do not preserve copied social, dating, matching, messaging, moderation, native parity, Firebase, or authentication requirements unless the user explicitly asks to add that product direction back.

## Source Of Truth

Use this order when files disagree:

1. Current runtime code.
2. `AGENTS.md`.
3. `README.md`.
4. Future planning documents, once intentionally added for Valgaron.

## Prototype Constraints

- Build for the web first as a local browser prototype.
- Local component state and `localStorage` persistence are acceptable.
- Do not make security-sensitive, privacy-sensitive, collaboration, backup, account, or availability claims for local prototype behavior.
- Keep UI copy hardcoded in English unless a real localization requirement is introduced later.
- Avoid introducing a translation system for this phase.
- Keep data models simple, typed, and easy to migrate later.
- Prefer straightforward React and TypeScript over broad abstractions.

## Code Quality

- Use TypeScript strictness already configured in the project.
- Avoid `any`; use typed unions, `unknown` narrowing, or narrow helper types.
- Keep files focused. Extract shared seed data, storage helpers, and reusable model types when they are used outside a single component.
- Remove or stop exporting copied scaffolding when it does not support the active Valgaron prototype.
- Keep the existing MUI, Emotion, and font dependencies and MUI-based reusable component infrastructure unless the user explicitly approves replacing that layer.
- Keep user-facing UI accessible with semantic labels, keyboard-usable controls, visible focus, and readable responsive layout.
- Use LF line endings.

## UI And Copy

- The app should open directly to the usable codex experience, not a marketing landing page.
- Keep the layout utilitarian and dense enough for repeated editing.
- Use direct English labels for fields and actions.
- Do not use copied social-app wording such as matches, connections, discovery, profile privacy, community moderation, or messaging unless building a deliberate Valgaron feature with that concept.

## Validation

- Run Prettier after file edits.
- For source changes, run `npm run typecheck`; this repository uses TypeScript project references, so build-mode checking is the meaningful type gate.
- Run `npx vite build` after route/export/build changes. Current Node may warn or fail if it is below Vite's required version; report that separately from code failures.
- Run `npx eslint .` when the ESLint config and dependencies are in a runnable state.
- For behavior changes, add or run the closest focused test once a test harness exists. Do not invent broad evidence gates for this prototype phase.

## Local Process Hygiene

- Track any dev server started for verification, including command, purpose, port, and process id when available.
- Stop processes started for the task before the final response unless the user asks to leave them running.
- Do not stop unrelated user processes without approval.

## PowerShell Tips

- Use `rg` for search.
- Use `Select-Object -First` instead of `head`.
