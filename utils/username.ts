export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z0-9_-]{3,20}$/;

export function normalizeUsernameInput(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_-]/g, '');
}

export function isCanonicalUsername(value: string) {
  return USERNAME_PATTERN.test(value);
}

export function validateCanonicalUsername(value: string) {
  const normalizedUsername = normalizeUsernameInput(value);

  return {
    normalizedUsername,
    valid: isCanonicalUsername(normalizedUsername),
  };
}
