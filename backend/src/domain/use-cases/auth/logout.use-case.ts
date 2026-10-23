import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../../repositories/auth.repository';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly repo: AuthRepository) {}

  execute(sessionId: string): Promise<void> {
    return this.repo.revokeSession(sessionId);
  }
}
