import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest, PERMISSIONS_KEY } from './auth.decorators';

/** Global guard: enforces `@RequirePermissions(...)` (any one of the codes). Runs after `AuthGuard`. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (user && required.some((p) => user.permissions.includes(p))) return true;
    throw new ForbiddenException('You do not have permission to do this.');
  }
}
