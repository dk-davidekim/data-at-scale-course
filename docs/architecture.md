# Data Management at Scale · DX604

A student learning workspace adapted from [cseferlis/OMDSMod4Homework](https://github.com/cseferlis/OMDSMod4Homework).

Includes 18 complete tutorials, 3 homework assignments, 36 SQL exercises, 19 original screenshots, course files, a glossary, private study records, and public discussions without accounts. Assignment work takes place in Azure and is submitted through the enrolled course in Gradescope.

## Local development

Install with the Sites dependency helper, then run `npm run dev`. No local sign-in is needed.

Build with the Sites build helper. The project uses Vinext and the supplied Sites Worker runtime. Keep `.openai/hosting.json` bound to its existing Site ID.

## Data and access

Study records use localStorage only, under `course-v3-local`. Existing guest records are migrated from `course-v2-guest`. No study records are uploaded to the server. JSON export/import allows learners to transfer their work. Imports validate course identifiers, field types, and size limits.

D1 binding: `DB`. Migrations are in `drizzle/`. Public discussions use the `guest_threads`, `guest_replies`, and `guest_reports` tables. A random 256-bit HttpOnly, SameSite=Lax, host-only browser cookie identifies the author; only its SHA-256 hash is stored. Secure is enabled on HTTPS. Mutation requests enforce same-origin JSON. Clearing the cookie loses author controls. No sign-in, registration, account syncing, or account-based moderation interface is provided. Reports are retained for operator review.

The previous restricted discussion and account tables are retained unchanged and are not exposed by the public discussion API. They are never migrated into public threads. New study data is never written into those tables. The former moderator email secret is not used.

Local data and `.dev.vars` must remain ignored. They are not production data and must never be included in publication archives.

## Course content

`public/course-data.js` contains the source snapshot, full Markdown, guided steps, checks, glossary, SQL exercises, and a complete reader for all 165 original notebook cells and saved outputs. `public/downloads` contains the original source files and archive. Each tutorial links back to its original GitHub page. The SQL engine uses SQLite in a dedicated worker; it does not execute Azure or Cosmos queries or connect to student cloud accounts.

The original source includes screenshot placeholders. Only actual supplied screenshots are embedded. Editorial corrections are disclosed next to the relevant content. The full original course guide is included under Resources, with its example deployment folder corrected to the actual repository path.

When updating content, compare the source repository, preserve the raw downloads, update the snapshot commit, recheck the SQL exercise reference results, and verify every route and download. Product interfaces and current prices should be checked against the linked official documentation. Blackboard remains the source of exact course deadlines and institutional policy.

## Validation

Before publication, verify lesson navigation and full content, mobile widths, SQL correct/incorrect results, notes persistence, discussion CRUD, ownership restrictions, and local downloadable assets. Build and publish using the Sites source helper to keep source and deployment archives matched.
