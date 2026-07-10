# Valgaron World Codex Privacy Policy

**Effective date:** July 9, 2026  
**Product:** Valgaron World Codex  
**Operator:** Valgaron project maintainers  
**Contact:** Use the project support or issue-reporting channel where you received
or access Valgaron.

This Privacy Policy explains how Valgaron World Codex ("Valgaron," "we," "us,"
or "our") handles information when you use the Valgaron web prototype, static
website, installable web app, Expo mobile companion, local worldbuilding tools,
import and export workflows, diagnostics, recovery snapshots, Help content, and
related documentation.

Valgaron is designed as a local-first fiction and fantasy worldbuilding codex for
drafting, organizing, reviewing, exporting, and importing personal creative
records.

**We do not sell user data.**

The current Valgaron prototype has no accounts, authentication, backend sync,
hosted database, collaboration, hosted sharing, telemetry, advertising, payments,
or remote support access. If hosted user-data features are added later, this
Privacy Policy should be updated before those features are enabled.

---

## 1. Who May Use Valgaron

Valgaron is a fiction and fantasy worldbuilding prototype. It is not directed to
children, and it is not designed to collect personal information from children.

If a hosted account system, public sharing, collaboration, or other hosted
service features are added later, age eligibility and related privacy
requirements should be reviewed and updated before launch.

---

## 2. What Valgaron Stores Locally

Valgaron stores the creative information you choose to create, import, edit, or
save in the app.

On the web, Valgaron stores saved world documents in the current browser profile
using browser `localStorage`. The current storage key is
`valgaron.worldDocument.v4`; uploaded image bytes use browser IndexedDB.

In the Expo mobile companion, Valgaron stores saved world documents in the
installed app's local storage area.

Local worldbuilding data may include:

- workspace, project, universe, world, or planet names;
- character, place, faction, lore, timeline, and custom entry-type records;
- names, summaries, notes, tags, statuses, and pinned or archived state;
- section-specific fields and configured Knowledge fields;
- creator-defined vocabulary values, aliases, and field settings;
- relationships between records, including source, target, type, status,
  direction, and notes;
- timeline eras, involved-record links, event ordering, and chronology metadata;
- import preview text while an import workflow is open;
- exported JSON or Markdown text visible in the app before download or copy;
- recovery snapshots created before certain destructive or replacement actions;
- local save, load, recovery, and validation state needed to operate the app.

Valgaron does not send this local worldbuilding content to us. Maintainers cannot
see your browser storage, mobile app storage, JSON backups, Markdown exports,
diagnostics, screenshots, or local app state unless you choose to share them.

---

## 3. What Valgaron Does Not Collect

The current Valgaron prototype does not collect hosted or remote user data
categories because it does not include the systems that would collect them.
Valgaron does not intentionally collect:

- account, login, password, or authentication data;
- server-side copies of your world documents;
- cloud sync, backup, or multi-device account data;
- hosted collaboration, sharing, or publishing data;
- product telemetry, analytics, tracking, or advertising identifiers;
- payment, subscription, billing, or purchase data;
- precise location, contacts, microphone, camera, or photo-library data unless a
  future feature explicitly requests optional device permission;
- remote support-session data or maintainer-accessible app state.

Valgaron also does not intentionally collect local creative content from your
browser profile or mobile app storage area. Maintainers only receive content if
you choose to share diagnostics, backups, screenshots, copied text, issue
reports, or other materials outside the app.

---

## 4. Diagnostics and Support Information

Valgaron can generate local diagnostics to help debug storage, import/export,
routing, rendering, version, schema, recovery, platform, and document-count
issues.

Diagnostics are generated locally. By default, they are designed to exclude
world content such as workspace names, entry names, summaries, notes, tags,
relationship notes, and ids.

Diagnostics may include:

- app version;
- saved-document schema version;
- storage target;
- save/load/recovery state;
- recovery snapshot counts or status;
- platform runtime context, such as web route/browser or mobile save state;
- document counts;
- validation, import, export, or rendering status messages.

Review diagnostics before sharing them. If you choose to send diagnostics,
screenshots, JSON backups, Markdown exports, pasted localStorage values, or other
files to maintainers, the shared material may include private creative content.

---

