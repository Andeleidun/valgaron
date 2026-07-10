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
  factions, lore, timeline events, and records from custom entry types.
- Relationships connect codex entries.
- Timeline order controls arrange events without requiring a strict calendar.

## Everyday Workflow

1. Start on Workbench to scan recent work, pinned records, incomplete records,
   expandable review prompts, selected-record review summaries, and section
   totals.
2. Create or edit records in Workbench or the mobile Workbench tab.
3. Use Relationships or the mobile Links tab to connect entries, expand Review
   cleanup lists, repair broken links, clean up duplicate saved relationships,
   review legacy relationship text, and inspect graph-style context.
4. Use Timeline to review chronology, eras, involved records, event order, and
   dense era groups.
5. Use Knowledge, or the Project Tools area inside mobile More, to create
   custom entry types, configure field labels/help/visibility/order and
   vocabulary behavior, search schema settings, review durable vocabulary rows,
   lore definition types, and relationship-backed field rules.
6. Use Project Tools shortcuts and Review Hotspots in Utilities or More to
   reach Data, Workspaces, focused Help, and existing cleanup surfaces without
   leaving the secondary tools hub. Workbench review hotspots open the relevant
   queue, such as Unlinked or Needs Review, on both browser and mobile.
7. Use Workspaces from Utilities or More when switching projects or managing
   in-fiction worlds/planets, expanding dense workspace or world lists when
   needed.
8. Use Data from Utilities or More regularly to download active-workspace or
   full-document JSON backups.

Use contextual Help links in Workbench, timeline, relationship, Knowledge,
Utilities, workspace, and data workflows when you need focused guidance. Help
also includes a topic picker on browser and mobile so you can switch focused
topics and see which topic is currently active.

## Customizing Dashboards And Sections

Browser dashboard pages start with a recommended one- or two-column layout.
Choose a **View** preset for a task-oriented recommendation, or choose
**Customize layout** to reveal card controls. In customization mode you can
move a card earlier or later, move it to the primary, supporting, or full-width
region, select a semantic size, focus it, collapse it to the shelf, reset that
card, or undo and redo changes. Drag handles support pointer reordering; resize
handles snap to the same semantic sizes and support Left/Right Arrow keys. Use
**Cancel** to restore the arrangement from before customization, **Reset
layout** to restore the selected preset, or **Reset all dashboards** to clear
all saved browser layouts.

Collapsed cards remain available on the shelf. Important warnings and unsafe
operations can be forced visible or anchored even when an older preference
would hide or move them. On narrow screens, the same card order becomes a
single readable column automatically; saved sizes are preferences rather than
pixel coordinates.

On native mobile screens, choose **Customize Sections** to move sections
earlier or later or collapse them. **Reset Section Layout** affects the current
screen and **Reset All Section Layouts** clears every saved mobile section
arrangement. Web dashboard preferences and native mobile section preferences
are intentionally separate and remain only in the current browser profile or
installed app storage. They are not included in world exports and are not
synchronized between devices.

## Timeline

Use Timeline to browse events by explicit order, era, involved records, status,
tags, and search. The Era Manager shows named era counts and unassigned events.
Choose an era to change, enter a new or existing era name, and apply the change
to rename an era, merge one era into another, or assign unassigned events. Use
the Unassigned Era filter when you need to review unassigned events before
assigning them. Creating a new event while an era or involved-record filter is
active starts the draft with that context. Editing an event groups chronology,
linked records, and outcomes so order, date, era, involved records, and
consequences stay together. Saved events also summarize existing relationships
that connect other records to the event, while newly selected involved records
use the relationship-backed linked-field editor. On mobile, compact era groups
can expand in place when an era has more events than the default scan view
shows.

## Knowledge Setup

Custom entry types can define detail fields from Knowledge or mobile More. The
Detail fields box accepts simple names such as `Origin` and richer field hints:
use `Notes (long)` for multiline notes, `Profession (suggest)` for text values
suggested from entries you have already created, and `Status [Dormant | Active]`
for fixed suggested choices. The field preview shows how each field will be
created before you save the custom entry type.

Existing custom entry types can add more fields later, and Field Configuration
can adjust built-in or custom field labels, help text, hidden state, display
order, vocabulary attachment, and suggested or restricted vocabulary behavior
without changing the saved field key. Field rows show whether they use default
or custom settings and can be reset to defaults after experimentation. Search
field settings by section, field name, key, vocabulary, mode, relationship type,
or target section when a schema gets large.

