# Supabase Backend Parity Checklist

This checklist makes the currently active backend surface explicit for this repo.

## Active Edge Functions

These functions are verified from the current client code and active backend flows, and are expected to be deployed together for parity.

| Function | Flow | Verified from repo | Deployment expectation |
| --- | --- | --- | --- |
| `check-and-record-scan` | Scan eligibility and reservation | `services/api.ts` | Required |
| `cancel-scan-reservation` | Scan reservation rollback after upload failure | `services/api.ts` | Required |
| `analyze-scan` | Scan analysis | `services/api.ts` | Required |
| `coach-generate-response` | Coach generation | `services/coach.ts` | Required when `coach_enabled` is on |
| `social-reserve-upload` | Social media upload reservation | `services/social.ts` | Required when `social_enabled` is on |
| `social-create-post` | Social post creation | `services/social.ts` | Required when `social_enabled` is on |
| `social-create-comment` | Social comment creation | `services/social.ts` | Required when `social_enabled` and `social_comments_enabled` are on |
| `social-set-reaction` | Social reactions | `services/social.ts` | Required when `social_enabled` is on |
| `social-record-impressions` | Social impression tracking | `services/social.ts`, `screens/SocialScreen.tsx` | Required when `social_enabled` is on |
| `social-report-content` | Social reporting | `services/social.ts` | Required when `social_enabled` is on |
| `sync-subscription-status` | Subscription entitlement sync | `contexts/AuthContext.tsx` | Required when RevenueCat-backed subscription sync is in use |
| `revenuecat-webhook` | Subscription webhook ingestion | `supabase/functions/revenuecat-webhook`, shared RevenueCat sync helpers | Required when RevenueCat webhook sync is in use |
| `check-ip-signup` | Signup IP eligibility and recording | `contexts/AuthContext.tsx` | Required |
| `send-verification-email` | Email verification send | `contexts/AuthContext.tsx` | Required |
| `verify-email-code` | Email verification check | `contexts/AuthContext.tsx` | Required |
| `cleanup-orphan-user` | Signup cleanup for unverified orphan users | `contexts/AuthContext.tsx` | Required |

Functions present in the repo but not included in the active deployment list for this hardening pass:

- `social-toggle-like`
- `social-moderate-content`
- `upgrade-to-premium`
- `schedule-scan-notifications`
- `send-push-notifications`
- `delete-all-users`

## Feature Flags and Config Parity

Server-side feature gating is read from `app_feature_flags`.

Client-side feature gating is read from the `app_config` compatibility view.

Both must exist and remain in sync because:

- edge functions use `app_feature_flags`
- the mobile app reads `app_config`
- `app_config` is created as a compatibility view on top of `app_feature_flags`

Verified feature/config fields used by the active app/backend flows:

- `social_enabled`
- `social_comments_enabled`
- `coach_enabled`
- `moderation_enabled`
- `entry_offer_enabled`
- `entry_offer_offering_id`
- `rollout_percentage`
- `post_rate_limit_per_day`
- `comment_rate_limit_per_hour`
- `report_rate_limit_per_day`
- `repeated_rejection_threshold`
- `rejected_content_cooldown_hours`
- `coach_cache_ttl_minutes`

## Required Supabase Resources

### Scan flow

Required for the current scan eligibility, upload, analysis, and history flows:

- Table: `user_profiles`
- Table: `scans`
- Table: `scan_metrics`
- Storage bucket: `scan-images`
- View: `user_current_global_score`
- RPC: `get_premium_potential_data`

### Social flow

Required for the current social feed, posting, commenting, reacting, impression, and reporting flows:

- Table: `app_feature_flags`
- View: `app_config`
- Table: `social_posts`
- Table: `social_comments`
- Table: `social_reports`
- Table: `social_post_likes`
- Storage bucket: `social-posts`
- RPC: `get_social_feed_page`
- RPC: `get_social_comments_for_post`
- RPC: `check_social_rate_limit`
- RPC: `get_social_rejection_cooldown`
- RPC: `record_social_impressions`
- RPC: `set_social_post_reaction`

### Coach flow

Required for the current coach generation and fallback/cache flow:

- Table: `coach_entries`
- Column: `user_profiles.coach_persona_key`
- Table: `scans`
- RPC: `compute_coach_cache_key`

Coach-specific runtime requirements:

