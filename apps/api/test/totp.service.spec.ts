import { Test, TestingModule } from '@nestjs/testing';
import { authenticator } from 'otplib';
import { Role } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { ADMIN_ROLES, TotpService } from '../src/modules/auth/totp.service';

describe('TotpService', () => {
  let service: TotpService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TotpService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(TotpService);
  });

  beforeEach(() => jest.clearAllMocks());

  it('requires 2FA for admin roles', () => {
    expect(service.requires2fa([Role.USER])).toBe(false);
    expect(service.requires2fa([Role.MODERATOR])).toBe(true);
    expect(service.requires2fa([Role.USER, Role.SUPPORT])).toBe(true);
    expect(ADMIN_ROLES).toContain(Role.SUPER_ADMIN);
  });

  it('generates and verifies TOTP secret', () => {
    const { secret } = service.generateSecret('admin@example.com');
    const code = authenticator.generate(secret);
    expect(service.verifyCode(secret, code)).toBe(true);
    expect(service.verifyCode(secret, '000000')).toBe(false);
  });

  it('enables 2FA after valid code', async () => {
    const { secret } = service.generateSecret('admin@example.com');
    const code = authenticator.generate(secret);

    mockPrisma.user.update.mockResolvedValue({});

    await service.setup2fa('user-1', secret, code);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { totpSecret: secret, totpEnabled: true },
    });
  });
});
