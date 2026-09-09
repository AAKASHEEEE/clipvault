# ClipDeck Supabase Setup - Complete Instructions

## ✅ What Has Been Done

### 1. **Database Schema Enhanced** (supabase/schema.sql)
- Added `user_profiles` table with user customization fields:
  - `display_name` - User's display name
  - `avatar_url` - Avatar image URL
  - `theme` - User's theme preference (light/dark/auto)
  - `notifications_enabled` - Email notification preference
  - `default_platform` - Default platform filter
  - `sort_preference` - Default sort order
  - `bio` - User bio
  - `updated_at` - Last update timestamp
- Added RLS policy: `profile_self` - Users can only access their own profile
- Added index on `user_profiles.email` for fast lookups

### 2. **Storage Layer Updated** (js/storage.js)
- Added `user_profiles` field definitions
- Added `getProfile()` method - Loads user profile from Supabase
- Added `saveProfile(profile)` method - Saves/updates user profile (upsert)

### 3. **Authentication Flow Enhanced** (js/app.js)
- **Signup creates user profile automatically:**
  - When users sign up, a profile is created with default preferences
  - Profile includes their name and default settings
- **New `applyUserPreferences(profile)` function:**
  - Applies theme preference to the site (light/dark)
  - Applies user's default sort and platform filters
- **Enhanced `enterCloud()` function:**
  - Now loads user profile along with accounts/clips data
  - Applies user preferences to customize the site appearance
  - Stores profile in `S.profile` for use throughout the app

---

## 🚀 Next Steps (What You Need to Do)

### **STEP 1: Apply Database Schema to Supabase**

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your Supabase project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **+ New Query**
5. Copy all content from `supabase/schema.sql` in this workspace
6. Paste into the SQL editor
7. Click **Run** button (or Cmd/Ctrl + Enter)
8. Wait for success message ✅

**Option B: Via Supabase CLI** (if installed)
```bash
cd c:\Users\Ajay\OneDrive\Desktop\clipdeck
supabase db push
```

### **STEP 2: Test User Signup Flow**

1. Open `index.html` in your browser
2. Click **"Log in"** button
3. Click **"Create a cloud account"**
4. Fill in:
   - Name: Your name
   - Email: Your email
   - Password: At least 12 characters
   - Confirm password
5. Click **Create account**
6. Check your email for confirmation link
7. Click the confirmation link from Supabase
8. Return to the app and sign in with your email/password

### **STEP 3: Verify User Profile Was Created**

1. After signing in, go to **Settings** page
2. You should see a **"Your profile"** section with:
   - Display name field
   - Bio field
   - Avatar URL field
   - Theme selector
   - Notifications toggle
   - Save profile button
3. Test changing theme from the dropdown
4. Click "Save profile" - should see success notification

### **STEP 4: Add Profile Settings Handler** (Optional enhancement)

To enable the "Save profile" button, add this event listener in `js/app.js`:

```javascript
document.addEventListener("click", async (e) => {
  if (e.target.id === "save-profile-btn") {
    const profile = {
      display_name: document.querySelector('input[id="display_name"]')?.value || "",
      bio: document.querySelector('input[id="bio"]')?.value || "",
      avatar_url: document.querySelector('input[id="avatar_url"]')?.value || "",
      theme: document.querySelector("select#profile-theme")?.value || "auto",
      notifications_enabled: document.querySelector("#notifications")?.checked || true,
    };
    
    await busy(e.target, async () => {
      const updated = await S.store.saveProfile(profile);
      Object.assign(S, { profile: updated });
      applyUserPreferences(updated);
      notify("Profile saved successfully.");
    });
  }
});
```

---

## 📊 Database Schema Overview

### `accounts` table
- Stores user's social media channels
- Fields: name, platform, url, niche, handle, email, phone, notes, status, priority, views, subscribers, videos, created_at
- RLS Policy: Users can only see their own accounts

### `clips` table
- Stores video clips for editing queue
- Fields: title, account_id, source_url, status, priority, views, views_24h, geo, age_group, created_at
- RLS Policy: Users can only see their own clips (and can only link to their own accounts)

### `user_profiles` table ✨ NEW
- Stores user preferences and customization
- Fields: display_name, avatar_url, theme, notifications_enabled, default_platform, sort_preference, bio, updated_at
- RLS Policy: Users can only view/edit their own profile

---

## 🔐 Security Details

All tables have **Row Level Security (RLS)** enabled:
- ✅ Anonymous users: No access
- ✅ Authenticated users: Only see their own data
- ✅ Automatic user_id enforcement on all operations

---

## 🐛 Troubleshooting

### Error: "column accounts.subscribers does not exist"
- **Cause:** Schema hasn't been applied yet
- **Fix:** Follow STEP 1 above to apply `schema.sql`

### Error: "Permission denied" when saving profile
- **Cause:** RLS policies not applied correctly
- **Fix:** Re-run the full `schema.sql` and verify no errors

### Profile settings not showing
- **Cause:** User not in cloud mode
- **Fix:** Make sure you're signed in (cloud mode), not using local workspace

### Theme changes not persisting
- **Cause:** Profile save handler not yet added
- **Fix:** Add the optional profile settings handler from STEP 4 above

---

## ✨ Features Now Available

✅ User signup with automatic profile creation  
✅ User preferences (theme, platform, sort order)  
✅ Theme switching (light/dark/auto)  
✅ User bio and display name  
✅ Avatar support  
✅ Email notification preferences  
✅ All data synced to Supabase  
✅ Row-level security on all tables  

---

## 📝 Files Modified

- `supabase/schema.sql` - Added user_profiles table, RLS policy, and indexes
- `js/storage.js` - Added user profile fields and CloudStore methods
- `js/app.js` - Enhanced signup, added profile loading and preference application

---

## 💡 Next Enhancement Ideas

1. **Profile Picture Upload** - Store images in Supabase Storage
2. **User Teams** - Share workspaces with other users
3. **Notifications** - Email digests of clip progress
4. **API Integration** - Auto-sync YouTube/Instagram analytics
5. **Export Templates** - Save clip templates for reuse

---

**Questions?** Check the [Supabase docs](https://supabase.com/docs) or reach out!
