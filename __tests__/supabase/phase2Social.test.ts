import { resolveReservedSocialUpload } from '@/supabase/functions/_shared/phase2Social';

type StorageQueryResult = {
  data: unknown;
  error: unknown;
};

function createStorageClient(options: {
  exactResult?: StorageQueryResult;
  prefixResult?: StorageQueryResult;
}) {
  const filters: Array<{
    type: 'eq' | 'like';
    field: string;
    value: string;
  }> = [];

  const takeFilters = () => {
    const snapshot = [...filters];
    filters.length = 0;
    return snapshot;
  };

  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn((field: string, value: string) => {
      filters.push({ type: 'eq', field, value });
      return query;
    }),
    like: jest.fn((field: string, value: string) => {
      filters.push({ type: 'like', field, value });
      return query;
    }),
    maybeSingle: jest.fn(async () => {
      const snapshot = takeFilters();
      const usedExactNameLookup = snapshot.some(
        (filter) => filter.type === 'eq' && filter.field === 'name',
      );

      if (!usedExactNameLookup) {
        throw new Error('Expected an exact storage name lookup');
      }

      return options.exactResult ?? { data: null, error: null };
    }),
    limit: jest.fn(async () => {
      const snapshot = takeFilters();
      const usedPrefixLookup = snapshot.some(
        (filter) => filter.type === 'like' && filter.field === 'name',
      );

      if (!usedPrefixLookup) {
        throw new Error('Expected a prefix storage lookup');
      }

      return options.prefixResult ?? { data: [], error: null };
    }),
  };

  return {
    client: {
      schema: jest.fn(() => ({
        from: jest.fn(() => query),
      })),
    },
    query,
  };
}

function createStorageRow(
  name: string,
  metadata: Record<string, unknown> = { mimetype: 'image/jpeg' },
) {
  return {
    bucket_id: 'social-posts',
    name,
    metadata,
  };
}

describe('phase2 social upload resolution', () => {
  it('resolves a reserved upload by exact canonical path when reserved_asset_path is provided', async () => {
    const { client, query } = createStorageClient({
      exactResult: {
        data: createStorageRow(
          'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
        ),
        error: null,
      },
    });

    await expect(
      resolveReservedSocialUpload(client, {
        userId: 'user-1',
        uploadId: '11111111-1111-4111-8111-111111111111',
        reservedAssetPath:
          'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
      }),
    ).resolves.toEqual({
      asset_path: 'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
      mime_type: 'image/jpeg',
    });

    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
    expect(query.like).not.toHaveBeenCalled();
  });

  it('returns reserved_upload_not_found when the exact canonical path does not exist', async () => {
    const { client } = createStorageClient({
      exactResult: {
        data: null,
        error: null,
      },
    });

    await expect(
      resolveReservedSocialUpload(client, {
        userId: 'user-1',
        uploadId: '11111111-1111-4111-8111-111111111111',
        reservedAssetPath:
          'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
      }),
    ).rejects.toMatchObject({
      code: 'reserved_upload_not_found',
      status: 404,
    });
  });

  it('rejects mismatched reserved_asset_path values as invalid upload references', async () => {
    const { client, query } = createStorageClient({});

    await expect(
      resolveReservedSocialUpload(client, {
        userId: 'user-1',
        uploadId: '11111111-1111-4111-8111-111111111111',
        reservedAssetPath:
          'user-1/posts/22222222-2222-4222-8222-222222222222.jpg',
      }),
    ).rejects.toMatchObject({
      code: 'invalid_upload_reference',
      status: 400,
    });

    expect(query.maybeSingle).not.toHaveBeenCalled();
    expect(query.limit).not.toHaveBeenCalled();
  });

  it('falls back to the legacy prefix lookup when reserved_asset_path is missing', async () => {
    const { client, query } = createStorageClient({
      prefixResult: {
        data: [
          createStorageRow(
            'user-1/posts/11111111-1111-4111-8111-111111111111.png',
            { contentType: 'image/png' },
          ),
        ],
        error: null,
      },
    });

    await expect(
      resolveReservedSocialUpload(client, {
        userId: 'user-1',
        uploadId: '11111111-1111-4111-8111-111111111111',
      }),
    ).resolves.toEqual({
      asset_path: 'user-1/posts/11111111-1111-4111-8111-111111111111.png',
      mime_type: 'image/png',
    });

    expect(query.limit).toHaveBeenCalledWith(2);
    expect(query.maybeSingle).not.toHaveBeenCalled();
  });

  it('rejects ambiguous legacy prefix matches as invalid upload references', async () => {
    const { client } = createStorageClient({
      prefixResult: {
        data: [
          createStorageRow('user-1/posts/11111111-1111-4111-8111-111111111111.jpg'),
          createStorageRow('user-1/posts/11111111-1111-4111-8111-111111111111.png'),
        ],
        error: null,
      },
    });

    await expect(
      resolveReservedSocialUpload(client, {
        userId: 'user-1',
        uploadId: '11111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toMatchObject({
      code: 'invalid_upload_reference',
      status: 400,
    });
  });

  it('returns a precise lookup failure when storage resolution errors', async () => {
    const { client } = createStorageClient({
      exactResult: {
        data: null,
        error: {
          code: '57014',
          message: 'canceling statement due to timeout',
        },
      },
    });

    await expect(
      resolveReservedSocialUpload(client, {
        userId: 'user-1',
        uploadId: '11111111-1111-4111-8111-111111111111',
        reservedAssetPath:
          'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
      }),
    ).rejects.toMatchObject({
      code: 'social_upload_lookup_failed',
      status: 503,
    });
  });
});
