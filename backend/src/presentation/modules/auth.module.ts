import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaAuthRepository } from '../../data/repositories/prisma-auth.repository';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { ChangePasswordUseCase } from '../../domain/use-cases/auth/change-password.use-case';
import { LoginUseCase } from '../../domain/use-cases/auth/login.use-case';
import { LogoutUseCase } from '../../domain/use-cases/auth/logout.use-case';
import { ValidateSessionUseCase } from '../../domain/use-cases/auth/validate-session.use-case';
import { AuthController } from '../controllers/auth.controller';
import { AuthGuard } from '../middleware/auth.guard';
import { PermissionsGuard } from '../middleware/permissions.guard';

/**
 * Session-token auth. Registers `AuthGuard` then `PermissionsGuard` globally:
 * all routes require a signed-in user unless marked `@Public()`.
 */
@Module({
  controllers: [AuthController],
  providers: [
    { provide: AuthRepository, useClass: PrismaAuthRepository },
    LoginUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    ValidateSessionUseCase,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AuthModule {}
