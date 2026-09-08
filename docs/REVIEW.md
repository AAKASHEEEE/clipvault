# ClipVault code and website review

## Rating: 6/10 as an early prototype

This is a subjective engineering/product assessment, not a benchmark or security certification. The original provides a useful creator-account model, a four-stage clip workflow, auth integration, filters, and a clear product concept. It is a promising prototype rather than a production-ready account vault.

Reviewed: the supplied README and complete static HTML application. The original homepage was rendered locally. External fonts and the Supabase SDK were unavailable in the initial offline render, so that rendering is not a claim about the live deployed website. No live database or deployed site audit was performed.

## Priority findings in the original

### High: plaintext social-account credentials

Original `accFields`, `seed`, `credRow`, account form, and README schema store `password` and `backup` as ordinary values. Password masking is only a display choice; values are available in client memory and copy-button data attributes. RLS can restrict access, but does not make this an encrypted password manager.

**Changed:** removed these fields from the enhanced data model and UI. Explicit cloud column allowlists avoid reading old credential columns. Existing database secrets still need deliberate removal/rotation by the owner.

### High: failed saves can look successful

Original `saveAccount` catches failures without returning failure to its caller. The form then closes and emits an added/updated success message. `saveClip` also swallows errors and the form closes unconditionally. Repeated submissions are not consistently blocked.

**Changed:** persistence errors propagate; forms remain open with errors; inputs are disabled during requests; local state is committed only after storage succeeds.

### High: imported or remote links need protocol validation

Original `clipHTML` uses HTML-escaped source URLs in anchor hrefs. HTML escaping does not reject javascript: or other unsafe protocols. The clip source field does not validate them.

**Changed:** allow only http(s), reject embedded credentials, validate imported/loaded data, and escape user-controlled display text.

### Medium: misleading combined analytics

Original `renderAnalytics` adds account views and clip views into an “All views”/“Combined” total. A channel lifetime count can already contain those clip views. Original clip analytics also includes non-posted clips and labels manual data “Live audience momentum.”

**Changed:** channel and posted-clip totals stay separate, unpublished clips are excluded from performance metrics, and snapshot reporting limitations are visible.

### Medium: YouTube partial updates can fail

Original `saveAccount` sends `patchOnly` to the database as part of its patch. That is an application flag, not a schema column. `viewTotal` can also keep using an existing `views: 0` rather than the refreshed `yt_views`, because nullish coalescing does not treat zero as missing.

**Changed:** explicit data allowlists; YouTube sync updates channel views, subscriber count, and published video count directly.

### Medium: auth feedback and lifecycle gaps

Original signup sets a confirmation message and immediately calls `setAuthMode`, which clears it. Failed data loads can retain previous in-memory records. Sign-out does not explicitly clear all account/clip/credential state.

**Changed:** confirmation remains visible; cloud reads clear prior workspace data and only display a loaded workspace after success; sign-out clears local in-memory account data and the API key. Cloud error/confirmation paths are tested with mocks, not live sessions.

### Medium: backend ownership and constraints

Original schema enables owner-scoped RLS, a good foundation. However, its clip policy does not explicitly verify that `account_id` belongs to the same user; null owners and invalid enum/count values also lack strong constraints.

**Changed:** fresh-project SQL uses non-null ownership, constrained statuses/priorities/counts, owner indexes, and an account-ownership check for clip writes. This SQL was not executed against a real database and still requires a two-user authorization test.

### Maintainability and usability

The original bundles extensive styling, persistence, auth, rendering, and handlers in one large HTML file. Several settings/sync handlers are difficult to discover from the visible interface. There are overlapping styling revisions, reliance on third-party fonts, unlabeled form fields, and missing modal semantics/focus handling.

**Changed:** separated domain logic, storage, UI, and CSS; added focused navigation and Settings; use native dialogs and system fonts; introduced a genuine offline demo, theme choice, backup recovery, and regression tests.

## Before a public launch

1. Test actual Supabase CRUD and RLS with two users; check session expiry and cross-tab account switching.
2. Configure email confirmation, production SMTP, recovery flow, allowed redirects, and auth abuse protection.
3. Remove/rotate legacy stored secrets deliberately after a private backup.
4. Add HTTPS, appropriate CSP/security headers, monitoring, and backend backups.
5. Test actual YouTube restrictions/quotas and cloud recovery in supported browsers.
6. Add timestamped performance snapshots if you need meaningful time-series analytics.
7. Define a real organization/member/role model before marketing shared team workspaces.

The enhanced ZIP improves this prototype substantially, but it is not labeled production-ready or given an unverified “10/10” score.
