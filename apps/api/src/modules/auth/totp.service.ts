import { BadRequestException, Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const ADMIN_ROLES: Role[] = [
  Role.MODERATOR,
  Role.SUPPORT,
  Role.FINANCE,
  Role.SUPER_ADMIN,
];

@Injectable()
export class TotpService {
  constructor(private readonly prisma: PrismaService) {}

  requires2fa(roles: Role[]): boolean {
    return roles.some((r) => ADMIN_ROLES.includes(r));
  }

  generateSecret(email: string): { secret: string; otpauthUrl: string } {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'Türkiye Pazaryeri', secret);
    return { secret, otpauthUrl };
  }

  verifyCode(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  async setup2fa(userId: string, secret: string, code: string): Promise<void> {
    if (!this.verifyCode(secret, code)) {
      throw new BadRequestException('Geçersiz 2FA kodu');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: true },
    });
  }

  async verify2fa(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user?.totpSecret || !user.totpEnabled) {
      throw new BadRequestException('2FA etkin değil');
    }

    if (!this.verifyCode(user.totpSecret, code)) {
      throw new BadRequestException('Geçersiz 2FA kodu');
    }
  }

  async initiateSetup(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('Kullanıcı bulunamadı');
    }

    if (!this.requires2fa(user.roles)) {
      throw new BadRequestException('Bu hesap için 2FA gerekli değil');
    }

    return this.generateSecret(user.email);
  }
}