## 5. How Valgaron Uses Information

Valgaron uses locally stored information to:

- open and maintain your local world codex;
- save and load the current local world document;
- support workspaces, projects, universes, worlds, and planets;
- create, edit, archive, restore, duplicate, delete, search, sort, and review
  records;
- manage custom entry types, configured fields, vocabulary values, and Knowledge
  cleanup workflows;
- display timeline, relationship, diagnostics, review, Help, and Data workflows;
- validate imports before replacing local data;
- create JSON or ZIP backups, Markdown reference exports, and local diagnostics;
- create recovery snapshots before selected destructive or replacement actions;
- recover from unsupported, unreadable, or invalid local storage where possible;
- show save, import, export, offline, diagnostics, and release-limit guidance.

Valgaron does not use local worldbuilding content for resale, third-party
enrichment, hosted analytics, tracking, advertising, or user profiling.

---

## 6. Local Storage, Cookies, and Similar Technologies

Valgaron uses browser `localStorage` on the web and installed-app local storage
in the Expo mobile companion to keep the app working locally.

The web app may also use ordinary static-site and browser technologies needed to
load the app, cache files, support installable PWA behavior, and operate the
local interface. GitHub Pages or another static host may receive ordinary web
server request information when you load the site, such as IP address, browser
request details, and timestamps, according to that host's own practices.

Valgaron does not currently use cookies for accounts, tracking, advertising, or
analytics.

Clearing browser data, using private browsing, switching browser profiles,
uninstalling the mobile app, device loss, storage quota limits, or local storage
corruption can remove local data.

---

## 7. Imports, Exports, Backups, and Recovery Snapshots

JSON and ZIP exports are the user-controlled portability paths for Valgaron.

JSON exports preserve image source URIs and uploaded-image metadata but do not
contain uploaded image bytes. ZIP exports contain the same JSON plus locally
uploaded image files. Remote web images remain links and are not copied into the
ZIP. Keep ZIP files private unless you intend to share both world content and
the original uploaded files; original files may retain EXIF or other embedded
metadata.

Displaying an HTTPS image source contacts that image's third-party host. The
host can receive ordinary request information such as IP address, user agent,
and referrer behavior. Valgaron does not fetch remote image bytes during save or
backup creation.

An active-workspace JSON export can include the current workspace's creative
content. A full-document JSON export can include every local workspace,
in-fiction world or planet record, custom entry type, entry, relationship, and
related metadata in the saved document.

Markdown reference exports can include private creative material such as names,
notes, summaries, tags, and relationship notes.

Do not share JSON backups, Markdown exports, screenshots of private records, or
pasted localStorage values unless you intentionally want to share that content.

Recovery snapshots stay in the same browser profile or mobile app storage area.
They are not cloud backups and are not portable unless exported through a backup
workflow. They can be removed when browser data is cleared, the mobile app is
uninstalled, or local storage becomes unavailable.

---

## 8. How Information Is Shared

We do not sell user data.

Valgaron does not currently share local worldbuilding data with us or with third
parties because the current prototype has no backend service, account system,
cloud sync, telemetry, or hosted collaboration.

Information may be shared only in limited circumstances:

- **By you.** You may choose to share diagnostics, screenshots, JSON backups,
  Markdown exports, issue reports, or copied app text with maintainers or other
  people.
- **By your browser, device, app store, operating system, network, or static
  host.** Those systems may process ordinary technical information needed to
  download, install, cache, or run the app, according to their own policies.
- **For legal reasons.** If maintainers receive information from you, they may
  disclose it when required by applicable law, legal process, or valid
  government request.
- **To protect the project or others.** If maintainers receive information from
  you, they may use or disclose it when reasonably needed to investigate abuse,
  security issues, intellectual-property concerns, or misuse of project
  channels.

---

## 9. Advertising, Payments, and Hosted Services

The current Valgaron prototype does not include advertising, ad targeting,
payment processing, subscriptions, paid features, or hosted services.

If advertising, payment processing, paid features, hosted storage, hosted sync,
or other hosted services are introduced later, this Privacy Policy and any
applicable terms should be updated before those practices are enabled.

---

## 10. Security

Valgaron is a local-first prototype, not a hosted data service.

