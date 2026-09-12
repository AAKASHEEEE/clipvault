# ClipVault — Enhanced Edition

<p align="center">
  <strong>A resilient, local-first creator operations workspace for managing accounts, clip production queues, editorial schedules, and multi-platform analytics.</strong>
</p>

<p align="center">
  <a href="https://clipvaultt.netlify.app/"><img src="https://img.shields.io/badge/Live_Demo-Netlify-00C7B7?style=flat-square&logo=netlify" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Architecture-Local--First-2563EB?style=flat-square" alt="Local First">
  <img src="https://img.shields.io/badge/Build_Step-Zero_None-10B981?style=flat-square" alt="Zero Build Step">
  <img src="https://img.shields.io/badge/Backend-Optional_Supabase-3ECF8E?style=flat-square&logo=supabase" alt="Supabase Backend">
  <img src="https://img.shields.io/badge/Runtime-Vanilla_JS_ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/Tests-16_Passing-success?style=flat-square" alt="Tests Passing">
</p>

---

## ⚡ Overview

**ClipVault Enhanced Edition** is a clean, zero-framework, dependency-free web application designed for content creators, video editors, and social media managers. It decouples creative workflow management from bloated video editing tools, providing a fast cockpit for channels, clip status pipelines, editorial release scheduling, and multi-platform performance tracking.

- 🚀 **Zero Build Step**: Pure HTML5, modern CSS3 (custom properties), and vanilla ES2022. No `npm run build`, no bundler configuration, no hydration delay.
- 🔒 **Local-First & Private**: Persistent browser storage via `localStorage` with zero account required. Local data stays on your machine.
- ☁️ **Optional Cloud Sync**: Supabase authentication with Row-Level Security (RLS), user profiles, passwordless magic links, and automated password recovery.
- 📅 **Editorial Content Calendar**: Dedicated monthly schedule with daily release banners, 1-click caption/hook copying, and source video deep-linking.
- ⚡ **YouTube Shorts 1-Click Auto-Sync**: Auto-fetch live views from YouTube Shorts or videos into clip records or batch-sync up to 50 clips at once using YouTube Data API v3.
- 📊 **Multi-Platform Quick-Log Mode**: Rapid spreadsheet interface in Analytics allowing creators to tab through and log metrics across YouTube, TikTok, Instagram Reels, and Facebook in seconds.
- 🛡️ **Safer by Design**: Social platform passwords and recovery codes are strictly forbidden from being collected or stored. No secrets are ever included in notes or exported backups.

---

## 🧭 Live Demo & Dedicated Auth URLs

