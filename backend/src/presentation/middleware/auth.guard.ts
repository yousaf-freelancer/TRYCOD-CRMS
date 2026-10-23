import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidateSessionUseCase } from '../../domain/use-cases/auth/validate-session.use-case';
import { AuthenticatedRequest, IS_PUBLIC_KEY } from './auth.decorators';

/** Global guard: every route needs a valid `Authorization: Bearer <token>` unless `@Public()`. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly validateSession: ValidateSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Please sign in.');

    const session = await this.validateSession.execute(token);
    if (!session)
      throw new UnauthorizedException(
        'Your session has expired. Please sign in again.',
      );

    request.user = session.user;
    request.sessionId = session.sessionId;
    return true;
  }
}
