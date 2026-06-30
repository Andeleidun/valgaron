# Security And Privacy Notes

Valgaron World Codex is a static local-first app. Security and privacy guidance
must match that architecture: no backend, no account system, no telemetry, and
no maintainer access to user data.

## Local Data

World documents and recovery snapshots are saved in browser `localStorage`.
They are readable by JavaScript running on the same origin and removable by
browser data cleanup. This is acceptable for the first local-only release only
because users are told to keep downloaded JSON backups.

## Import Safety

JSON imports are parsed as data with `JSON.parse`, then validated through the
world-document parser and import checks. Import text is never executed as code.

Invalid JSON, unsupported schema shapes, duplicate ids, and orphaned
relationships are rejected before replacing the current document.

## Markdown Safety

Markdown-style notes and Markdown exports are rendered as text in React
elements or readonly textareas. The app does not render imported Markdown as
HTML and does not use `dangerouslySetInnerHTML`.

If rich Markdown rendering is added later, it must include an explicit sanitizer
and tests for script, event-handler, URL, and embedded HTML payloads.

## Diagnostics

Diagnostics are local-only and intentionally exclude world content by default.
They should remain count/status focused unless a user explicitly chooses to
share a JSON backup or Markdown export.

## Static Hosting Headers

GitHub Pages does not support custom HTTP response headers for project pages.
Do not claim that GitHub Pages enforces a custom Content Security Policy,
Permissions Policy, or other security headers.

If the app is later deployed on a host that supports custom headers, start from
this policy and test the production build before publishing:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; manifest-src 'self'; worker-src 'self'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

The production Vite build should not require inline scripts or inline styles.
Re-test after any plugin, analytics, Markdown renderer, or service worker
change.

## Dependency Review

Run dependency checks before release and after dependency updates:

```bash
npm audit --omit=dev
npm run check:release
```

Treat runtime dependency findings as release blockers until reviewed. Dev-only
findings should still be triaged, but they are not automatically user-facing in
the static published artifact.
