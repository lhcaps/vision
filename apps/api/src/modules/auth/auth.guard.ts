import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { envOrDefault } from '../../common/env.util';

export const SESSION_COOKIE_NAME = envOrDefault(
  'AUTH_SESSION_COOKIE_NAME',
  'qlv_session',
);

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context
      .switchToHttp()
      .getRequest<Request & { currentUser?: unknown }>();
    if (isPublic) {
      // Public route vẫn có thể có user (nếu có cookie hợp lệ) — set nếu có.
      const user = await this.tryAuthenticate(request);
      if (user) {
        (request as Request & { currentUser?: unknown }).currentUser = user;
      }
      return true;
    }

    const user = await this.tryAuthenticate(request);
    if (!user) {
      throw new UnauthorizedException('Thiếu hoặc sai session token.');
    }
    (request as Request & { currentUser?: unknown }).currentUser = user;
    return true;
  }

  private async tryAuthenticate(request: Request): Promise<unknown | null> {
    const token =
      this.extractFromCookie(request) ?? this.extractFromAuthorization(request);
    if (!token) return null;
    try {
      return await this.authService.validateSession(token);
    } catch (error) {
      this.logger.debug(
        `Session validation failed: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private extractFromCookie(request: Request): string | null {
    const raw = (request as Request & { cookies?: Record<string, string> })
      .cookies?.[SESSION_COOKIE_NAME];
    return raw && typeof raw === 'string' ? raw : null;
  }

  private extractFromAuthorization(request: Request): string | null {
    const header = request.headers?.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token;
  }
}
