import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';

describe('TokenService', () => {
  let tokenService: TokenService;

  const mockPrisma: {
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  } = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockPrisma) => unknown) =>
    fn(mockPrisma),
  );

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-access-secret-minimum-32-characters',
        }),
      ],
      providers: [
        TokenService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultVal?: string) => {
              const config: Record<string, string> = {
                JWT_ACCESS_SECRET: 'test-access-secret-minimum-32-characters',
                JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-32-characters',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key] ?? defaultVal;
            },
            getOrThrow: (key: string) => {
              const config: Record<string, string> = {
                JWT_ACCESS_SECRET: 'test-access-secret-minimum-32-characters',
                JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-32-characters',
              };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    tokenService = module.get(TokenService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates access token with correct payload', async () => {
    const result = await tokenService.createAccessToken({
      id: 'user-1',
      email: 'test@example.com',
      roles: ['USER'],
    });

    expect(result.accessToken).toBeDefined();
    expect(result.expiresIn).toBe(900);
  });

  it('detects refresh token reuse and revokes family', async () => {
    const rawToken = 'reused-token';
    const tokenHash = tokenService.hashToken(rawToken);

    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      tokenHash,
      familyId: 'family-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
      replacedByTokenId: 'rt-2',
      user: { id: 'user-1', email: 'test@example.com', roles: ['USER'], deletedAt: null },
    });

    await expect(tokenService.rotateRefreshToken(rawToken)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
