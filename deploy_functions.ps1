Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Deploy the currently active Supabase Edge Functions used by the app's
# verified scan, social, coach, subscription, and auth flows.
#
# This script intentionally preserves --no-verify-jwt for parity with the
# current project setup, including anon-header auth flows and webhook-backed
# server routes.
#
# Functions present in the repo but intentionally excluded here because this
# pass did not verify them as part of the active deployment surface:
# - social-toggle-like
# - social-moderate-content
# - upgrade-to-premium
# - schedule-scan-notifications
# - send-push-notifications
# - delete-all-users

$functions = @(
  'check-and-record-scan',
  'cancel-scan-reservation',
  'analyze-scan',
  'coach-generate-response',
  'social-reserve-upload',
  'social-create-post',
  'social-create-comment',
  'social-set-reaction',
  'social-record-impressions',
  'social-report-content',
  'sync-subscription-status',
  'revenuecat-webhook',
  'check-ip-signup',
  'send-verification-email',
  'verify-email-code',
  'cleanup-orphan-user'
)

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  throw 'npx not found in PATH. Install Node.js first.'
}

Write-Host 'Deploying verified active Supabase Edge Functions...'

foreach ($functionName in $functions) {
  Write-Host "-> $functionName"
  & npx.cmd supabase functions deploy $functionName --no-verify-jwt

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to deploy function: $functionName"
  }
}

Write-Host 'Done.'
Write-Host 'If the project is not linked yet, run: supabase link --project-ref <your-project-ref>'
