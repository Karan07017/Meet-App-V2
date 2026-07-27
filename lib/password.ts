import bcrypt from "bcryptjs";

/**
 * Work factor for bcrypt. 12 is the current OWASP-recommended minimum for
 * interactive login flows (as of 2024) — high enough to resist offline
 * brute force, low enough to stay fast on serverless cold starts.
 */
const SALT_ROUNDS = 12;

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

/**
 * Hashes a plaintext password for storage. Never store the return value's
 * input anywhere else.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored value.
 *
 * Supports a one-time migration path: older rows created before this
 * project hashed passwords may still contain a plaintext value. If a
 * plaintext match succeeds, `needsRehash` is returned as `true` so the
 * caller can transparently upgrade that row to a bcrypt hash on this
 * successful login, without forcing a password reset on the user.
 */
export async function verifyPassword(
  plainPassword: string,
  storedPassword: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (BCRYPT_HASH_REGEX.test(storedPassword)) {
    const valid = await bcrypt.compare(plainPassword, storedPassword);
    return { valid, needsRehash: false };
  }

  // Legacy plaintext row — compare directly and flag for migration.
  const valid = plainPassword === storedPassword;
  return { valid, needsRehash: valid };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export const MIN_PASSWORD_LENGTH = 8;

export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}