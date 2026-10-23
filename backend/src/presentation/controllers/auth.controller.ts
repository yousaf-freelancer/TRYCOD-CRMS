import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../../domain/entities/auth-user.entity';
import { ChangePasswordUseCase } from '../../domain/use-cases/auth/change-password.use-case';
import type { LoginResult } from '../../domain/use-cases/auth/login.use-case';
import { LoginUseCase } from '../../domain/use-cases/auth/login.use-case';
import { LogoutUseCase } from '../../domain/use-cases/auth/logout.use-case';
import { ChangePasswordDto, LoginDto } from '../dto/auth.dto';
import {
  CurrentSession,
  CurrentUser,
  Public,
} from '../middleware/auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly logout: LogoutUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResult> {
    return this.login.execute({
      identifier: dto.identifier,
      password: dto.password,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
    });
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  signOut(@CurrentSession() sessionId: string): Promise<void> {
    return this.logout.execute(sessionId);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  updatePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
    @CurrentSession() sessionId: string,
  ): Promise<void> {
    return this.changePassword.execute({
      userId: user.userId,
      sessionId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }
}
