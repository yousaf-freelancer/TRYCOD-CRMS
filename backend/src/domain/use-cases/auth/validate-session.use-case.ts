import { Injectable } from '@nestjs/common';
import { hashToken } from '../../../core/utils/token.util';
import { AuthUser } from '../../entities/auth-user.entity';
import { AuthRepository } from '../../repositories/auth.repository';

export interface ValidSession {
  sessionId: string;
  user: AuthUser;
}

/** Only bump `lastUsedAt` this often, to avoid a write per request. */
const TOUCH_INTERVAL_MS = 5 * 60_000;

/** Resolves a bearer token to its session and user, or `null` if invalid. */
@Injectable()
export class ValidateSessionUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(token: string): Promise<ValidSession | null> {
    const session = await this.repo.findActiveSession(hashToken(token));
    if (!session) return null;
    const user = await this.repo.loadAuthUser(session.userId);
    if (!user) return null;
    if (Date.now() - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.repo.touchSession(session.id);
    }
    return { sessionId: session.id, user };
  }
}
