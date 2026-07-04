# Runtime Recovery QA

Use these checks before publishing changes that affect storage, import/export,
routing, or recovery UI.

## Corrupt Saved Document

1. Open the app in a local dev or production build.
2. In browser devtools, set `localStorage["valgaron.worldDocument.v2"]` to
   invalid JSON such as `{not valid json`.
3. Refresh the app.
4. Confirm the app loads starter data instead of a blank screen.
5. Open Data and confirm Local browser save explains that saved local data could
   not be used.
6. Confirm the save state shows Save Paused before the first new edit, so the
   unreadable stored value is not immediately overwritten by starter data.
7. Confirm the Diagnostics JSON reports `loadState: "recovered"` and does not
   include workspace names, entry names, summaries, notes, tags, or ids.

## Unavailable Or Failed Storage Writes

1. In a browser profile or devtools setup where localStorage writes fail,
   attempt to edit and save an entry.
2. Confirm the header save status changes to Save Failed.
3. Open Data and confirm the diagnostics report includes `saveState: "failed"`.
4. Export JSON immediately and confirm the Data page still offers copyable JSON
   if downloads are unavailable.

## Import Rejection

1. Paste invalid JSON into Data > Import JSON backup.
2. Select Preview Import.
3. Confirm the current document remains unchanged and an import error is shown.
4. Repeat with valid JSON that contains duplicate ids or orphaned relationships.
5. Confirm the import is rejected before Import Backup appears.

## Web Runtime Render Recovery

1. Introduce a temporary render throw in a route component during local testing.
2. Open that route.
3. Confirm the recovery screen appears with Retry, Open Data, Reload App, and
   copyable Diagnostics JSON.
4. Confirm the diagnostics report excludes world content by default.
5. Remove the temporary throw and confirm Retry or reload restores normal app
   rendering.

## Mobile Runtime Render Recovery

1. Introduce a temporary render throw in a mobile tab screen during local
   testing.
2. Open that tab in the Expo app.
3. Confirm the recovery screen appears with Retry View and Open Data.
4. Confirm Open Data switches to the Data tab, where JSON export, diagnostics,
   import, reset, and selected recovery snapshot restore remain available.
5. Confirm the recovery screen does not show raw error details or world content.
6. Remove the temporary throw and confirm Retry View restores normal app
   rendering.
