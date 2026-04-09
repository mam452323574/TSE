import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import {
  applyOptimisticReactionToSocialPost,
  applyServerReactionStateToSocialPost,
  buildStableSocialSharePayloadSnapshot,
  createSocialPost,
  fetchSocialComments,
  fetchSocialFeed,
  normalizeSocialImpressionPostIds,
  recordSocialPostImpressions,
  reportSocialContent,
  uploadSocialAssetFromUri,
  validateSocialCommentInput,
} from '@/services/social';

const { supabase } = jest.requireMock('@/services/supabase') as {
  supabase: {
    rpc?: jest.Mock;
    auth?: {
      getSession?: jest.Mock;
    };
    storage?: {
      from?: jest.Mock;
    };
  };
};

const mockStorageUpload = jest.fn();
const mockStorageGetPublicUrl = jest.fn();
const mockStorageRemove = jest.fn();
const mockStorageFrom = jest.fn(() => ({
  upload: mockStorageUpload,
  getPublicUrl: mockStorageGetPublicUrl,
  remove: mockStorageRemove,
}));
const mockGetInfoAsync = FileSystemLegacy.getInfoAsync as jest.Mock;
const mockReadAsStringAsync = FileSystemLegacy.readAsStringAsync as jest.Mock;
const mockManipulateAsync = ImageManipulator.manipulateAsync as jest.Mock;

