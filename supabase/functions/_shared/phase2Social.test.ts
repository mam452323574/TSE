import {
  isSocialModerationSubjectClaimable,
  selectClaimableSocialModerationSubjects,
} from './phase2Social.ts';
import type { Phase2ModerationSubject } from './phase2Types.ts';

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(
  actual: T,
  expected: T,
  message: string,
) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertArrayEquals<T>(
  actual: T[],
  expected: T[],
  message: string,
) {
  assertEquals(actual.length, expected.length, `${message} length mismatch`);
  for (let index = 0; index < actual.length; index += 1) {
    assertEquals(actual[index], expected[index], `${message} at index ${index}`);
  }
}

function createSubject(
  overrides: Partial<Phase2ModerationSubject> = {},
): Phase2ModerationSubject {
  return {
    content_type: 'post',
    content_id: '10000000-0000-4000-8000-000000000000',
    author_id: '20000000-0000-4000-8000-000000000000',
    author_username: 'queue-user',
    category: 'physique',
    content_text: 'Queued content',
    asset_path: null,
    asset_url: null,
    moderation_state: 'pending',
    moderation_reason: null,
    moderation_provider: null,
    created_at: '2026-04-09T12:00:00.000Z',
    total_reports_24h: 0,
    unique_reporters_24h: 0,
    open_reports: 0,
    reason_codes: [],
    last_reported_at: null,
    moderation_queued_at: '2026-04-09T12:00:00.000Z',
    moderation_claimed_at: null,
    moderation_completed_at: null,
    moderation_attempt_count: 0,
    moderation_last_error: null,
    ...overrides,
  };
}

Deno.test('isSocialModerationSubjectClaimable only accepts pending subjects', () => {
  const pendingSubject = createSubject();
  const approvedSubject = createSubject({
    content_id: '10000000-0000-4000-8000-000000000001',
    moderation_state: 'approved',
  });

  assert(
    isSocialModerationSubjectClaimable(pendingSubject),
    'Pending subjects without a claim should be claimable',
  );
  assert(
    !isSocialModerationSubjectClaimable(approvedSubject),
    'Non-pending subjects should never be claimable',
  );
});

Deno.test('isSocialModerationSubjectClaimable reclaims stale claimed subjects', () => {
  const staleSubject = createSubject({
    content_id: '10000000-0000-4000-8000-000000000002',
    moderation_claimed_at: '2026-04-09T12:10:00.000Z',
  });
  const freshSubject = createSubject({
    content_id: '10000000-0000-4000-8000-000000000003',
    moderation_claimed_at: '2026-04-09T12:24:00.000Z',
  });
  const nowIso = '2026-04-09T12:30:00.000Z';

  assert(
    isSocialModerationSubjectClaimable(staleSubject, {
      nowIso,
      staleAfterMinutes: 15,
    }),
    'Stale claims should be reclaimable',
  );
  assert(
    !isSocialModerationSubjectClaimable(freshSubject, {
      nowIso,
      staleAfterMinutes: 15,
    }),
    'Fresh claims should remain reserved',
  );
});

Deno.test('selectClaimableSocialModerationSubjects prioritizes report pressure then queue age', () => {
  const subjects = [
    createSubject({
      content_id: '10000000-0000-4000-8000-000000000010',
      open_reports: 1,
      moderation_queued_at: '2026-04-09T12:05:00.000Z',
    }),
    createSubject({
      content_id: '10000000-0000-4000-8000-000000000011',
      open_reports: 3,
      moderation_queued_at: '2026-04-09T12:15:00.000Z',
    }),
    createSubject({
      content_id: '10000000-0000-4000-8000-000000000012',
      open_reports: 3,
      moderation_queued_at: '2026-04-09T12:01:00.000Z',
    }),
    createSubject({
      content_id: '10000000-0000-4000-8000-000000000013',
      open_reports: 0,
      moderation_state: 'approved',
    }),
  ];

  const selected = selectClaimableSocialModerationSubjects(subjects, {
    limit: 3,
    nowIso: '2026-04-09T12:30:00.000Z',
    staleAfterMinutes: 15,
  });

  assertArrayEquals(
    selected.map((subject) => subject.content_id),
    [
      '10000000-0000-4000-8000-000000000012',
      '10000000-0000-4000-8000-000000000011',
      '10000000-0000-4000-8000-000000000010',
    ],
    'Claim order should prefer higher open report pressure and then older queue timestamps',
  );
});
