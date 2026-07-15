import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access';
}

export interface TempTokenPayload {
  sub: string;
  type: 'temp_2fa';
}

export interface RefreshTokenResult {
  rawToken: string;
  familyId: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  generateRawToken(): string {
    return randomBytes(32).toString('base64url');
  }

  async createAccessToken(user: {
    id: string;
    email: string;
    roles: string[];
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const expiresInStr = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const expiresIn = this.parseExpiry(expiresInStr);

    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: expiresInStr,
    });

    return { accessToken, expiresIn };
  }

  async createTemp2faToken(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, type: 'temp_2fa' } satisfies TempTokenPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '5m',
      },
    );
  }

  async verifyTemp2faToken(token: string): Promise<string> {
    try {
      const payload = await this.jwt.verifyAsync<TempTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'temp_2fa') {
        throw new UnauthorizedException('Invalid token type');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session');
    }
  }

  async createRefreshToken(userId: string, familyId?: string): Promise<RefreshTokenResult> {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const resolvedFamilyId = familyId ?? randomUUID();

    const expiresInStr = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseExpiry(expiresInStr) * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        familyId: resolvedFamilyId,
        userId,
        expiresAt,
      },
    });

    return { rawToken, familyId: resolvedFamilyId };
  }

  async rotateRefreshToken(
    rawToken: string,
  ): Promise<{ accessToken: string; expiresIn: number; newRefreshToken: string; user: { id: string; email: string; roles: string[] } }> {
    const tokenHash = this.hashToken(rawToken);

    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection: token already rotated or revoked → revoke entire family
    if (existing.revokedAt || existing.replacedByTokenId) {
      await this.revokeTokenFamily(existing.familyId);
      throw new UnauthorizedException('Refresh token reuse detected — session revoked');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (existing.user.deletedAt) {
      throw new UnauthorizedException('Account not found');
    }

    const newRaw = this.generateRawToken();
    const newHash = this.hashToken(newRaw);
    const expiresInStr = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseExpiry(expiresInStr) * 1000);

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          tokenHash: newHash,
          familyId: existing.familyId,
          userId: existing.userId,
          expiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: created.id,
        },
      });
    });

    const { accessToken, expiresIn } = await this.createAccessToken({
      id: existing.user.id,
      email: existing.user.email,
      roles: existing.user.roles,
    });

    return {
      accessToken,
      expiresIn,
      newRefreshToken: newRaw,
      user: {
        id: existing.user.id,
        email: existing.user.email,
        roles: existing.user.roles,
      },
    };
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 60);
  }
}
