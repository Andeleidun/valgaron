# Manual Release Checklist

Run this checklist before publishing a public GitHub Pages release.

## Automated Gate

1. Run `npm run check:release`.
2. Confirm the browser smoke screenshots were written under `.tmp/browser-smoke`.
3. Run `npm run typecheck:mobile`.
4. Run `npm run test:mobile`.
5. Rerun `npm run mobile:doctor` only when investigating an Expo compatibility
   issue from the release gate.
6. Rerun `npm run check:audit` only when investigating dependency findings from
   the release gate.
7. Run the route-intent tests when shell routes, query params, hashes, tabs, or
   focused workflows change:
   `npx jest packages/core/src/routeIntents.test.ts mobile/src/navigation/mobileRoutes.test.ts --runInBand`.
8. Run `npm run generate:taxonomies` before the release gate when a taxonomy
   JSON artifact changed, then confirm the generated diff is intentional.
9. If schema, Knowledge vocabulary editing, or review aggregation changed,
   confirm `UX_DESIGN_UPDATE.md`, `docs/versioning.md`, and
   `docs/release/schema-migrations.md` still document the intended product
   decision gate.
10. Run `git diff --check`.
11. Review `docs/qa/web-mobile-parity-checklist.md` and update the parity debt
    ledger for any intentional web/mobile mismatch in this release.

## Browser Matrix

Check the production build or deployed GitHub Pages URL in:

- current Chrome;
- current Firefox;
- installed PWA mode where supported.

## Responsive Layout

Check these routes at phone, tablet, and desktop widths:

- Workbench;
- Timeline;
- Relationships;
- Knowledge;
- Utilities;
- Workbench filtered to Characters;
- Data;
- Workspaces;
- Help.

Confirm navigation wraps or scrolls without covering controls, form labels stay
readable, dialogs remain usable, and no primary content overlaps.
Confirm the phone-width web header keeps Save and Data Menu visible, and the
native mobile tab shell shows recognizable icons and labels for each primary
codex area.

## Keyboard And Focus

1. Use Tab and Shift+Tab through header navigation, forms, filters, dialogs, and
   destructive confirmations.
2. Confirm visible focus is always present.
3. Confirm Escape closes confirmation dialogs.
4. Confirm focus returns to the initiating control after dialogs close.
5. Confirm the skip link reaches main content.

## Core Workflows

1. Create, edit, pin, archive, restore, duplicate, and permanently delete an
   entry; confirm selected-record review summaries show drafting prompts and
   legacy link text when present, then expand selected-record drafting prompts
   when the context summary is compacted.
2. Create, edit, filter, delete, expand Review cleanup lists, review legacy
   relationship text, and duplicate-cleanup a relationship from Relationship
   Studio.
3. Create and reorder timeline events, edit chronology, linked-record, and
   outcome fields, create one event from an active era or involved-record filter
   and confirm that context seeds the draft, confirm a saved event summarizes
   existing relationships that connect other records to the event, expand dense
   mobile era groups when available, filter to Unassigned Era when an unassigned
   event exists, then rename or merge an era from the Era Manager and confirm
   affected events move to the target era.
4. Create, switch, duplicate, archive, restore, delete, and expand large
   workspace lists when enough workspaces exist.
5. Create a custom entry type from Knowledge or mobile More, add multiline and
   suggested-choice fields after creation, configure field label, help text,
   hidden state, order, vocabulary attachment, and suggested/restricted mode,
   confirm custom/default indicators appear, reset a changed field to defaults,
   search field settings, confirm the browser Vocabulary Manager and mobile
   More can add, edit, archive, restore, reorder, and search vocabulary values
   by label, description, and alias, confirm restricted fields accept active
   aliases and offer canonical replacement when needed, confirm browser and
   mobile editors show compact visible suggestion actions for configured fields
   with a more-suggestions count and typed-value cue when capped, confirm
   existing values appear in the hidden detail cleanup queue, search cleanup
   rows, review the affected entry, clear one cleanup row, choose Clear All
   Hidden Details for the remaining rows, confirm a recovery snapshot is
   available, then delete the type.
6. Open Utilities and mobile More, confirm Project Tools shows Review Hotspots,
   and follow available hotspot actions to the existing Workbench, Timeline,
   Relationship Studio, or Knowledge cleanup surfaces. When the Workbench
   hotspot points to a review queue such as Unlinked or Needs Review, confirm
   the action label includes the target queue count and the target queue is
   active rather than the default Workbench index. Open focused Utilities Help,
   confirm browser Help and mobile Help both show the Help topics picker with
   Utilities selected, then follow Open Utilities back to Project Tools.
7. Create, archive, restore, delete, and expand large in-fiction world/planet
   lists when enough worlds exist.

## Mobile Companion

1. Open the Expo app locally.
2. Confirm Workbench, Timeline, Links, More, Workspaces, Data, and Help load.
3. Create and edit an entry, link it with a relationship, expand Links Review
   cleanup lists and Graph records when available, run duplicate relationship
   cleanup from Links, switch workspaces, and return to the edited entry.
4. Export JSON from Data and confirm the text matches the selected export mode.
5. Import valid JSON, reject invalid JSON, reset starter data, and restore a
   selected recovery snapshot.
6. Follow the mobile runtime recovery steps in
   `docs/qa/runtime-recovery.md` when route, shell, or recovery UI changes are
   part of the release.
7. Complete the standard workflow in
   `docs/qa/web-mobile-parity-checklist.md` when entry, relationship,
   workspace, Data, import/export, or shared model behavior changes.

## Data And Recovery

1. Export active-workspace JSON and import it into a clean browser profile.
2. Export full-document JSON and confirm all workspaces import into a clean
   browser profile.
3. Export Markdown and confirm it is readable.
4. Confirm invalid import JSON is rejected without changing data.
5. Confirm recovery snapshots appear before destructive actions.
6. Restore a recovery snapshot.
7. Follow `docs/qa/runtime-recovery.md` for corrupt storage, failed storage
   writes, import rejection, and runtime render recovery.

## Security And Privacy

1. Confirm `PRIVACY.md`, in-app Help, README, and `docs/security-privacy.md`
   make the same local-only, no-telemetry, no-account claims.
2. Confirm diagnostics exclude world names, entry names, notes, summaries, tags,
   relationship notes, and ids by default.
3. Confirm Markdown notes and exports render as text, not executable HTML.
4. Run `npm run check:audit` and review any new runtime dependency findings.
5. Confirm static-hosting docs do not claim GitHub Pages enforces custom
   security headers.

## PWA And Deployment

1. Build with `npm run build:pages`.
2. Run `npm run check:pwa`.
3. Deploy to GitHub Pages.
4. Refresh a nested route on the deployed URL and confirm it falls back to the
   app shell.
5. Install the PWA where supported and confirm the app shell loads after going
   offline.
6. Confirm offline wording and documentation do not imply cloud backup.

## Documentation

1. Confirm README, in-app Help, `docs/user-guide.md`, `docs/support.md`, and
   `docs/versioning.md` describe the same storage and backup behavior.
2. Confirm `CHANGELOG.md` has an entry for the release.
3. Confirm release notes do not overstate durability, privacy, offline behavior,
   or professional readiness beyond verified evidence.
