# Trust Boundaries

## Client-Trusted

- The client may choose when to request a purchase, restore, upload reservation, share action, report submission, or coach prompt.
- The client is not authoritative for premium access, moderation state, social visibility, or scan entitlement outcomes.
- Treat all client-provided identifiers and text as untrusted input until backend validation completes.

## Backend-Authoritative

- Supabase Edge Functions validate authentication, ownership, rate limits, canonical storage paths, and moderation workflow state.
- The backend decides whether a scan reservation is valid, whether a social upload path is usable, and whether posts/comments/reports stay visible.
- Moderation state, report workflow state, and social integrity counters are backend-owned.

## Store / RevenueCat-Authoritative

- App Store / Google Play billing state is authoritative for subscription status.
- RevenueCat is the canonical subscription integration used to translate store state into app entitlements.
- `revenuecat-webhook` is the primary sync path into `user_profiles`.
- `sync-subscription-status` is fallback/manual repair only and must not be treated as the primary entitlement source.

## Subscription Source Of Truth

- Canonical source of truth: store receipt state via RevenueCat.
- Derived app state: `user_profiles.account_tier`, `subscription_status`, `subscription_expiry_date`, and `subscription_platform`.
- The client should gate premium UX from backend profile state, not from optimistic purchase assumptions.

## Moderation And Social Integrity

- Backend moderation decides post/comment visibility and rejection state.
- Reports are advisory inputs; report volume can trigger auto-hide workflows, but the backend remains authoritative.
- Reserved social uploads must map to stable social storage paths, not scan URLs or signed temporary assets.
- Raw provider failures may be summarized for operations, but raw webhook bodies and sensitive payloads should not be logged back to clients.
