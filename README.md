# ClipVault — enhanced edition

A local-first clipping workspace, refactored from the supplied project. No build step is required.

## Run

Open `index.html`. Click **Try the demo** for fictional in-memory data, or **Start a blank workspace** for persistent local records. No signup is required to use the local workspace.

For predictable browser storage and cloud authentication, serve the folder:

```sh
cd clipvault-enhanced
python3 -m http.server 8080
```

Open `http://localhost:8080`. Keep the same hostname/port; browser storage is origin-specific. File-based storage varies between browsers. Deploy over HTTPS.

## Features

- Responsive homepage, Overview, Accounts, Clip board, Analytics, and Settings
- Original four platforms and all original niches, plus Podcast
- Local and cloud workspaces kept separate; demo data never touches saved data
- Accounts with contacts, URLs, notes, priorities, and views
- Clip CRUD, drag-and-drop, keyboard/touch status menus, search, filters, sorting
- Posted-only clip metrics, separately labeled channel lifetime totals
- Validated JSON backup export/import; confirmation before replacement or deletion
- Light, dark, and system themes; labeled forms and native focus-trapping dialogs
- Optional Supabase email sign-in/signup and optional YouTube channel statistics sync
- No required external fonts or runtime libraries in local mode

## Safety and intentional changes

Social-account passwords and recovery codes are no longer collected, selected from cloud tables, displayed, or included in backups. Authentication passwords still go directly to Supabase for login. Never put secrets in notes.

Local records are **not encrypted or login-protected**. Export regular backups and store them privately; backups contain contact details and notes. Corrupt local data is preserved; Settings offers a raw export and explicit reset.

The new app uses `clipvault.enhanced.v1`, not the original storage keys. It never auto-imports old records or auto-merges local/cloud data. Demo records live only in memory.

The included Supabase project is preconfigured with a publishable browser key. Cloud sign-in remains optional; local workspaces do not require an account. The original backend records and any legacy passwords are not automatically migrated or deleted. See `docs/MIGRATION.md`.

Clip analytics are manual. “Recorded 24h views” sums snapshots that can have different reporting dates; it is not a live current-24h metric. Channel and clip totals may overlap and are never added together.

This edition does not implement video editing, auto-publishing, team invitations, shared multi-user workspaces, or cloud import. Cloud password recovery should be configured separately in your Supabase deployment before public launch.

## Optional Supabase

1. The frontend is preconfigured for the supplied Supabase project in `config.js`.
2. For a fresh project, manually review/run `supabase/schema.sql`. It intentionally fails if the original tables exist.
3. Never replace the browser key with a service-role or `sb_secret_` key.
4. Configure email confirmation, SMTP, site URL, and redirect allowlist in Supabase.
5. Sign in from the app and test CRUD with two independent users to verify row-level security.

The public key is not a server secret. Row-level security is the authorization boundary. Cloud adapters use explicit non-secret column allowlists, owner filters, pagination, and surfaced errors.

The version-pinned Supabase SDK loads on demand. For production, consider self-hosting the official SDK or verified SRI, and configure CSP/security headers at the host. No live Supabase/SMTP/Google integration was verified in this sandbox.

## Optional YouTube

In Settings, enter an API key restricted to your site's HTTP referrers and YouTube Data API v3. It stays in memory only. Sync supports youtube.com @handle and /channel/ URLs, not legacy /c/ or /user/ links. Sync updates channel views, subscriber count, and published video count. Use a server proxy if you require a server-only API key.

## Tests

```sh
node --test tests/core.test.cjs
```

For browser tests, install Playwright and Chromium in your development environment:

```sh
npm install --save-dev playwright
npx playwright install chromium
node tests/browser.test.cjs
```

Alternatively set `CHROME_PATH` to your installed Chromium. Screenshots and JSON results go to `test-results/` (override with `QA_DIR`). Cloud failure paths use mocks; they do not prove live backend security.

## Structure

- `index.html`, `config.js`: entry point and optional public configuration
- `css/styles.css`: responsive design system
- `js/core.js`: pure validation, metrics, and sample data
- `js/storage.js`: local/cloud adapters
- `js/app.js`: UI, forms, routing, and interactions
- `supabase/schema.sql`: fresh-project schema and RLS
- `tests/`: unit and browser regression tests
- `docs/`: review, migration, and test notes

This is a production-ready static frontend, but live authorization review, password recovery, backups, monitoring, HTTPS, CSP/security headers, and deployment hardening remain necessary before public launch.
