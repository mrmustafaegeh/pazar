import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from '../src/modules/auth/password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();
    service = module.get(PasswordService);
  });

  it('hashes and verifies with argon2id', async () => {
    const hash = await service.hash('SecurePass1');
    expect(hash).not.toBe('SecurePass1');
    expect(await service.verify(hash, 'SecurePass1')).toBe(true);
    expect(await service.verify(hash, 'WrongPass1')).toBe(false);
  });
});
