# Valgaron World Codex User Guide

Valgaron World Codex is a local-only tool for drafting and organizing fiction
or tabletop worldbuilding records across the browser prototype and native mobile
companion.

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
2. Create or edit records in the section pages or mobile Entries tab.
3. Use Relationships or the mobile Links tab to connect entries, repair broken
   links, and inspect graph-style context.
4. Use Timeline, or the mobile timeline browser inside Entries, to review
   chronology and adjust event order.
5. Use Workspaces, or the mobile Worlds tab, when switching projects, managing
   in-fiction worlds/planets, or adding custom entry types.
6. Use Data regularly to download active-workspace or full-document JSON
   backups.

Use contextual Help links in entry, timeline, relationship, workspace, and data
workflows when you need focused guidance without leaving the current product
surface.

## Local Data And Backups

The browser app saves in the current browser profile with `localStorage`. The
mobile companion saves on the current device. There is no account, hosted
database, telemetry, cloud sync, collaboration, or remote backup.

Downloaded JSON is the portable backup. Active-workspace JSON backs up the
current project/universe workspace. Full-document JSON backs up every workspace
stored in the local document. Export JSON before:

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
when possible. The Data route or tab lists available snapshots so you can
restore or delete the intended snapshot. They are useful for undoing local
mistakes in the same browser profile or device storage area, but they are not
portable and can be lost with local storage data.

Keep downloaded JSON backups for work that cannot be lost.

## Offline Use

The published GitHub Pages build can be installed as a PWA in supported
browsers. Offline use means the app shell can load after a successful visit or
installation. Offline support does not protect local data from browser cleanup,
device loss, profile corruption, private browsing cleanup, or storage quota
failure.

## Diagnostics

The web Data route and mobile Data tab can export local diagnostics for
debugging storage or rendering problems. Diagnostics include app version, schema
version, route or storage status where available, recovery status, and counts.
They omit world names, entry names, notes, summaries, tags, relationship notes,
and ids by default.

Use Help in the web app or mobile Help tab for local-device behavior, backups,
diagnostics, support, and release limits. Focused Help links open the relevant
topic for entries, timelines, relationships, workspaces, or data.

Do not share JSON backups unless you intentionally want to share world content.

## Release Limits

This release does not include accounts, cloud sync, collaboration, sharing,
publishing, AI generation, payments, or localization.
