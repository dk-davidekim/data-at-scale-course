# Data Management at Scale · DX604

An interactive learning website adapted from [cseferlis/OMDSMod4Homework](https://github.com/cseferlis/OMDSMod4Homework).

**[Open the live course](https://data-at-scale-course-proposal.dk-davidekim.chatgpt.site/)** · **[Content coverage audit](docs/content-coverage.md)** · **[Architecture and data handling](docs/architecture.md)**

## What is included

- 18 full tutorials with guided steps, concept checks, links, and 19 supplied screenshots.
- 3 complete homework assignments with browser-saved checklists.
- 36 interactive SQL exercises using SQLite in a browser worker.
- A reader for all 165 original notebook cells, including 36 saved output tables.
- Search, glossary, resource maps, bookmarks, notes, and progress with JSON export/import.
- Anonymous public discussions with replies, author controls, and reporting.
- All 34 original repository files, individually downloadable and bundled as a ZIP.
- Responsive layouts for phones, tablets, and desktop screens.

No student account is required. Study records stay in the current browser's localStorage. A separate anonymous cookie enables authors to manage their public discussion posts. Clearing browser storage removes local study records; exporting a backup allows learners to restore them.

## Run locally

Install **Node.js 22.13 or newer** and Git, then:

```sh
git clone https://github.com/dk-davidekim/data-at-scale-course.git
cd data-at-scale-course
npm run install:ci
npm run build
```

For a new local checkout, initialize the discussion database once:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_wide_satana.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_quiet_starbolt.sql
```

These SQL files create tables and should only be applied once to a new database. They operate on local development storage, not the hosted course database.

Start the built application:

```sh
npm run start
```

Open the local URL printed in the terminal (normally `http://127.0.0.1:8787`). For editing with live reload, use `npm run dev` (port 5173). Keep the same origin when testing browser-saved progress.

## Project guide

| Path | Purpose |
| --- | --- |
| `app/CourseApp.tsx` | Course shell and client asset loading |
| `public/app.js`, `public/styles.css` | Interactive course experience and responsive styling |
| `public/course-data.js` | Full course content, exercises, checks, glossary, and notebook |
| `public/sql-worker.js`, `public/assets/` | Browser SQL execution and local vendor assets |
| `public/downloads/` | Unchanged original course files and ZIP |
| `app/api/[...path]/route.ts` | Anonymous discussion API |
| `db/schema.ts`, `drizzle/` | Database schema and migrations |
| `worker/`, `scripts/`, `vite.config.ts` | Vinext / Cloudflare Worker runtime and build tools |
| `.openai/hosting.json` | Existing Sites project binding; contains no credentials |
| `docs/` | Content audit, implementation notes, and source provenance |

## Hosting

The live course is hosted through Sites with a Cloudflare Worker and D1 database binding named `DB`. The existing project binding is retained in `.openai/hosting.json`. GitHub stores this source snapshot; pushing to this repository does not automatically redeploy the live website.

Publishing an update requires the Sites publishing workflow and access to the existing Site. Another hosting environment needs its own Worker/D1 configuration and migrations. GitHub Pages alone cannot run the discussion API.

## Content and attribution

Original teaching materials belong to their respective authors. The source snapshot is [commit 08ae5be](https://github.com/cseferlis/OMDSMod4Homework/tree/08ae5be4cf8e17adfec5a6c03600e331c0cabdb0), audited on 26 October 2026. Original downloads are preserved byte-for-byte. The coverage report documents the website's editorial clarifications and missing-image placeholders in the original source.

This repository does not grant a new license to third-party course materials, screenshots, libraries, or assets. Preserve their attribution and applicable licenses when reusing or redistributing them.

Actual Azure work happens in the student's Azure account. Homework is submitted through the enrolled course's Gradescope link; Blackboard remains authoritative for deadlines and institutional policy. The SQL lab is a SQLite learning environment, not a live Azure connection.

## Validation and maintenance

```sh
npx tsc --noEmit
npm run build
python3 scripts/verify-course-files.py
```

The course-file verifier checks all 34 raw files and their ZIP copies against the recorded SHA-256 manifest. See `docs/content-coverage.md` for the full lesson and notebook audit. Check navigation, mobile layout, progress persistence, import/export, SQL feedback, and anonymous discussion ownership after interactive changes.

Keep `.env*`, `.dev.vars*`, `.wrangler/`, local databases, browser exports, and credentials out of Git. The repository contains application source and schema, not learner records or hosted discussion data.