- Edge function: `coach-generate-response`
- Feature flag: `app_feature_flags.scope='mobile'` with `coach_enabled=true`
- Secret: `N8N_COACH_GENERATE_WEBHOOK_URL`
- After setting or changing `N8N_COACH_GENERATE_WEBHOOK_URL`, redeploy `coach-generate-response` with `supabase functions deploy coach-generate-response --no-verify-jwt` or rerun `deploy_functions.ps1` before smoke-testing Coach

### Subscription and entitlement flow

Required for the current RevenueCat-backed sync surface:

- Table: `user_profiles`
- Columns: `user_profiles.subscription_status`, `user_profiles.subscription_expiry_date`, `user_profiles.subscription_platform`
- Table: `revenuecat_webhook_events`

### Auth and verification flow

Required for the current signup and verification flow:

- Table: `user_profiles`
- Column: `user_profiles.email_verified`
- Table: `verification_codes`
- Table: `trusted_devices`
- RPC: `check_ip_signup_allowed`
- RPC: `record_ip_signup`
- RPC: `invalidate_previous_codes`

## Verified Environment Variables and Secrets

Only variables referenced by the current codebase are listed here.

### Required server-side secrets

Always required for the active server surface:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for scan analysis:

- `N8N_SCAN_ANALYZE_WEBHOOK_URL`

Required for RevenueCat-backed subscription sync:

- `REVENUECAT_API_KEY`

### Required only when feature-gated flows are enabled

Required when `coach_enabled=true`:

- `N8N_COACH_GENERATE_WEBHOOK_URL`

Required when `social_enabled=true` and `moderation_enabled=true` for post creation:

- `N8N_SOCIAL_CREATE_POST_WEBHOOK_URL`

Required when `social_enabled=true`, `social_comments_enabled=true`, and `moderation_enabled=true` for comment creation:

- `N8N_SOCIAL_CREATE_COMMENT_WEBHOOK_URL`

### Optional but verified server-side variables

- `N8N_SOCIAL_REPORT_WEBHOOK_URL`
- `N8N_SCAN_ANALYZE_SUPER_WEBHOOK_URL`
- `REVENUECAT_API_BASE_URL`
- `REVENUECAT_PREMIUM_ENTITLEMENT_ID`
- `REVENUECAT_WEBHOOK_AUTHORIZATION`
- `REVENUECAT_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS`

### Optional for development, required for real email delivery

- `RESEND_API_KEY`

If `RESEND_API_KEY` is missing, `send-verification-email` falls back to logging the code instead of sending a real email.

### Verified public app runtime env

Required for the mobile app to boot and reach Supabase:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Optional public runtime config used by active code:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_APTABASE_APP_KEY`
- `EXPO_PUBLIC_APTABASE_HOST`

## Deploy Commands

Run these from the repository root.

### 1. Link the target Supabase project

```powershell
supabase link --project-ref <your-project-ref>
```

### 2. Apply migrations

```powershell
supabase db push
```

### 3. Set core secrets

```powershell
supabase secrets set `
  SUPABASE_URL="https://<your-project-ref>.supabase.co" `
  SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>" `
  N8N_SCAN_ANALYZE_WEBHOOK_URL="https://<your-n8n>/webhook/scan-analyze"
```

### 4. Set social and coach secrets

Only set the secrets for the flows you are enabling.

```powershell
supabase secrets set `
  N8N_COACH_GENERATE_WEBHOOK_URL="https://<your-n8n>/webhook/coach-generate" `
  N8N_SOCIAL_CREATE_POST_WEBHOOK_URL="https://<your-n8n>/webhook/social-create-post" `
  N8N_SOCIAL_CREATE_COMMENT_WEBHOOK_URL="https://<your-n8n>/webhook/social-create-comment" `
  N8N_SOCIAL_REPORT_WEBHOOK_URL="https://<your-n8n>/webhook/social-report" `
  N8N_SCAN_ANALYZE_SUPER_WEBHOOK_URL="https://<your-n8n>/webhook/scan-analyze-super" `
  ALLOWED_ORIGINS="https://<your-web-domain>,http://localhost:8081,http://localhost:19006"
