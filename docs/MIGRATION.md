# Migration and deployment notes

No live database, GitHub repository, or deployed website was modified.

## Existing project

Do NOT run the fresh-project schema over an existing database. Make a private database backup, inspect the actual policies/columns, and test changes on a clone first. Retrieve your existing project URL and publishable key from your original configuration or Supabase dashboard and place them in `config.js` only when you intentionally want this frontend to connect.

Existing account/clip IDs are compatible if UUIDs; records must meet the new validation rules. Fix invalid URLs, negative/fractional counts, 24h views exceeding totals, null owners, invalid states, and clips linked to another user's account before switching. The app fails visibly rather than silently discarding such data.

The enhanced frontend selects explicit non-secret columns. Old `password` and `backup` columns, database backups, and copies of the original app may still contain secrets. After securing a private backup and rotating sensitive credentials as appropriate, remove legacy secrets through a reviewed migration. This deliverable does NOT run destructive cleanup SQL.

Update your existing clip write policy to verify both `auth.uid() = user_id` and ownership of a non-null linked account. Audit all policies: permissive policies can combine with OR, so adding a stricter policy without removing an older permissive one may not restrict anything. Test SELECT/INSERT/UPDATE/DELETE with two separate users. Make ownership non-null only after repairing existing records.

## Local data

The original used `cv.accounts.v2` / `cv.clips.v1`; this version uses a new single entry `clipvault.enhanced.v1`. Old data is left intact and never auto-uploaded. Enhanced imports accept its versioned JSON format, validate records and references, and replace local data only after explicit confirmation. Cloud import is intentionally unavailable to avoid partial uploads and duplicates.

Use the same served origin to keep the local workspace. file:// storage behavior differs by browser. Export backups before changing hostnames, ports, browser profiles, or clearing site data.

## Scope differences

No credential vault, cloud bulk import, or password-reset UI. YouTube channel views, subscriber count, and published video count are supported as non-sensitive metrics. Video editing and publishing remain outside the app. The optional cloud sign-in/signup code and SQL need live deployment testing. Demo mode uses fictional data in memory only.
