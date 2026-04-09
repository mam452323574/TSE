import { supabase } from '@/services/supabase';

const AVATAR_BUCKET = 'avatars';
const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60;
const AVATAR_SIGNED_URL_CACHE_TTL_MS = 45 * 60 * 1000;

type CachedAvatarUrl = {
  signedUrl: string;
  expiresAt: number;
};

const avatarSignedUrlCache = new Map<string, CachedAvatarUrl>();

function normalizeAvatarValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function isRemoteAvatarUrl(value?: string | null) {
  const normalizedValue = normalizeAvatarValue(value);
  return normalizedValue
    ? /^https?:\/\//i.test(normalizedValue)
    : false;
}

export function isLocalAvatarUri(value?: string | null) {
  const normalizedValue = normalizeAvatarValue(value);
  return normalizedValue
    ? /^(file|content|data):/i.test(normalizedValue)
    : false;
}

export function isManagedAvatarReference(value?: string | null) {
  const normalizedValue = normalizeAvatarValue(value);
  if (!normalizedValue) {
    return false;
  }

  return !isRemoteAvatarUrl(normalizedValue) && !isLocalAvatarUri(normalizedValue);
}

export function buildCanonicalAvatarPath(
  userId: string,
  extension: 'jpg' | 'png' | 'webp' = 'jpg',
) {
  return `${userId}/avatar.${extension}`;
}

export function clearAvatarUrlCache(avatarReference?: string | null) {
  const normalizedReference = normalizeAvatarValue(avatarReference);
  if (!normalizedReference) {
    avatarSignedUrlCache.clear();
    return;
  }

  avatarSignedUrlCache.delete(normalizedReference);
}

export async function resolveAvatarUrl(avatarReference?: string | null) {
  const normalizedReference = normalizeAvatarValue(avatarReference);
  if (!normalizedReference) {
    return null;
  }

  if (
    isRemoteAvatarUrl(normalizedReference) ||
    isLocalAvatarUri(normalizedReference)
  ) {
    return normalizedReference;
  }

  const cachedResult = avatarSignedUrlCache.get(normalizedReference);
  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.signedUrl;
  }

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(normalizedReference, AVATAR_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('[Avatar] Failed to resolve avatar URL:', error);
    return null;
  }

  avatarSignedUrlCache.set(normalizedReference, {
    signedUrl: data.signedUrl,
    expiresAt: Date.now() + AVATAR_SIGNED_URL_CACHE_TTL_MS,
  });

  return data.signedUrl;
}
