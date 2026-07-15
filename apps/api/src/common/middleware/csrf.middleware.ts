import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { doubleCsrf } from 'csrf-csrf';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfProtection: ReturnType<typeof doubleCsrf>['validateRequest'];

  constructor(config: ConfigService) {
    const { validateRequest } = doubleCsrf({
      getSecret: () => config.getOrThrow<string>('CSRF_SECRET'),
      getSessionIdentifier: (req) => {
        const refresh = req.cookies?.refresh_token as string | undefined;
        return refresh ?? req.ip ?? 'anonymous';
      },
      cookieName: '__csrf',
      cookieOptions: {
        httpOnly: true,
        secure: config.get('NODE_ENV') === 'production',
        sameSite: 'strict',
        path: '/',
      },
      getTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
    });

    this.csrfProtection = validateRequest;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const requestPath = (req.originalUrl ?? req.url ?? req.path).split('?')[0];
    const skipPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/2fa/verify',
      '/auth/phone/send-otp',
      '/auth/phone/verify',
    ];
    const hasBearerAuth =
      typeof req.headers.authorization === 'string' &&
      req.headers.authorization.startsWith('Bearer ');

    if (skipPaths.some((p) => requestPath.includes(p)) || hasBearerAuth) {
      next();
      return;
    }

    const hasRefreshCookie = !!req.cookies?.refresh_token;

    if (mutatingMethods.includes(req.method) && hasRefreshCookie) {
      if (!this.csrfProtection(req)) {
        throw new ForbiddenException('CSRF token invalid or missing');
      }
    }

    next();
  }
}
