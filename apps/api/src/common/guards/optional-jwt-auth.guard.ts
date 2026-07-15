import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    if (!request.headers.authorization) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<T>(err: Error | null, user: T | false): T | undefined {
    if (err || !user) return undefined;
    return user;
  }
}
