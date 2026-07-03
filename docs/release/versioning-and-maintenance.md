# Versioning And Maintenance

This document is the release-operations playbook for Valgaron World Codex.

## Release Version Source

Three files must stay aligned:

- `package.json`
- `src/Utlilities/appMetadata.ts`
- `public/sw.js`

`npm run check:metadata` verifies that the in-app version and diagnostics
version match `package.json`, and that the service worker cache version includes
the same package version.

## Release Steps

1. Decide the semantic version bump.
2. Update `package.json` and `package-lock.json`.
3. Update `src/Utlilities/appMetadata.ts`.
4. Update `public/sw.js` cache version.
5. Add or update the `CHANGELOG.md` entry.
6. Review schema migration impact.
7. Run `npm run check:metadata`.
8. Run `npm audit --omit=dev`.
9. Run `npm run check:release`.
10. Run `docs/qa/manual-release-checklist.md`.
11. Deploy through GitHub Pages.
12. Run the deployment smoke checklist in
    `docs/deployment/static-hosting.md`.
13. Confirm README, in-app Help, privacy notes, and release notes match the
    deployed behavior.

## Schema Migration Expectations

World document schema changes must include:

- parser or migration behavior when feasible;
- fixtures or tests for every supported schema shape;
- import/export round-trip tests;
- diagnostics impact review;
- PWA cache review when stale app code could mishandle stored data;
- release notes that explain the user impact.

The current schema version is documented in `docs/release/schema-migrations.md`.

## Dependency Maintenance

Runtime dependency findings from `npm audit --omit=dev` are release blockers
until reviewed. Dev dependency findings should be triaged for build, test, and
automation exposure.

Dependency updates should be handled in small batches and followed by:

```bash
npm run check:release
```

For React, Vite, TypeScript, Jest, ESLint, or service-worker-adjacent changes,
also run manual route, PWA, and import/export checks before publishing.

## User-Reported Data Issues

Support starts with diagnostics, not world backups. Ask for:

- diagnostics JSON;
- app version;
- browser and installed/PWA state;
- route and action that failed;
- whether full-document JSON export still works.

Do not ask for JSON backups or Markdown exports unless the user intentionally
chooses to share private world content.

## Release Evidence

Keep release evidence lightweight and reproducible:

- command output from `npm run check:release`;
- manual release checklist result;
- deployed URL smoke result;
- known limitations and unverified browser/PWA behavior.

Do not claim publish readiness beyond the evidence gathered for that release.
