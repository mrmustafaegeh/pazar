import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  loginSchema,
  registerSchema,
  sendPhoneOtpSchema,
  setup2faSchema,
  verify2faSchema,
  verifyPhoneSchema,
} from '@turkiye-pazaryeri/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public, SkipCsrf } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @SkipCsrf()
  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() body: unknown) {
    const input = registerSchema.parse(body);
    return this.auth.register(input);
  }

  @Public()
  @SkipCsrf()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = loginSchema.parse(body);
    const result = await this.auth.login(input);

    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }

    const { refreshToken: _, ...response } = result;
    void _;
    return response;
  }

  @Public()
  @SkipCsrf()
  @Post('2fa/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Complete login with 2FA code' })
  async verify2faLogin(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = verify2faSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message ?? 'Invalid request');
    }

    const { code } = parsed.data;
    const tempToken = (body as { tempToken?: string }).tempToken;
    if (!tempToken) {
      throw new BadRequestException('tempToken required');
    }

    const result = await this.auth.complete2faLogin(tempToken, code);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Public()
  @SkipCsrf()
  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token cookie missing');
    }

    const result = await this.auth.refresh(rawToken);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Logout and revoke all refresh tokens' })
  async logout(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.id);
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/send-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send phone verification OTP' })
  async sendPhoneOtp(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const { phone } = sendPhoneOtpSchema.parse(body);
    await this.auth.sendPhoneOtp(user.id, phone);
    return { message: 'OTP gönderildi' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify phone with OTP code' })
  async verifyPhone(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const { phone, code } = verifyPhoneSchema.parse(body);
    return this.auth.verifyPhone(user.id, phone, code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate 2FA setup (admin roles only)' })
  async setup2faInitiate(@CurrentUser() user: { id: string }) {
    return this.auth.initiate2faSetup(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm 2FA setup with verification code' })
  async setup2faConfirm(
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const { code } = setup2faSchema.parse(body);
    const secret = (body as { secret?: string }).secret;
    if (!secret) {
      throw new BadRequestException('secret required');
    }
    await this.auth.setup2fa(user.id, secret, code);
    return { message: '2FA etkinleştirildi' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: { id: string }) {
    return this.auth.getMe(user.id);
  }

  private setRefreshCookie(res: Response, token: string) {
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    res.cookie(REFRESH_COOKIE, token, { ...COOKIE_OPTIONS, maxAge });
  }
}