Knowledge on the web also manages durable workspace vocabulary values for
fields such as character category, ancestry, profession, place category, faction
influence, lore category, and timeline era. Vocabulary values can be added,
edited, archived, restored, reordered, and searched from Knowledge on the web or
from mobile More. Search checks labels, descriptions, and aliases. Restricted
fields accept active vocabulary labels and active aliases, while editors can
offer a canonical replacement action when an entered value matches an alias or
different casing. Browser and mobile editors also show a compact set of visible
suggestion actions for configured fields so common values can be applied
without relying only on typed autocomplete, with a count when more suggestions
are available and a reminder that you can type another value.

Removed-field values stay saved on existing entries as hidden details until you
clear them from those entries. Knowledge on the web and More on mobile list
hidden detail cleanup targets with search so you can review affected entries
first, clear one hidden value directly, or clear all hidden values after a
recovery snapshot is created. Mobile More keeps the
first schema scan compact, but expandable controls reveal additional entry
types, relationship-backed fields, vocabulary rows, value lists, and cleanup
rows.

## Character Drafting

Character records can use a character category to show fields that fit the
entity being drafted, such as a humanoid person, construct, spirit, creature,
deity, shapeshifter, collective, or succession persona.

Use `ancestry` for humanoid race, species, people, lineage, or heritage
concepts. Use `profession` for class, job, calling, trade, office, or
adventuring-role concepts. Both fields use workspace-owned vocabulary
suggestions that can be maintained, searched, restricted, and alias-matched from
Knowledge or mobile More without turning the values into full codex records.

Use relationship-backed character fields when a fact should be visible from
both sides of the codex. Homes can link to places, affiliations can link to
factions, mentors and family can link to characters, notable events can link to
timeline records, and related lore can link to reusable rules, prophecies,
customs, abilities, or ancestry and profession notes.

## Local Data And Backups

### Entry images

Every codex entry can keep up to six ordered images. The first image is the
cover. Use `Add web image` for a complete HTTPS URI or `Upload image` for a JPEG,
PNG, WebP, or GIF up to 10 MB. Informative images need alternative text; select
`Decorative image` only when empty alternative text is intentional. Captions are
optional, and images can be moved earlier/later or removed.

Web images remain third-party links. Showing one contacts its host, and the
image can change, disappear, or fail offline. Uploads are copied into local
browser or installed-app storage and remain available offline while that local
storage remains intact.

### JSON versus ZIP

- JSON preserves the world document exactly, including every image URI and
  uploaded asset metadata, but it does not contain uploaded bytes.
- ZIP contains that same generated JSON plus every reachable uploaded image.
  Remote web images stay links and are never downloaded during export.
- Use active ZIP for the current workspace or full ZIP for every workspace.
- Import JSON or ZIP from Data. The app validates and previews the package before
  replacement. A ZIP must contain exactly its expected JSON and uploaded image
  files.

Use ZIP when uploaded images must be restorable on another browser profile or
device. Neither local storage nor recovery snapshots are cloud backups.

The browser app saves in the current browser profile with `localStorage`. The
mobile companion saves in the installed app's local storage area. There is no
account, hosted database, telemetry, cloud sync, collaboration, or remote
backup.

Downloaded JSON is the portable backup. Active-workspace JSON backs up the
current project/universe workspace. Full-document JSON backs up every workspace
stored in the local document. Export JSON before:

- clearing browser data;
- switching browsers;
- uninstalling the mobile app;
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
mistakes in the same browser profile or mobile app storage area, but they are
not portable and can be lost with local storage data.

Keep downloaded full-document ZIP backups for work that cannot be lost when it
includes uploads. JSON remains useful for documents that use only remote image
links or no images.

## Offline Use

The published GitHub Pages build can be installed as a PWA in supported
browsers. Offline use means the app shell can load after a successful visit or
installation. Offline support does not protect local data from browser cleanup,
mobile app uninstall, device loss, profile corruption, private browsing
cleanup, or storage quota failure.

## Diagnostics

The web Data route and mobile Data tab can export local diagnostics for
debugging storage or rendering problems. Diagnostics include app version, schema
version, route or storage status where available, recovery status, and counts.
They omit world names, entry names, notes, summaries, tags, relationship notes,
and ids by default.

Use Help in the web app or mobile More tab for local-device behavior, backups,
diagnostics, support, and release limits. Focused Help links open the relevant
topic for entries, timelines, relationships, Knowledge, Utilities, workspaces,
or data.

Do not share JSON or ZIP backups unless you intentionally want to share world
content. ZIP backups can also contain original uploaded image files.

## Release Limits

This release does not include accounts, cloud sync, collaboration, sharing,
publishing, AI generation, payments, or localization.
