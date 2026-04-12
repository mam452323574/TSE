import { requireSocialModerationWorkerOrAdmin } from './phase2Auth.ts';
import { Phase2HttpError } from './phase2Errors.ts';

const TEST_ENV_NAMES = [
  'PHASE2_SOCIAL_MODERATION_WORKER_TOKEN',
] as const;

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

async function assertRejectsPhase2HttpError(
  action: () => Promise<unknown>,
  expectedCode: string,
) {
  try {
    await action();
  } catch (error) {
    assert(
      error instanceof Phase2HttpError,
      'Expected a Phase2HttpError to be thrown',
    );
    assertEquals(error.code, expectedCode, 'Unexpected Phase2HttpError code');
    return;
  }

  throw new Error('Expected the action to throw');
}

async function withWorkerAuthEnv(
  overrides: Partial<Record<(typeof TEST_ENV_NAMES)[number], string>>,
  action: () => Promise<void> | void,
) {
  const originalValues = new Map<string, string | undefined>();

  for (const envName of TEST_ENV_NAMES) {
    originalValues.set(envName, Deno.env.get(envName));
    if (Object.prototype.hasOwnProperty.call(overrides, envName)) {
      Deno.env.set(envName, overrides[envName] ?? '');
    } else {
      Deno.env.set(envName, '');
    }
  }

  try {
    await action();
  } finally {
    for (const envName of TEST_ENV_NAMES) {
      const originalValue = originalValues.get(envName);
      Deno.env.set(envName, originalValue ?? '');
    }
  }
}

function createRequest(token: string) {
  return new Request('https://example.com/social-process-moderation-queue', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
}

function createClient(options: {
  authUserId?: string | null;
  authError?: unknown;
  adminTier?: string;
}) {
  const authCalls: string[] = [];
  const profileCalls: string[] = [];

  return {
    client: {
      auth: {
        getUser(token: string) {
          authCalls.push(token);
          return Promise.resolve({
            data: {
              user: options.authUserId ? { id: options.authUserId } : null,
            },
            error: options.authError ?? null,
          });
        },
      },
      from(tableName: string) {
        assertEquals(tableName, 'user_profiles', 'Unexpected profile table');
        return {
          select() {
            return {
              eq(columnName: string, value: string) {
                assertEquals(columnName, 'id', 'Unexpected profile filter column');
                profileCalls.push(value);
                return {
                  maybeSingle() {
                    return Promise.resolve({
                      data: options.authUserId
                        ? {
                          id: options.authUserId,
                          account_tier: options.adminTier ?? 'free',
                        }
                        : null,
                      error: null,
                    });
                  },
                };
              },
            };
          },
        };
      },
    },
    authCalls,
    profileCalls,
  };
}

Deno.test('requireSocialModerationWorkerOrAdmin accepts the internal worker bearer token', async () => {
  await withWorkerAuthEnv({
    PHASE2_SOCIAL_MODERATION_WORKER_TOKEN: 'worker-secret',
  }, async () => {
    const { client, authCalls, profileCalls } = createClient({});
    const actor = await requireSocialModerationWorkerOrAdmin(
      client,
      createRequest('worker-secret'),
    );

    assertEquals(actor.actor_type, 'system', 'Worker token should authenticate as system');
    assertEquals(actor.actor_id, null, 'Worker token should not resolve to a user id');
    assertEquals(
      actor.actor_label,
      'social-moderation-worker',
      'Worker token should use the worker actor label',
    );
    assertEquals(authCalls.length, 0, 'Worker token should bypass user auth lookups');
    assertEquals(profileCalls.length, 0, 'Worker token should bypass admin profile checks');
  });
});

Deno.test('requireSocialModerationWorkerOrAdmin accepts admin JWTs as a manual trigger path', async () => {
  await withWorkerAuthEnv({
    PHASE2_SOCIAL_MODERATION_WORKER_TOKEN: 'worker-secret',
  }, async () => {
    const { client, authCalls, profileCalls } = createClient({
      authUserId: '33333333-3333-4333-8333-333333333333',
      adminTier: 'admin',
    });
    const actor = await requireSocialModerationWorkerOrAdmin(
      client,
      createRequest('admin-jwt'),
    );

    assertEquals(actor.actor_type, 'admin', 'Admin JWT should authenticate as admin');
    assertEquals(
      actor.actor_id,
      '33333333-3333-4333-8333-333333333333',
      'Admin JWT should expose the admin id',
    );
    assertEquals(actor.actor_label, null, 'Admin actors should not use a system label');
    assertEquals(authCalls.length, 1, 'Admin JWT should be validated through auth.getUser');
    assertEquals(profileCalls.length, 1, 'Admin JWT should be checked against user_profiles');
  });
});

Deno.test('requireSocialModerationWorkerOrAdmin rejects invalid and non-admin tokens', async () => {
  await withWorkerAuthEnv({
    PHASE2_SOCIAL_MODERATION_WORKER_TOKEN: 'worker-secret',
  }, async () => {
    const invalidClient = createClient({
      authUserId: null,
      authError: new Error('invalid token'),
    });

    await assertRejectsPhase2HttpError(
      () =>
        requireSocialModerationWorkerOrAdmin(
          invalidClient.client,
          createRequest('invalid-token'),
        ),
      'invalid_authentication',
    );

    const nonAdminClient = createClient({
      authUserId: '44444444-4444-4444-8444-444444444444',
      adminTier: 'free',
    });

    await assertRejectsPhase2HttpError(
      () =>
        requireSocialModerationWorkerOrAdmin(
          nonAdminClient.client,
          createRequest('non-admin-jwt'),
        ),
      'admin_required',
    );
  });
});
