import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { generateToken, hashToken } from '../../../core/utils/token.util';
import { AuthUser } from '../../entities/auth-user.entity';
import {
  AuthRepository,
  UserCredentials,
} from '../../repositories/auth.repository';

export interface LoginInput {
  /** Email or phone number. */
  identifier: string;
  password: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

const INVALID = 'Invalid email/phone or password.';
const DEFAULT_TTL_HOURS = 24 * 7;
/** Compared against when the user doesn't exist, so timing doesn't reveal it. */
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

@Injectable()
export class LoginUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const credentials = await this.findCredentials(input.identifier);
    const valid = await bcrypt.compare(
      input.password,
      credentials?.passwordHash ?? DUMMY_HASH,
    );
    if (!credentials || !valid) throw new UnauthorizedException(INVALID);
    if (credentials.status === 'LOCKED') {
      throw new ForbiddenException(
        'This account is locked. Contact the administrator.',
      );
    }
    if (credentials.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'This account is inactive. Contact the administrator.',
      );
    }

    const user = await this.repo.loadAuthUser(credentials.id);
    if (!user) throw new UnauthorizedException(INVALID);

    const token = generateToken();
    await this.repo.createSession({
      userId: credentials.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + sessionTtlHours() * 3_600_000),
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      ipAddress: input.ipAddress,
    });
    await this.repo.recordLogin(credentials.id);
    return { token, user };
  }

  private findCredentials(identifier: string): Promise<UserCredentials | null> {
    const value = identifier.trim();
    return value.includes('@')
      ? this.repo.findCredentialsByEmail(value.toLowerCase())
      : this.repo.findCredentialsByPhone(value.replace(/[\s()-]/g, ''));
  }
}

function sessionTtlHours(): number {
  const hours = Number(process.env.AUTH_SESSION_TTL_HOURS);
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_TTL_HOURS;
}
