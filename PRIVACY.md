# Privacy

Valgaron World Codex is a local-only web app with a native mobile companion.

## What The App Stores

The web app stores worldbuilding data in the current browser profile with
`localStorage`. The mobile companion stores worldbuilding data in the installed
app's local storage area. This can include workspace names, in-fiction
worlds/planets, entries, summaries, notes, tags, relationships, custom entry
types, recovery snapshots, and import/export text visible in the app.

## What The App Does Not Do

The app does not include:

- accounts;
- cloud sync;
- hosted database storage;
- collaboration;
- telemetry or analytics;
- advertising trackers;
- payments;
- remote support access.

## Backups

Downloaded JSON exports are the portable backup path. They can include private
world content. Do not share JSON backups unless you intentionally want to share
that content.

Recovery snapshots stay in the same browser profile or mobile app storage area.
They are not portable and can be removed when browser data is cleared or the
mobile app is uninstalled.

## Diagnostics

Diagnostics are generated locally for debugging. By default they omit world
names, entry names, summaries, notes, tags, relationship notes, and ids. Review
diagnostics before sharing them.

## Browser And Device Risk

Clearing browser data, using private browsing, switching browser profiles,
uninstalling the mobile app, device loss, storage quota limits, or local storage
corruption can remove local data. Export JSON backups regularly.