The application is deployed on Netlify:  
👉 **[https://clipvaultt.netlify.app/](https://clipvaultt.netlify.app/)**

ClipVault supports deep linking and direct URL routes:

| Target View | Direct URL | Description |
|---|---|---|
| **Home / Demo** | [`/#home`](https://clipvaultt.netlify.app/) | Landing page with interactive in-memory demo |
| **Password Sign In** | [`/#login`](https://clipvaultt.netlify.app/#login) | Cloud account email & password sign in |
| **Magic Link Sign In** | [`/#magiclink`](https://clipvaultt.netlify.app/#magiclink) | Passwordless sign-in via secure email link |
| **Sign Up** | [`/#signup`](https://clipvaultt.netlify.app/#signup) | Create a new private cloud workspace |
| **Forgot Password** | [`/#forgot`](https://clipvaultt.netlify.app/#forgot) | Request password reset instructions |
| **Reset Password** | [`/#reset`](https://clipvaultt.netlify.app/#reset) | Set new password following recovery redirect |

*(Query parameter formats such as `?auth=login`, `?auth=signup`, `?auth=magiclink`, and `?auth=reset` are also supported).*

---

## ✨ Features

### 1. 🎛️ Kanban Board & Editorial Calendar
- **Kanban Workflow**: Drag-and-drop cards across 4 production stages (`Queued` ➔ `Cutting` ➔ `Ready` ➔ `Posted`) with full touch and keyboard accessibility.
- **Monthly Editorial Calendar**: Switch views instantly with the **`[ 📋 Board ]`** / **`[ 📅 Calendar ]`** toggle.
- **🚀 "READY TO POST TODAY" Drop Banner**: Detects all clips scheduled for today that are ready to publish.
  - Manual publishing maintains maximum algorithmic reach on new creator accounts (avoiding third-party posting API throttling).
  - **`📋 Copy Hook`**: 1-click copy for titles and hooks into clipboard for rapid caption pasting.
  - **`Open Source`**: 1-click access to the original long-form video.
  - **`✅ Mark Posted`**: 1-click workflow advancement once published.
- **Target Date Scheduling**: Set target publishing dates directly inside the clip creation modal with zero database migrations.

### 2. ⚡ YouTube Shorts 1-Click Auto-Sync
- **Universal URL Parser**: Supports `youtube.com/shorts/...`, `youtu.be/...`, `youtube.com/watch?v=...`, and `embed/...`.
- **Modal ⚡ Fetch Views**: Paste a YouTube URL into *Source video URL* and click **`⚡ Fetch Views`**. It fetches the exact view count from Google's YouTube Data API v3 in real-time, auto-fills the *Total clip views* field, auto-populates the hook title if empty, and auto-marks the clip as `posted`.
- **Global Batch Sync**: In Analytics, click **`⚡ Sync YouTube Views`** to batch-query up to 50 YouTube clips simultaneously in a single HTTP request (`?id=id1,id2,...`) to minimize API quota consumption.
- **Persistent Key Storage**: Your YouTube Data API v3 key is saved client-side in `localStorage["clipvault.ytKey"]`. It is never sent to any intermediary server and can be cleared at any time from Settings.

### 3. 📊 Multi-Platform Quick-Log Mode (Spreadsheet Entry)
- Switch between **`[ 📊 Overview ]`** and **`[ ⚡ Quick-Log Table ]`** in Analytics.
- High-velocity spreadsheet table with editable inputs for **Total Views** and **24h Views**.
- **Keyboard-Optimized**: Press <kbd>Tab</kbd> to move rapidly between cells and log metrics across YouTube Shorts, TikTok, Instagram Reels, and Facebook in seconds.
- **Single-Clip Sync**: Clips with YouTube links include an inline **`⚡ Sync`** button directly in the table for instantaneous metric updates.
- **Data Integrity Guard**: Enforces that 24h views cannot exceed total views, preventing corrupt metrics before saving.

### 4. 👥 Channel & Account Management
- Multi-platform creator profiles (YouTube, Instagram, TikTok, Facebook, Podcasts).
- Channel metadata: handles, contact emails, phone numbers, channel URLs, notes, and priority badges (`High`, `Medium`, `Low`).
- Channel statistics (YouTube subscriber, video count, and lifetime channel views) kept separate from clip performance to avoid double-counting.

### 5. 🎨 Customization & Backups
- **Color Themes**: Toggle between System, Light, and Dark mode.
- **Creator Profiles**: Custom display name and production bio for cloud workspaces.
- **JSON Backups**: One-click validated export and safe import with confirmation dialogs and integrity checks.
- **Local / Cloud Isolation**: Keeps local and cloud workspaces segregated without accidental merges.

---

## 🚀 Quick Start

### Option 1: Direct File
Open `index.html` directly in any modern browser. Click **Try the demo** for fictional in-memory data, or **Start a blank workspace** for persistent local records.

### Option 2: Local HTTP Server (Recommended)
For consistent browser storage partitions, cookies, and Supabase redirect handling, serve the folder locally:

```bash
# Using Python 3
python -m http.server 8080

# Or using Node.js
npx serve . -p 8080
```

Open: `http://localhost:8080`

> [!NOTE]
> Browser `localStorage` is origin-isolated (`protocol + hostname + port`). Accessing the app through the same origin ensures your local workspace records persist between sessions.

---

## 🔑 Setting Up YouTube Auto-Sync (Optional)

ClipVault connects directly to Google's YouTube Data API v3 from your browser:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `ClipVault Sync`).
3. Navigate to **APIs & Services** ➔ **Library**, search for **YouTube Data API v3**, and click **Enable**.
4. Go to **APIs & Services** ➔ **Credentials**, click **Create Credentials** ➔ **API Key**.
5. *(Recommended)* Click **Edit API Key**, set **API restrictions** to **YouTube Data API v3**, and save.
6. In ClipVault, open **Settings** ➔ paste your key under **YouTube API & Analytics Sync** ➔ click **Save & Sync Channels**.

> [!TIP]
> Google provides 10,000 free quota units per day. Fetching video stats costs only 1 unit per request, and batch-fetching up to 50 videos at once still costs only 1 unit!

---

## ☁️ Optional Supabase Cloud Integration

ClipVault connects out of the box to Supabase for multi-device sync with zero server backend code required.

### 1. Database Setup
If setting up a fresh Supabase project:
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Paste and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. This creates the `accounts`, `clips`, and `user_profiles` tables with strict Row-Level Security (RLS) policies.

### 2. Configure Client Credentials
Edit [`config.js`](config.js) with your public project parameters:

```javascript
window.CLIPVAULT_CONFIG = {
  supabaseUrl: "https://<your-project-ref>.supabase.co",
  supabasePublishableKey: "sb_publishable_..." // or legacy anon key
};
```

> [!CAUTION]
> **Never** expose a Supabase `service_role` key or `sb_secret_` in `config.js` or client code. The publishable/anon key is designed to be public; security is enforced at the database level via Row Level Security (RLS).

### 3. URL Configuration (Required for Password Reset & Magic Links)
In your Supabase Dashboard:
1. Navigate to **Authentication** ➔ **URL Configuration**.
2. Set **Site URL**: `https://clipvaultt.netlify.app` (or your production domain).
3. Under **Redirect URLs**, add:
   ```text
   https://clipvaultt.netlify.app/**
   https://clipvaultt.netlify.app/
   https://clipvaultt.netlify.app/#reset
   https://clipvaultt.netlify.app/#login
   http://localhost:8080/**
   ```
4. Click **Save**.

---

## 🔒 Security & Safe-by-Design Architecture

| Principle | Implementation Details |
|---|---|
| **No Third-Party Secret Storage** | The app intentionally **does not collect or store** passwords or 2FA recovery codes for social platforms (YouTube, IG, TikTok). Use a dedicated password manager. |
| **Row Level Security (RLS)** | All Supabase tables isolate data strictly by `auth.uid() = user_id`. Cloud adapters enforce non-secret column allowlists and pagination. |
| **Input Sanitization** | `js/core.js` strictly validates and escapes strings, rejects unsafe protocols (`javascript:`, `data:`), strips embedded credentials, and rejects negative/NaN views. |
| **Local vs Cloud Isolation** | Local storage (`clipvault.enhanced.v1`) and cloud databases are never automatically merged or overwritten without explicit user action. |
| **Client-Direct API Calls** | YouTube API keys are stored client-side in `localStorage` and sent directly to Google APIs over HTTPS. Keys are never transmitted to any third-party or Supabase backend. |

---

## 🧪 Testing

ClipVault includes comprehensive automated tests covering pure domain logic, sanitization, data invariants, and schema validation.

### Unit Tests (Node.js Test Runner)
No external dependencies required:

```bash
node tests/core.test.cjs
```

Runs 16 unit assertions verifying URL normalization, credential stripping, view counters, demo data integrity, and backup date checks.

### Browser & UI Tests (Playwright)
```bash
npm install --save-dev playwright
npx playwright install chromium
node tests/browser.test.cjs
```

---

## 📁 Repository Structure

```text
clipvault/
├── index.html              # Semantic HTML5 entry point with accessible dialogs
├── config.js               # Public browser client configuration
├── css/
│   └── styles.css          # Responsive design tokens, Kanban, Calendar, Quick-Log & dark mode
├── js/
│   ├── core.js             # Pure domain logic, validators, metrics, HTML sanitization
│   ├── storage.js          # LocalStore and CloudStore (Supabase) data adapters
│   └── app.js              # UI controller, YouTube API sync, Quick-Log table, Calendar
├── supabase/
│   └── schema.sql          # PostgreSQL DDL, RLS policies, indexes, and triggers
├── tests/
│   ├── core.test.cjs       # Node unit test suite (16 passing assertions)
│   └── browser.test.cjs    # Playwright browser integration tests
├── docs/                   # Architecture documentation and guides
└── SETUP_INSTRUCTIONS.md   # Step-by-step Supabase deployment manual
```

---

## 📄 License

Open-source under the MIT License. Built with craft for creators and developers who value simplicity, performance, and security.
