# Versioning And Maintenance

This document is the release-operations playbook for Valgaron World Codex.

## Release Version Source

Three files must stay aligned:

- `package.json`
- `packages/core/src/shell.ts`
- `public/sw.js`

`npm run check:metadata` verifies that the in-app version and diagnostics
version match `package.json`, and that the service worker cache version includes
the same package version.

## Release Steps

1. Decide the semantic version bump.
2. Update `package.json` and `package-lock.json`.
3. Update `packages/core/src/shell.ts` product version metadata.
4. Update `public/sw.js` cache version.
5. Add or update the `CHANGELOG.md` entry.
6. Review schema migration impact.
7. Run `npm run check:metadata`.
8. Run `npm run check:release`.
9. Run `docs/qa/manual-release-checklist.md`.
10. Deploy through GitHub Pages.
11. Run the deployment smoke checklist in
    `docs/deployment/static-hosting.md`.
12. Confirm README, in-app Help, privacy notes, and release notes match the
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

`npm run check:audit` allows the reviewed Expo CLI/config tooling finding and
fails when a new runtime vulnerability appears. Update that allowlist only after
documenting why the finding is not reachable from the published web runtime or
why the available fix is incompatible with the current Expo SDK line.

Dependency updates should be handled in small batches and followed by:

```bash
npm run check:release
```

For React, Vite, TypeScript, Jest, ESLint, or service-worker-adjacent changes,
also run manual route, PWA, and import/export checks before publishing.
For Expo, React Native, or native-module changes, treat `npm run mobile:doctor`
as the compatibility gate and avoid audit fixes that downgrade the Expo SDK.
The scripted Doctor gate skips the optional React Native Directory network
lookup and warns on Expo API network failures so restricted-network release
checks still validate local Expo SDK compatibility.

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
