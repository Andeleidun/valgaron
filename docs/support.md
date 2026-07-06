# Support And Issue Reporting

Valgaron World Codex is a local-only tool. Maintainers cannot access user data,
browser storage, backups, diagnostics, or installed app state unless the user
chooses to share files or text.

## Before Reporting A Problem

1. Download Diagnostics from Data if the issue involves storage, import/export,
   routing, or rendering.
2. Export a full-document JSON backup from Data for your own recovery records
   if the app still opens. Do not share it by default.
3. For web issues, record the browser name and version.
4. For web issues, record whether the app was installed as a PWA or opened in a
   browser tab.
5. Record the route or mobile tab where the issue happened.

## What To Share By Default

Share diagnostics first. Diagnostics are designed to avoid world content by
default. They include app version, schema version, storage target, recovery
status, document counts, and web route/browser or mobile device-save state
where available.

It is usually helpful to include:

- the diagnostics JSON;
- the exact action that failed;
- the expected result;
- the actual result;
- whether refreshing or retrying the view changed the behavior;
- whether Data > Full document JSON export still works.

## What Not To Share By Default

Do not share JSON backups, Markdown exports, screenshots of private records, or
pasted localStorage values unless you intentionally want to share world content.

Backups and Markdown exports can include names, notes, summaries, tags,
relationship notes, and private creative material.

## Data Recovery Triage

If saved data appears missing:

1. Do not reset starter data.
2. Check Data for recovery snapshots and restore or delete only the intended
   selected snapshot.
3. Export the current full-document JSON state, even if it appears wrong.
4. Check whether the browser profile, mobile app install/storage area, device,
   or private browsing session changed.
5. Look for downloaded JSON backups outside the browser or mobile app.
6. Use diagnostics to report storage load state and recovery messages.

## Current Support Expectation

There is no hosted account support, remote data recovery, cloud backup restore,
or telemetry-backed incident review. Support is limited to the files and
diagnostics the user chooses to provide.
