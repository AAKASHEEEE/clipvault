# ClipVault

ClipVault is a browser-based workspace for creators, editors, and content teams who manage social media clipping operations.

It combines creator account management, a production clip board, publishing status, and clip performance analytics in one focused dashboard.

## Features

- Public product homepage with responsive layout and product positioning
- Supabase email authentication with name, email, password, and confirmation fields
- Private dashboard for authenticated users
- Account vault for YouTube, Instagram, TikTok, and Facebook channels
- Account metadata including niche, priority, status, links, notes, and view totals
- Clip workflow with Queued, Cutting, Ready, and Posted stages
- Posted-clip analytics for total views, last-24-hour views, location, and age group
- Analytics grouped by account, platform, niche, and overall totals
- Search, sorting, platform filters, niche filters, drag-and-drop clip movement
- Responsive light dashboard theme with reduced-motion and performance considerations

## Run Locally

The project is a single static HTML file and does not require a build step.

Open `index.html` directly in a browser, or serve the folder with any static web server:

```powershell
cd C:\Users\Ajay\Desktop\clipdeck
npx serve .
```

## Supabase Setup

The frontend is configured with the Supabase project URL and publishable browser key.

Create the required tables in Supabase SQL Editor:

```sql
create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  platform text not null,
  url text not null,
  niche text not null default 'other',
  handle text,
  email text,
  phone text,
  password text,
  backup text,
  notes text,
  status text not null default 'active',
  priority text not null default 'medium',
  views bigint not null default 0,
  yt_subs bigint,
  yt_videos bigint,
  yt_views bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  title text not null,
  source_url text,
  status text not null default 'queued',
  priority text not null default 'medium',
  views bigint not null default 0,
  views_24h bigint not null default 0,
  geo text,
  age_group text,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.clips enable row level security;

create policy "Users manage their accounts"
on public.accounts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage their clips"
on public.clips for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

For development, email confirmation can be disabled in Supabase Authentication settings. For production, configure a custom SMTP provider.

## Clip Workflow

1. Create a clip. New clips start in `Queued` and request only production details.
2. Move the clip through `Cutting` and `Ready` as work progresses.
3. Move the clip to `Posted`. The app then exposes performance fields.
4. Save total views, last-24-hour views, audience location, and age group.
5. Review the Clip Analytics section for aggregate performance.

## Security Notes

- Only the Supabase publishable key belongs in browser code. Never expose a service-role key.
- Row-level security should remain enabled on both tables.
- Credential fields are sensitive. Use strong Supabase authentication and production SMTP before real deployment.
- The app is currently a static single-page frontend. A production deployment should use HTTPS and a real domain.

## Project Structure

```text
clipdeck/
├── index.html
└── README.md
```
