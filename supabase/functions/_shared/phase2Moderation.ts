import { Phase2HttpError } from './phase2Errors.ts';
import type { Phase2ModerationState } from './phase2Types.ts';
import type {
  Phase2SocialModerationAction,
  Phase2SocialReportWorkflowStatus,
} from './phase2Types.ts';

const VALID_MODERATION_STATES: readonly Phase2ModerationState[] = [
  'pending',
  'approved',
  'rejected',
  'flagged',
  'hidden',
  'removed',
] as const;

const VALID_REPORT_WORKFLOW_STATUSES: readonly Phase2SocialReportWorkflowStatus[] = [
  'submitted',
  'reviewing',
  'resolved',
  'dismissed',
] as const;

const VALID_MODERATION_ACTIONS: readonly Phase2SocialModerationAction[] = [
  'approve',
  'flag',
  'hide',
  'remove',
  'restore',
  'reject',
  'dismiss_reports',
] as const;

export function normalizeModerationState(
  value: unknown,
  fallback: Phase2ModerationState = 'pending',
): Phase2ModerationState {
  return typeof value === 'string' &&
    VALID_MODERATION_STATES.includes(value as Phase2ModerationState)
    ? (value as Phase2ModerationState)
    : fallback;
}

export function readWebhookModerationState(
  payload: Record<string, unknown> | null,
) {
  return normalizeModerationState(payload?.moderation_state, 'pending');
}

export function normalizeReportWorkflowStatus(
  value: unknown,
  fallback: Phase2SocialReportWorkflowStatus = 'submitted',
): Phase2SocialReportWorkflowStatus {
  return typeof value === 'string' &&
    VALID_REPORT_WORKFLOW_STATUSES.includes(value as Phase2SocialReportWorkflowStatus)
    ? (value as Phase2SocialReportWorkflowStatus)
    : fallback;
}

export function normalizeModerationAction(
  value: unknown,
  fallback: Phase2SocialModerationAction = 'flag',
): Phase2SocialModerationAction {
  return typeof value === 'string' &&
    VALID_MODERATION_ACTIONS.includes(value as Phase2SocialModerationAction)
    ? (value as Phase2SocialModerationAction)
    : fallback;
}

export function resolveModerationStateForAction(
  action: Phase2SocialModerationAction,
  previousState: Phase2ModerationState,
): Phase2ModerationState | null {
  switch (action) {
    case 'approve':
      return 'approved';
    case 'flag':
      return 'flagged';
    case 'hide':
      return 'hidden';
    case 'remove':
      return 'removed';
    case 'restore':
      return 'approved';
    case 'reject':
      return 'rejected';
    case 'dismiss_reports':
      return previousState;
    default:
      return previousState;
  }
}

export function shouldAutoHideForReports(
  uniqueReportCount24h: number,
  threshold = 3,
) {
  return uniqueReportCount24h >= threshold;
}

export function resolveSocialPublishModerationResult(options: {
  moderationEnabled: boolean;
  webhookConfigured: boolean;
  missingWebhookCode: string;
  missingWebhookMessage: string;
}) {
  if (!options.moderationEnabled) {
    return {
      moderation_state: 'approved' as Phase2ModerationState,
      published: true,
      shouldQueueWebhook: false,
    };
  }

  if (!options.webhookConfigured) {
    throw new Phase2HttpError(
      503,
      options.missingWebhookCode,
      options.missingWebhookMessage,
    );
  }

  return {
    moderation_state: 'pending' as Phase2ModerationState,
    published: false,
    shouldQueueWebhook: true,
  };
}