Local storage is readable by JavaScript running on the same origin and can be
affected by browser profile changes, private browsing behavior, browser data
cleanup, mobile app uninstall, device loss, storage limits, storage corruption,
or device compromise.

Valgaron validates JSON imports as data and does not execute imported JSON as
code. Markdown-style notes and Markdown exports are rendered as text in the
current app and are not imported as executable HTML.

No method of storage or transmission is completely secure. Keep downloaded JSON
backups in a place you control, protect your device and browser profile, and
review files before sharing them.

---

## 11. Data Retention

Valgaron does not have hosted retention because the current prototype does not
store user data on Valgaron-controlled servers.

Local data remains in the current browser profile or mobile app storage area
until one of the following happens:

- you reset, import over, delete, or modify the local document in Valgaron;
- you clear browser data or use a browser mode that discards storage;
- you switch browser profiles, browsers, devices, or app installations;
- you uninstall the mobile app;
- the browser, operating system, or device removes local storage;
- storage quota limits, corruption, or device loss remove or damage the data.

Backups and Markdown exports remain wherever you save or share them. Valgaron
cannot delete copies that you downloaded, copied, uploaded, emailed, committed,
or otherwise shared outside the app.

If maintainers receive diagnostics, issue reports, backups, screenshots, or
other materials from you, they may retain them for as long as needed to review
the issue, maintain project records, comply with legal obligations, or protect
the project and others.

---

## 12. Your Choices

You control whether to create, save, import, export, copy, download, delete,
reset, or share Valgaron data.

You can:

- avoid saving data by not using the Save action on web;
- use Data workflows to export JSON or ZIP backups;
- use Data workflows to preview validated imports before replacement;
- delete entries, relationships, workspaces, custom entry types, and other
  supported records through app controls;
- reset the local document to starter data after confirmation;
- clear browser storage through browser settings;
- uninstall the mobile app to remove its installed-app local storage area;
- choose not to share diagnostics, backups, screenshots, or copied world
  content.

If you previously shared files or text with maintainers and want them removed
from project support records, use the same support or issue-reporting channel
where the material was shared. Maintainers may need enough information to locate
the material and may retain limited records when required or permitted for legal,
security, audit, or project-integrity reasons.

---

## 13. Legal, Copyright, and Takedown Requests

If you need to send a legal notice, copyright concern, intellectual-property
concern, or takedown request, use the project support or issue-reporting channel
where you received or access Valgaron.

A copyright or intellectual-property takedown request should include:

1. your name and contact information;
2. identification of the copyrighted work or other protected material you
   believe has been infringed;
3. identification of the content you believe is infringing, with enough detail
   to locate it;
4. a statement that you have a good-faith belief that the disputed use is not
   authorized by the rights owner, its agent, or the law;
5. a statement that the information in your notice is accurate;
6. your physical or electronic signature.

If Valgaron later hosts public user content, the project should review takedown,
repeat-infringer, contact, and DMCA-agent requirements before launch.

---

## 14. Regional Privacy Rights

Privacy rights vary depending on where you live.

Because Valgaron currently stores worldbuilding data locally instead of in a
hosted account system, many access, export, correction, and deletion choices are
handled directly on your device through the app, browser, operating system,
mobile app storage, and exported files.

Depending on your location and the information, if any, that you have shared
with maintainers, you may have rights to:

- know what information was received;
- access information;
- correct inaccurate information;
- delete information;
- export or receive a copy of information;
- object to or restrict some processing;
- withdraw consent where processing is based on consent;
- complain to a regulator.

Maintainers will respond to verified privacy requests as required by applicable
law.

---

## 15. Changes to This Privacy Policy

This Privacy Policy may be updated from time to time. When it is updated, the
effective date should be refreshed.

Material product changes, such as accounts, backend storage, cloud sync,
collaboration, public sharing, telemetry, analytics, advertising, payments, or
hosted support workflows, should be reflected in an updated policy before those
features are enabled.

---

## 16. Contact

For privacy questions, support issues, legal notices, takedown requests, or data
requests, use the project support or issue-reporting channel where you received
or access Valgaron.

Do not share JSON backups, Markdown exports, screenshots of private records, or
pasted localStorage values unless you intentionally want to share that content.
