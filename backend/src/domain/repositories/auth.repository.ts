import { AuthUser } from '../entities/auth-user.entity';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface UserCredentials {
  id: string;
  passwordHash: string;
  status: UserStatus;
}

export interface NewSession {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface ActiveSession {
  id: string;
  userId: string;
  lastUsedAt: Date;
}

/** Persistence for users and sessions used by the auth use cases. */
export abstract class AuthRepository {
  abstract findCredentialsByEmail(
    email: string,
  ): Promise<UserCredentials | null>;
  abstract findCredentialsByPhone(
    phone: string,
  ): Promise<UserCredentials | null>;
  abstract findCredentialsById(userId: string): Promise<UserCredentials | null>;
  abstract loadAuthUser(userId: string): Promise<AuthUser | null>;
  abstract recordLogin(userId: string): Promise<void>;
  abstract updatePassword(userId: string, passwordHash: string): Promise<void>;

  abstract createSession(session: NewSession): Promise<void>;
  /** A session that is not revoked or expired, whose user is active. */
  abstract findActiveSession(tokenHash: string): Promise<ActiveSession | null>;
  abstract touchSession(sessionId: string): Promise<void>;
  abstract revokeSession(sessionId: string): Promise<void>;
  abstract revokeOtherSessions(
    userId: string,
    keepSessionId: string,
  ): Promise<void>;
}
