# Support And Issue Reporting

Valgaron World Codex is a local-only tool. Maintainers cannot access user data,
browser storage, backups, diagnostics, or installed app state unless the user
chooses to share files or text.

## Before Reporting A Problem

1. Export a full-document JSON backup from Data if the app still opens.
2. Download Diagnostics from Data if the issue involves storage, import/export,
   routing, or rendering.
3. Record the browser name and version.
4. Record whether the app was installed as a PWA or opened in a browser tab.
5. Record the route where the issue happened.

## What To Share By Default

Share diagnostics first. Diagnostics are designed to avoid world content by
default. They include app version, schema version, route, browser, storage
status, recovery status, and document counts.

It is usually helpful to include:

- the diagnostics JSON;
- the exact action that failed;
- the expected result;
- the actual result;
- whether refreshing changed the behavior;
- whether Data > Full document JSON export still works.

## What Not To Share By Default

Do not share JSON backups, Markdown exports, screenshots of private records, or
pasted localStorage values unless you intentionally want to share world content.

Backups and Markdown exports can include names, notes, summaries, tags,
relationship notes, and private creative material.

## Data Recovery Triage

If saved data appears missing:

1. Do not reset starter data.
2. Check Data for recovery snapshots.
3. Export the current full-document JSON state, even if it appears wrong.
4. Check whether the browser profile, device, or private browsing session
   changed.
5. Look for downloaded JSON backups outside the browser.
6. Use diagnostics to report storage load state and recovery messages.

## Current Support Expectation

There is no hosted account support, remote data recovery, cloud backup restore,
or telemetry-backed incident review. Support is limited to the files and
diagnostics the user chooses to provide.
