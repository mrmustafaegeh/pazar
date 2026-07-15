import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class PhoneVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser & { phoneVerified?: boolean } }>();
    const user = request.user;

    if (!user?.phoneVerified) {
      throw new ForbiddenException('İlan vermek için telefon doğrulaması gerekli');
    }

    return true;
  }
}
