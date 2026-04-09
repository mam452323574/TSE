import {
  normalizeModerationState,
  normalizeModerationAction,
  normalizeReportWorkflowStatus,
  readWebhookModerationState,
  resolveModerationStateForAction,
  resolveSocialPublishModerationResult,
  shouldAutoHideForReports,
} from '@/supabase/functions/_shared/phase2Moderation';

describe('phase2 moderation helpers', () => {
  it('normalizes moderation state transitions defensively', () => {
    expect(normalizeModerationState('approved')).toBe('approved');
    expect(normalizeModerationState('flagged')).toBe('flagged');
    expect(normalizeModerationState('hidden')).toBe('hidden');
    expect(normalizeModerationState('removed')).toBe('removed');
    expect(normalizeModerationState('unknown')).toBe('pending');
  });

  it('keeps malformed webhook moderation payloads in a safe pending state', () => {
    expect(readWebhookModerationState(null)).toBe('pending');
    expect(
      readWebhookModerationState({
        moderation_state: 'rejected',
      }),
    ).toBe('rejected');
  });

  it('auto-hides content only after the report threshold is reached', () => {
    expect(shouldAutoHideForReports(2)).toBe(false);
    expect(shouldAutoHideForReports(3)).toBe(true);
    expect(shouldAutoHideForReports(4)).toBe(true);
  });

  it('normalizes moderation actions and workflow states safely', () => {
    expect(normalizeModerationAction('hide')).toBe('hide');
    expect(normalizeModerationAction('nope')).toBe('flag');
    expect(normalizeReportWorkflowStatus('dismissed')).toBe('dismissed');
    expect(normalizeReportWorkflowStatus('nope')).toBe('submitted');
  });

  it('maps moderator actions to explicit moderation states', () => {
    expect(resolveModerationStateForAction('approve', 'flagged')).toBe('approved');
    expect(resolveModerationStateForAction('hide', 'approved')).toBe('hidden');
    expect(resolveModerationStateForAction('remove', 'approved')).toBe('removed');
    expect(resolveModerationStateForAction('dismiss_reports', 'flagged')).toBe('flagged');
  });

  it('approves social publishing immediately when moderation is disabled', () => {
    expect(
      resolveSocialPublishModerationResult({
        moderationEnabled: false,
        webhookConfigured: false,
        missingWebhookCode: 'unused',
        missingWebhookMessage: 'unused',
      }),
    ).toEqual({
      moderation_state: 'approved',
      published: true,
      shouldQueueWebhook: false,
    });
  });

  it('keeps social publishing pending only when moderation is enabled and configured', () => {
    expect(
      resolveSocialPublishModerationResult({
        moderationEnabled: true,
        webhookConfigured: true,
        missingWebhookCode: 'unused',
        missingWebhookMessage: 'unused',
      }),
    ).toEqual({
      moderation_state: 'pending',
      published: false,
      shouldQueueWebhook: true,
    });
  });

  it('fails fast when moderation is enabled but the webhook env is missing', () => {
    expect(() =>
      resolveSocialPublishModerationResult({
        moderationEnabled: true,
        webhookConfigured: false,
        missingWebhookCode: 'social_moderation_webhook_not_configured',
        missingWebhookMessage: 'Social post moderation provider is not configured',
      }),
    ).toThrow('Social post moderation provider is not configured');
  });
});
