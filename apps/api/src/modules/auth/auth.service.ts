import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type {
  LoginInput,
  LoginResponse,
  RegisterInput,
  AuthUserResponse,
} from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';
import { OtpService } from './otp.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { TotpService } from './totp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly token: TokenService,
    private readonly otp: OtpService,
    private readonly totp: TotpService,
  ) {}

  async register(input: RegisterInput): Promise<AuthUserResponse> {
    await this.assertRegistrationOpen();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: input.email, mode: 'insensitive' } },
          { phone: input.phone },
        ],
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('E-posta veya telefon zaten kayıtlı');
    }

    const passwordHash = await this.password.hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        phone: input.phone,
        roles: [Role.USER],
      },
    });

    await this.otp.sendOtp(user.id, input.phone);

    return this.toUserResponse(user);
  }

  async login(input: LoginInput): Promise<LoginResponse & { refreshToken?: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: input.email, mode: 'insensitive' }, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    const valid = await this.password.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    const needs2fa = this.totp.requires2fa(user.roles);

    if (needs2fa) {
      if (!user.totpEnabled) {
        throw new ForbiddenException('2FA kurulumu gerekli — admin hesabınız için 2FA etkinleştirin');
      }

      const tempToken = await this.token.createTemp2faToken(user.id);
      return {
        user: this.toUserResponse(user),
        accessToken: '',
        expiresIn: 0,
        requires2fa: true,
        tempToken,
      };
    }

    const { accessToken, expiresIn } = await this.token.createAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });

    const { rawToken: refreshToken } = await this.token.createRefreshToken(user.id);

    return {
      user: this.toUserResponse(user),
      accessToken,
      expiresIn,
      refreshToken,
    };
  }

  async complete2faLogin(tempToken: string, code: string): Promise<{ accessToken: string; expiresIn: number; refreshToken: string; user: AuthUserResponse }> {
    const userId = await this.token.verifyTemp2faToken(tempToken);
    await this.totp.verify2fa(userId, code);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    const { accessToken, expiresIn } = await this.token.createAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });

    const { rawToken: refreshToken } = await this.token.createRefreshToken(user.id);

    return { accessToken, expiresIn, refreshToken, user: this.toUserResponse(user) };
  }

  async refresh(rawRefreshToken: string) {
    const result = await this.token.rotateRefreshToken(rawRefreshToken);
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      refreshToken: result.newRefreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        roles: result.user.roles,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.token.revokeAllUserTokens(userId);
  }

  async sendPhoneOtp(userId: string, phone: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    await this.otp.sendOtp(userId, phone);
  }

  async verifyPhone(userId: string, phone: string, code: string): Promise<AuthUserResponse> {
    await this.otp.verifyOtp(userId, phone, code);

    const user = await this.prisma.user.findFirstOrThrow({
      where: { id: userId, deletedAt: null },
    });

    return this.toUserResponse(user);
  }

  async setup2fa(userId: string, secret: string, code: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !this.totp.requires2fa(user.roles)) {
      throw new ForbiddenException('2FA kurulumu bu hesap için gerekli değil');
    }

    await this.totp.setup2fa(userId, secret, code);
  }

  async initiate2faSetup(userId: string) {
    return this.totp.initiateSetup(userId);
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    return this.toUserResponse(user);
  }

  private async assertRegistrationOpen(): Promise<void> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'registration_open' },
    });

    if (flag && !flag.enabled) {
      throw new ForbiddenException('Kayıt şu anda kapalı');
    }
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    phone: string | null;
    phoneVerifiedAt: Date | null;
    roles: Role[];
    totpEnabled: boolean;
  }): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      phoneVerified: !!user.phoneVerifiedAt,
      roles: user.roles,
      totpEnabled: user.totpEnabled,
    };
  }
}
