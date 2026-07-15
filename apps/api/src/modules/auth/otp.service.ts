import { randomInt } from 'crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from './password.service';
import { QueueService } from '../../jobs/queue.service';
import { QUEUE_NAMES } from '../../jobs/queues';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {}

  generateCode(): string {
    return randomInt(100000, 999999).toString();
  }

  async sendOtp(userId: string, phone: string): Promise<void> {
    const recent = await this.prisma.phoneOtp.count({
      where: {
        userId,
        phone,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });

    if (recent > 0) {
      throw new HttpException('OTP zaten gönderildi, lütfen bekleyin', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.generateCode();
    const codeHash = await this.password.hash(code);

    await this.prisma.phoneOtp.create({
      data: {
        userId,
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.queue.addJob(QUEUE_NAMES.NOTIFICATION, {
      eventType: 'otp.send',
      userId,
      phone,
      code,
    });

    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV] OTP for ${phone}: ${code}`);
    }
  }

  async verifyOtp(userId: string, phone: string, code: string): Promise<void> {
    const otp = await this.prisma.phoneOtp.findFirst({
      where: {
        userId,
        phone,
        verifiedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Geçerli OTP bulunamadı');
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new HttpException('Çok fazla deneme, yeni kod isteyin', HttpStatus.TOO_MANY_REQUESTS);
    }

    const valid = await this.password.verify(otp.codeHash, code);

    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    if (!valid) {
      throw new BadRequestException('Geçersiz doğrulama kodu');
    }

    await this.prisma.$transaction([
      this.prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { verifiedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { phone, phoneVerifiedAt: new Date() },
      }),
    ]);
  }
}
