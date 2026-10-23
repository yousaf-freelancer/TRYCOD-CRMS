import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthRepository } from '../../repositories/auth.repository';

export interface ChangePasswordInput {
  userId: string;
  sessionId: string;
  currentPassword: string;
  newPassword: string;
}

/** Changes the password and signs out every other session of the user. */
@Injectable()
export class ChangePasswordUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const credentials = await this.repo.findCredentialsById(input.userId);
    if (!credentials) throw new UnauthorizedException();
    const valid = await bcrypt.compare(
      input.currentPassword,
      credentials.passwordHash,
    );
    if (!valid) throw new BadRequestException('Current password is incorrect.');
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current one.',
      );
    }
    await this.repo.updatePassword(
      input.userId,
      await bcrypt.hash(input.newPassword, 10),
    );
    await this.repo.revokeOtherSessions(input.userId, input.sessionId);
  }
}
