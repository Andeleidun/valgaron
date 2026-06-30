# Versioning Policy

Valgaron World Codex uses semantic versioning once public releases begin.

## Version Meaning

- Patch releases fix bugs, documentation, test reliability, styling defects, or
  small usability issues without changing the saved document shape.
- Minor releases add user-visible features, routes, workflows, export metadata,
  or backward-compatible schema handling.
- Major releases may include incompatible saved-document changes, removed
  workflows, or storage architecture changes.

## Saved Document Schema

The current world document schema version is `2`.

Schema details and migration expectations are tracked in
`docs/release/schema-migrations.md`.

Schema changes must include:

1. parser or migration behavior for existing saved documents when feasible;
2. focused tests for the new and previous supported schema shape;
3. import/export verification;
4. release notes that explain user impact;
5. a PWA cache review when stale app code could mishandle saved data.

## Release Checklist Ownership

Before a public release:

1. update `package.json` version;
2. update `src/Utlilities/appMetadata.ts`;
3. add a `CHANGELOG.md` entry;
4. run `npm run check:release`;
5. run the manual release checklist;
6. verify GitHub Pages deployment and PWA behavior after publishing;
7. confirm README and in-app Help still match runtime behavior.

## Dependency Updates

Dependency updates should preserve the local-only release contract and pass the
release gate. Browser, React, Vite, TypeScript, and Jest updates should receive
extra attention because they can affect startup, routing, build output, PWA
behavior, and test reliability.

Use `docs/release/versioning-and-maintenance.md` as the release operations
playbook before publishing a version.
