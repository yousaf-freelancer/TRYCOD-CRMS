import { createHash, randomBytes } from 'node:crypto';

/** Opaque session token sent to the client (never stored as-is). */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** SHA-256 hash stored in `Session.tokenHash`. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