describe('social service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.rpc = jest.fn();
    supabase.auth = {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
          },
        },
      }),
    };
    supabase.storage = {
      from: mockStorageFrom,
    };
    mockStorageUpload.mockResolvedValue({ error: null });
    mockStorageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/social-post.jpg' },
    });
    mockStorageRemove.mockResolvedValue({ data: null, error: null });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
    mockReadAsStringAsync.mockResolvedValue('dGVzdA==');
    mockManipulateAsync.mockResolvedValue({
      uri: 'manipulated-image-uri',
      width: 100,
      height: 100,
    });
    global.fetch = jest.fn();
  });

  it('paginates the social feed through the backend RPC and filters malformed rows safely', async () => {
    supabase.rpc?.mockResolvedValueOnce({
      data: [
        {
          id: 'post-1',
          author_id: 'user-1',
          author_username: 'alice',
          category: 'food',
          content_text: 'Fresh meal',
          created_at: '2026-04-06T10:00:00.000Z',
          like_count: 4,
          comment_count: 2,
          viewer_has_liked: true,
          moderation_status: 'approved',
          asset_url: 'https://cdn.example.com/post-1.jpg',
          image_url: 'https://cdn.example.com/post-1.jpg',
        },
        {
          id: 'bad-row',
          category: 'physique',
        },
      ],
      error: null,
    });

    const page = await fetchSocialFeed('food', '2', 2);

    expect(supabase.rpc).toHaveBeenCalledWith('get_social_feed_page', {
      p_category: 'food',
      p_limit: 2,
      p_offset: 2,
    });
    expect(page).toEqual({
      items: [
        expect.objectContaining({
          id: 'post-1',
          category: 'food',
          viewer_reaction: 'neutral',
          viewer_has_liked: true,
        }),
      ],
      next_cursor: '4',
    });
  });

  it('fails safely when the backend returns malformed social payloads', async () => {
    supabase.rpc?.mockResolvedValueOnce({
      data: [{ nope: true }],
      error: null,
    });

    await expect(fetchSocialFeed('all', null, 12)).resolves.toEqual({
      items: [],
      next_cursor: null,
    });
  });

  it('surfaces a precise feed query error instead of collapsing into an empty state', async () => {
    supabase.rpc?.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find function public.get_social_feed_page',
      },
    });

    await expect(fetchSocialFeed('all', null, 12)).rejects.toMatchObject({
      code: 'social_feed_query_unavailable',
      status: 503,
      message: expect.stringContaining('get_social_feed_page'),
    });
  });

  it('surfaces a precise comments query error instead of returning an empty thread', async () => {
    supabase.rpc?.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find function public.get_social_comments_for_post',
      },
    });

    await expect(fetchSocialComments('post-1')).rejects.toMatchObject({
      code: 'social_comments_query_unavailable',
      status: 503,
      message: expect.stringContaining('get_social_comments_for_post'),
    });
  });

  it('surfaces a precise feed policy denial when Supabase policies block the feed query', async () => {
    supabase.rpc?.mockResolvedValueOnce({
      data: null,
      error: {
        code: '42501',
        message: 'permission denied for table social_posts',
      },
    });

    await expect(fetchSocialFeed('all', null, 12)).rejects.toMatchObject({
      code: 'social_feed_policy_denied',
      status: 403,
      message: expect.stringContaining('denied'),
    });
  });

  it('surfaces a precise comments schema mismatch when required columns are missing', async () => {
    supabase.rpc?.mockResolvedValueOnce({
      data: null,
      error: {
        code: '42703',
        message: 'column "moderation_provider" does not exist',
      },
    });

    await expect(fetchSocialComments('post-1')).rejects.toMatchObject({
      code: 'social_comments_schema_mismatch',
      status: 503,
      message: expect.stringContaining('missing required database schema'),
    });
  });

  it('normalizes and validates comment creation input', () => {
    expect(validateSocialCommentInput('  Great   progress  ')).toBe(
      'Great progress',
    );
    expect(() => validateSocialCommentInput(' '.repeat(4))).toThrow(
      'Comment content is required',
    );
  });

  it('publishes a stable share payload snapshot without the original hero image uri', () => {
    expect(
      buildStableSocialSharePayloadSnapshot({
        variant: 'body',
        variantLabel: 'Body',
        score: 88,
        scoreLabel: 'Body score',
        heroImageUri: 'file:///scan-result.jpg',
        metrics: [],
        accentColor: '#000000',
        footerBrand: 'HEALTH SCAN',
        footerCta: 'Track your progress',
      }),
    ).toEqual(
      expect.objectContaining({
        variant: 'body',
        heroImageUri: null,
      }),
    );
  });

  it('rejects expiring or signed scan asset sources for stable social publishing', async () => {
    await expect(
      uploadSocialAssetFromUri({
        sourceUri:
          'https://test.supabase.co/storage/v1/object/sign/scan-images/user-1/tmp.jpg?token=expiring',
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'invalid_asset_source',
    });
  });

  it('uploads a native social image through the file-system base64 path', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          success: true,
          upload_id: '11111111-1111-4111-8111-111111111111',
          asset_path: 'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
          bucket: 'social-posts',
          mime_type: 'image/jpeg',
        }),
    });

    const result = await uploadSocialAssetFromUri({
      sourceUri: 'file:///photo.jpg',
      userId: 'user-1',
    });

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'file:///photo.jpg',
      [],
      expect.objectContaining({
        compress: 0.9,
        format: 'jpeg',
      }),
    );
    expect(mockGetInfoAsync).toHaveBeenCalledWith('manipulated-image-uri');
    expect(mockReadAsStringAsync).toHaveBeenCalledWith(
      'manipulated-image-uri',
      expect.objectContaining({
        encoding: 'base64',
      }),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalledWith('manipulated-image-uri');
    expect(mockStorageFrom).toHaveBeenCalledWith('social-posts');
    expect(mockStorageUpload).toHaveBeenCalledWith(
      'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
      expect.any(ArrayBuffer),
      expect.objectContaining({
        contentType: 'image/jpeg',
        upsert: false,
      }),
    );
    expect(result).toEqual({
      uploadId: '11111111-1111-4111-8111-111111111111',
      assetPath: 'user-1/posts/11111111-1111-4111-8111-111111111111.jpg',
      assetUrl: 'https://cdn.example.com/social-post.jpg',
    });
  });

  it('surfaces a readable asset preparation error when the native file is unavailable', async () => {
    mockGetInfoAsync.mockResolvedValueOnce({ exists: false, size: null });

    await expect(
      uploadSocialAssetFromUri({
        sourceUri: 'file:///missing.jpg',
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'asset_prepare_failed',
      message: 'The image could not be prepared for upload.',
      status: 400,
    });

    expect(mockStorageUpload).not.toHaveBeenCalled();
  });

  it('forwards the reserved asset path during create-post for deterministic backend resolution', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            success: true,
            upload_id: '11111111-1111-4111-8111-111111111111',
            asset_path: 'viewer-1/posts/11111111-1111-4111-8111-111111111111.jpg',
            bucket: 'social-posts',
            mime_type: 'image/jpeg',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            success: true,
            post_id: 'post-1',
            moderation_state: 'pending',
            published: false,
            asset_url: 'https://cdn.example.com/social-post.jpg',
            rate_limit: {
              allowed: true,
              limit_count: 3,
              window_seconds: 86400,
              recent_count: 0,
              retry_after_seconds: 0,
            },
            cooldown: {
              active: false,
              cooldown_until: null,
              recent_rejection_count: 0,
              rejection_threshold: 3,
              cooldown_hours: 24,
            },
          }),
      });

    await expect(
      createSocialPost({
        viewerProfile: {
          id: 'viewer-1',
          username: 'alice',
          avatar_url: null,
        },
        category: 'food',
        assetSourceUri: 'file:///photo.jpg',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'post-1',
        asset_path: 'viewer-1/posts/11111111-1111-4111-8111-111111111111.jpg',
        asset_url: 'https://cdn.example.com/social-post.jpg',
      }),
    );

    const createPostRequest = (global.fetch as jest.Mock).mock.calls[1]?.[1] as {
      body?: string;
    };
    expect(JSON.parse(createPostRequest.body ?? '{}')).toEqual(
      expect.objectContaining({
        category: 'food',
        upload_id: '11111111-1111-4111-8111-111111111111',
        reserved_asset_path:
          'viewer-1/posts/11111111-1111-4111-8111-111111111111.jpg',
      }),
    );
  });

  it('removes the uploaded social asset when post creation fails after upload', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            success: true,
            upload_id: '11111111-1111-4111-8111-111111111111',
            asset_path: 'viewer-1/posts/11111111-1111-4111-8111-111111111111.jpg',
            bucket: 'social-posts',
            mime_type: 'image/jpeg',
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () =>
          JSON.stringify({
            error: 'Backend exploded',
            code: 'social_post_create_failed',
          }),
      });

    await expect(
      createSocialPost({
        viewerProfile: {
          id: 'viewer-1',
          username: 'alice',
          avatar_url: null,
        },
        category: 'food',
        assetSourceUri: 'file:///photo.jpg',
      }),
    ).rejects.toMatchObject({
      code: 'social_post_create_failed',
      message: 'Backend exploded',
      status: 500,
    });

    expect(mockStorageRemove).toHaveBeenCalledWith([
      'viewer-1/posts/11111111-1111-4111-8111-111111111111.jpg',
    ]);
  });

  it('removes the uploaded social asset when publish fails because moderation env parity is missing', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            success: true,
            upload_id: '22222222-2222-4222-8222-222222222222',
            asset_path: 'viewer-1/posts/22222222-2222-4222-8222-222222222222.jpg',
            bucket: 'social-posts',
            mime_type: 'image/jpeg',
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () =>
          JSON.stringify({
            error: 'Social post moderation provider is not configured',
            code: 'social_moderation_webhook_not_configured',
          }),
      });

    await expect(
      createSocialPost({
        viewerProfile: {
          id: 'viewer-1',
          username: 'alice',
          avatar_url: null,
        },
        category: 'food',
        assetSourceUri: 'file:///photo.jpg',
      }),
    ).rejects.toMatchObject({
      code: 'social_moderation_webhook_not_configured',
      status: 503,
      message: 'Social post moderation provider is not configured',
    });

    expect(mockStorageRemove).toHaveBeenCalledWith([
      'viewer-1/posts/22222222-2222-4222-8222-222222222222.jpg',
    ]);
  });

  it('uses the backend moderation state as the source of truth when publish is immediately approved', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          success: true,
          post_id: 'post-approved',
          moderation_state: 'approved',
          published: true,
          asset_url: null,
          rate_limit: {
            allowed: true,
            limit_count: 3,
            window_seconds: 86400,
            recent_count: 0,
            retry_after_seconds: 0,
          },
          cooldown: {
            active: false,
            cooldown_until: null,
            recent_rejection_count: 0,
            rejection_threshold: 3,
            cooldown_hours: 24,
          },
        }),
    });

    await expect(
      createSocialPost({
        viewerProfile: {
          id: 'viewer-1',
          username: 'alice',
          avatar_url: null,
        },
        category: 'food',
        contentText: 'Fresh meal',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'post-approved',
        moderation_state: 'approved',
        moderation_status: 'approved',
      }),
    );
  });

  it('names the missing Social publish route when the create-post function is not deployed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => '',
    });

    await expect(
      createSocialPost({
        viewerProfile: {
          id: 'viewer-1',
          username: 'alice',
          avatar_url: null,
        },
        category: 'food',
        contentText: 'Fresh meal',
      }),
    ).rejects.toMatchObject({
      code: 'edge_function_route_missing',
      status: 404,
      functionName: 'social-create-post',
      message: expect.stringContaining('social-create-post'),
    });
  });

  it('names the missing Social impression route when impressions cannot be recorded', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => '',
    });

    await expect(
      recordSocialPostImpressions(['post-1', 'post-2']),
    ).rejects.toMatchObject({
      code: 'edge_function_route_missing',
      status: 404,
      functionName: 'social-record-impressions',
      message: expect.stringContaining('social-record-impressions'),
    });
  });

  it('updates reaction counts optimistically when switching between like, dislike, and neutral', () => {
    expect(
      applyOptimisticReactionToSocialPost(
        {
          id: 'post-1',
          author_id: 'user-1',
          author_username: 'alice',
          author_avatar_url: null,
          category: 'food',
          content_text: 'Fresh meal',
          image_url: null,
          created_at: '2026-04-06T10:00:00.000Z',
          like_count: 4,
          dislike_count: 1,
          impression_count: 9,
          comment_count: 2,
          viewer_reaction: 'like',
          viewer_has_liked: true,
          moderation_status: 'approved',
        },
        'dislike',
      ),
    ).toEqual(
      expect.objectContaining({
        viewer_reaction: 'dislike',
        viewer_has_liked: false,
        like_count: 3,
        dislike_count: 2,
      }),
    );
  });

  it('applies server reaction payloads as the single source of truth', () => {
    expect(
      applyServerReactionStateToSocialPost(
        {
          id: 'post-1',
          author_id: 'user-1',
          author_username: 'alice',
          author_avatar_url: null,
          category: 'food',
          content_text: 'Fresh meal',
          image_url: null,
          created_at: '2026-04-06T10:00:00.000Z',
          like_count: 1,
          dislike_count: 0,
          impression_count: 5,
          comment_count: 2,
          viewer_reaction: 'neutral',
          viewer_has_liked: false,
          moderation_status: 'approved',
        },
        {
          success: true,
          post_id: 'post-1',
          viewer_reaction: 'like',
          like_count: 6,
          dislike_count: 2,
        },
      ),
    ).toEqual(
      expect.objectContaining({
        viewer_reaction: 'like',
        viewer_has_liked: true,
        like_count: 6,
        dislike_count: 2,
      }),
    );
  });

  it('dedupes and caps impression batches before sending them to the backend', () => {
    expect(
      normalizeSocialImpressionPostIds([
        'post-1',
        'post-1',
        'post-2',
        '',
        'post-3',
      ], 2),
    ).toEqual(['post-1', 'post-2']);
  });

  it('preserves the backend feed order instead of re-ranking posts on the client', async () => {
    supabase.rpc?.mockResolvedValueOnce({
      data: [
        {
          id: 'backend-first',
          author_id: 'user-1',
          category: 'food',
          content_text: 'Backend ranked first',
          created_at: '2026-04-06T08:00:00.000Z',
          like_count: 1,
          dislike_count: 0,
          comment_count: 0,
          impression_count: 5000,
          moderation_status: 'approved',
        },
        {
          id: 'backend-second',
          author_id: 'user-2',
          category: 'food',
          content_text: 'Backend ranked second',
          created_at: '2026-04-07T11:00:00.000Z',
          like_count: 9,
          dislike_count: 0,
          comment_count: 4,
          impression_count: 32,
          moderation_status: 'approved',
        },
      ],
      error: null,
    });

    const page = await fetchSocialFeed('all', null, 2);

    expect(page.items.map((item) => item.id)).toEqual([
      'backend-first',
      'backend-second',
    ]);
  });

  it('surfaces duplicate social reports from the backend as a conflict error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          error: 'This content has already been reported by the current user',
          code: 'duplicate_report',
        }),
    });

    await expect(
      reportSocialContent({
        target_type: 'post',
        target_post_id: '99999999-9999-4999-8999-999999999999',
        reason_code: 'harassment',
      }),
    ).rejects.toMatchObject({
      code: 'duplicate_report',
      status: 409,
    });
  });
});
