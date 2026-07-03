# Valgaron World Codex User Guide

Valgaron World Codex is a local-only browser tool for drafting and organizing
fiction or tabletop worldbuilding records.

## Core Concepts

- A project/universe workspace is a separate creative project file inside the
  local document.
- An in-fiction world or planet is a setting body inside one workspace, such as
  a planet, realm, plane, moon, or major region.
- Codex entries are the editable records inside a workspace: characters, places,
  factions, lore, timeline events, and custom entry types.
- Relationships connect codex entries.
- Timeline order controls arrange events without requiring a strict calendar.

## Everyday Workflow

1. Start on Overview to scan recent work, pinned records, incomplete records,
   and section totals.
2. Create or edit records in the section pages.
3. Use Relationships to connect entries and inspect graph-style context.
4. Use Timeline to review chronology and adjust event order.
5. Use Workspaces when switching projects, managing in-fiction worlds/planets,
   or adding custom entry types.
6. Use Data regularly to download active-workspace or full-document JSON
   backups.

## Local Data And Backups

The app saves in the current browser profile with `localStorage`. There is no
account, hosted database, telemetry, cloud sync, collaboration, or remote backup.

Downloaded JSON is the portable backup. Active-workspace JSON backs up the
current project/universe workspace. Full-document JSON backs up every workspace
stored in this browser profile. Export JSON before:

- clearing browser data;
- switching browsers;
- changing devices;
- using private browsing;
- importing a backup;
- resetting starter data;
- permanently deleting important records.

Markdown export is a drafting reference for the active workspace. It is not a
restore format.

## Imports

JSON imports are validated before they can replace the current local document.
Invalid JSON, unsupported schema shapes, duplicate ids, or orphaned
relationships are rejected before the import action appears.

Import is a replacement workflow, not a merge workflow. Export JSON first if the
current local document matters.

## Recovery Snapshots

Recovery snapshots are local restore points created before destructive actions
when possible. They are useful for undoing local mistakes in the same browser
profile, but they are not portable and can be lost with browser data.

Keep downloaded JSON backups for work that cannot be lost.

## Offline Use

The published GitHub Pages build can be installed as a PWA in supported
browsers. Offline use means the app shell can load after a successful visit or
installation. Offline support does not protect local data from browser cleanup,
device loss, profile corruption, private browsing cleanup, or storage quota
failure.

## Diagnostics

The Data route can export local diagnostics for debugging storage or rendering
problems. Diagnostics include app version, schema version, route, browser,
storage status, recovery status, and counts. They omit world names, entry names,
notes, summaries, tags, relationship notes, and ids by default.

Do not share JSON backups unless you intentionally want to share world content.

## Release Limits

This release does not include accounts, cloud sync, collaboration, sharing,
publishing, AI generation, payments, native mobile apps, or localization.
