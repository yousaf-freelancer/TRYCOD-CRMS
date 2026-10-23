import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import {
  ActiveSession,
  AuthRepository,
  NewSession,
  UserCredentials,
} from '../../domain/repositories/auth.repository';
import { PrismaService } from '../prisma/prisma.service';

const CREDENTIALS = { id: true, passwordHash: true, status: true } as const;

@Injectable()
export class PrismaAuthRepository extends AuthRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: CREDENTIALS,
    });
  }

  findCredentialsByPhone(phone: string): Promise<UserCredentials | null> {
    return this.prisma.user.findUnique({
      where: { phone },
      select: CREDENTIALS,
    });
  }

  findCredentialsById(userId: string): Promise<UserCredentials | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: CREDENTIALS,
    });
  }

  async loadAuthUser(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
        roles: {
          select: {
            role: {
              select: {
                code: true,
                permissions: {
                  select: { permission: { select: { code: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!user) return null;

    const person = user.employee ?? user.student;
    const name = person
      ? [person.firstName, person.lastName].filter(Boolean).join(' ')
      : (user.email ?? 'User');
    const roles = user.roles.map((r) => r.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((r) =>
          r.role.permissions.map((p) => p.permission.code),
        ),
      ),
    ];
    return {
      userId: user.id,
      name,
      email: user.email,
      roles,
      permissions,
      employeeId: user.employee?.id ?? null,
      studentId: user.student?.id ?? null,
    };
  }

  async recordLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async createSession(session: NewSession): Promise<void> {
    await this.prisma.session.create({ data: session });
  }

  findActiveSession(tokenHash: string): Promise<ActiveSession | null> {
    return this.prisma.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: 'ACTIVE' },
      },
      select: { id: true, userId: true, lastUsedAt: true },
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeOtherSessions(
    userId: string,
    keepSessionId: string,
  ): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, id: { not: keepSessionId } },
      data: { revokedAt: new Date() },
    });
  }
}
