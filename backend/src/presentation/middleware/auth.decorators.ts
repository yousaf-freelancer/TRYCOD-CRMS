import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser } from '../../domain/entities/auth-user.entity';

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const PERMISSIONS_KEY = 'auth:permissions';

/** Request after `AuthGuard` has resolved the bearer token. */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

/** Skips authentication for a route or controller. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Requires at least one of the given permission codes. */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Injects the signed-in user. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user!,
);

/** Injects the id of the current session. */
export const CurrentSession = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().sessionId!,
);
