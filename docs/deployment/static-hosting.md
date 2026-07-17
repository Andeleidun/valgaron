# Static Hosting And PWA Deployment

Valgaron World Codex is published as a static GitHub Pages app. It has no
backend, telemetry, account system, or cloud data storage. World JSON remains in
the browser profile through `localStorage`; uploaded image bytes use IndexedDB.
Downloaded ZIP exports are the complete portability path when uploads exist.

## GitHub Pages

The deployment workflow lives at `.github/workflows/pages.yml`.

The configured project Pages URL is:

```text
https://andeleidun.github.io/valgaron/
```

In GitHub repository settings, use **Pages > Build and deployment > Source:
GitHub Actions**. The workflow handles the Pages artifact; do not configure the
repository to publish from a branch directory.

It runs on pushes to `main` and manual `workflow_dispatch`, installs dependencies with `npm ci`, builds with:

```bash
VITE_BASE_PATH=/${{ github.event.repository.name }}/ npm run build:pages
```

`build:pages` runs the normal production build and then copies `dist/index.html` to `dist/404.html`. The copied fallback lets GitHub Pages serve the React app shell for direct route refreshes such as `/valgaron/entries?sectionId=characters`.

The workflow also stamps the service worker and `deployment.json` with the
current commit. After the Pages action completes, it polls the live URL and
fails unless the published deployment metadata and service worker match that
commit and the user-facing Pages root matches the built app shell. A green Pages
workflow therefore verifies the live site, not only the uploaded artifact.

For a custom domain or user/organization root site, set `VITE_BASE_PATH=/` in the Pages workflow.

## PWA Cache Strategy

The service worker is intentionally conservative:

- Navigation requests use network-first caching so updated `index.html` is preferred when the user is online.
- Every production build receives a unique cache version, and old cache names
  are deleted on activation.
- Service-worker registration bypasses the browser's HTTP cache and reloads an
  already-controlled page once after a new worker takes control.
- Same-origin scripts, styles, images, and the manifest use stale-while-revalidate for offline repeat visits.
- The app registers the service worker only in production builds.

The app must not promise cloud durability. Offline support means the app shell
can load without a network after installation or a previous production visit;
it does not protect against browser-profile deletion, private browsing cleanup,
or browser storage failures.

## Security Headers

GitHub Pages does not support custom HTTP response headers for project pages, so
the published Pages build cannot enforce custom CSP, Permissions Policy,
Referrer Policy, or `X-Content-Type-Options` headers from this repository.

If Valgaron is later deployed on a host that supports custom headers, use the
starting policy in `docs/security-privacy.md` and test the production build
before publishing. Do not add a strict CSP meta tag to `index.html` unless the
Vite dev server, production build, service worker, manifest, and GitHub Pages
fallback have all been verified with that policy.

## Local Verification

Run:

```bash
npm run check:pwa
npm run check:release
```

`check:pwa` verifies the built manifest, service worker, install icons, metadata, and GitHub Pages fallback. `check:release` runs the full local release gate, including the runtime dependency audit, Expo Doctor, and browser smoke screenshots.

## Deployment Smoke Checklist

After a Pages deployment:

1. Open the deployed root URL and verify the Overview route loads.
2. Refresh a nested route such as `/entries?sectionId=characters` and verify the app shell still loads.
3. In Chrome, confirm the manifest is detected and the app is installable.
4. In Firefox and Chrome, verify the app still loads after one online visit when the network is disabled.
5. Confirm a new entry uses **Create** and an existing entry uses **Update**.
   Create a small test entry, then use header Undo and Redo to remove and
   restore it without reloading.
6. Use the header Save button, confirm Undo and Redo remain available, refresh,
   and confirm the entry remains while both history controls reset to disabled.
7. Export active-workspace JSON and confirm the downloaded file can be imported
   in a clean profile.
8. Export full-document JSON and confirm all workspaces import in a clean
   profile.
9. Publish release notes only after the deployed URL passes the smoke checklist.
