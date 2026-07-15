import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { doubleCsrf } from 'csrf-csrf';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class CsrfController {
  private readonly generateToken: ReturnType<typeof doubleCsrf>['generateToken'];

  constructor(config: ConfigService) {
    const { generateToken } = doubleCsrf({
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
    this.generateToken = generateToken;
  }

  @Public()
  @Get('csrf-token')
  @ApiOperation({ summary: 'Get CSRF token for cookie-authenticated requests' })
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    const token = this.generateToken(req, res);
    res.json({ csrfToken: token });
  }
}