```

Coach reminder:

- If `coach_enabled=true`, `coach-generate-response` will return `coach_webhook_not_configured` until `N8N_COACH_GENERATE_WEBHOOK_URL` is set.
- After setting that secret, redeploy `coach-generate-response` or rerun `powershell -ExecutionPolicy Bypass -File .\deploy_functions.ps1`.

### 5. Set subscription and email secrets

Only set the RevenueCat webhook authorization secret if you are validating webhook authorization headers.

```powershell
supabase secrets set `
  REVENUECAT_API_KEY="<your-revenuecat-api-key>" `
  REVENUECAT_API_BASE_URL="https://api.revenuecat.com" `
  REVENUECAT_PREMIUM_ENTITLEMENT_ID="premium" `
  REVENUECAT_WEBHOOK_AUTHORIZATION="Bearer <your-webhook-token>" `
  REVENUECAT_WEBHOOK_SECRET="<your-webhook-secret>" `
  RESEND_API_KEY="<your-resend-api-key>"
```

### 6. Deploy the verified active edge functions

Recommended:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy_functions.ps1
```

Direct equivalent:

```powershell
supabase functions deploy check-and-record-scan --no-verify-jwt
supabase functions deploy cancel-scan-reservation --no-verify-jwt
supabase functions deploy analyze-scan --no-verify-jwt
supabase functions deploy coach-generate-response --no-verify-jwt
supabase functions deploy social-reserve-upload --no-verify-jwt
supabase functions deploy social-create-post --no-verify-jwt
supabase functions deploy social-create-comment --no-verify-jwt
supabase functions deploy social-set-reaction --no-verify-jwt
supabase functions deploy social-record-impressions --no-verify-jwt
supabase functions deploy social-report-content --no-verify-jwt
supabase functions deploy sync-subscription-status --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy check-ip-signup --no-verify-jwt
supabase functions deploy send-verification-email --no-verify-jwt
supabase functions deploy verify-email-code --no-verify-jwt
supabase functions deploy cleanup-orphan-user --no-verify-jwt
```

## Manual Post-Deploy Smoke Checks

### Scan smoke checks

- Sign in and trigger scan eligibility from the app; confirm `check-and-record-scan` returns an allowed response for an eligible user.
- Complete a scan upload and analysis; confirm `analyze-scan` finishes and the related `scans` row contains `analysis_result` and `analyzed_at`.
- Confirm scan history still reads from `scan_metrics`, `user_current_global_score`, and `get_premium_potential_data`.

### Coach smoke checks

- Set `coach_enabled=true` in `app_feature_flags`.
- Open the coach flow and request guidance.
- Confirm `coach-generate-response` succeeds and a `coach_entries` row is created or refreshed.

### Social smoke checks

- Set `social_enabled=true` in `app_feature_flags`.
- Create a post with and without an uploaded asset; confirm `social-create-post` works and uploaded media lands in `social-posts`.
- If comments are enabled, set `social_comments_enabled=true` and create a comment; confirm `social-create-comment` succeeds.
- React to a post and scroll the feed; confirm `social-set-reaction` and `social-record-impressions` succeed.
- Report a post or comment; confirm `social-report-content` creates a `social_reports` row.
- Confirm the feed and comments still read through `get_social_feed_page` and `get_social_comments_for_post`.

### Auth smoke checks

- Attempt signup from a fresh network and confirm `check-ip-signup` does not block the request unexpectedly.
- Send a verification email and confirm `send-verification-email` succeeds.
- Verify a code and confirm `verify-email-code` marks `user_profiles.email_verified=true`.
- Create and then abandon a signup before verification, then confirm `cleanup-orphan-user` can clean up the orphan account path.

### Subscription smoke checks

- Sign in with a user that has a RevenueCat subscriber record and confirm `sync-subscription-status` updates `user_profiles.subscription_status`, `subscription_expiry_date`, and `subscription_platform`.
- If RevenueCat webhooks are enabled, send a RevenueCat test event and confirm `revenuecat-webhook` creates or updates `revenuecat_webhook_events`.

## Parity Verification Warning

Repo presence does not guarantee remote deployment.

Repo migrations do not guarantee the target Supabase project already has the matching tables, buckets, views, RPCs, triggers, or policies.

After every deploy, verify the linked remote Supabase project for:

- deployed edge functions
- migrated schema objects
- storage buckets and policies
- feature flag rows in `app_feature_flags`
- `app_config` compatibility view parity
- required secrets on the target project
