import { Injectable, Logger } from '@nestjs/common';
import { ListingImageStatus } from '@prisma/client';
import { Worker, Job } from 'bullmq';
import sharp from 'sharp';
import fileType from 'file-type';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QUEUE_NAMES } from './queues';

interface ImageJobData {
  imageId: string;
  listingId: string;
  quarantineKey: string;
}

@Injectable()
export class ImageProcessingProcessor {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  createWorker(connection: { host: string; port: number; password?: string }): Worker {
    return new Worker<ImageJobData>(
      QUEUE_NAMES.IMAGE_PROCESSING,
      async (job) => this.process(job),
      { connection, concurrency: 2 },
    );
  }

  async process(job: Job<ImageJobData>): Promise<void> {
    const { imageId, listingId, quarantineKey } = job.data;
    this.logger.log(`Processing image ${imageId}`);

    await this.prisma.listingImage.update({
      where: { id: imageId },
      data: { status: ListingImageStatus.PROCESSING },
    });

    try {
      const raw = await this.storage.downloadQuarantine(quarantineKey);
      const detected = await fileType.fromBuffer(raw);

      if (!detected || !['image/jpeg', 'image/png', 'image/webp'].includes(detected.mime)) {
        throw new Error(`Invalid mime type: ${detected?.mime ?? 'unknown'}`);
      }

      const processed = await sharp(raw)
        .rotate()
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      const publicKey = `listings/${listingId}/${imageId}.jpg`;
      await this.storage.uploadPublic(publicKey, processed.data, 'image/jpeg');

      await this.prisma.listingImage.update({
        where: { id: imageId },
        data: {
          status: ListingImageStatus.PUBLISHED,
          publicKey,
          mimeType: 'image/jpeg',
          width: processed.info.width,
          height: processed.info.height,
        },
      });

      this.logger.log(`Image ${imageId} published`);
    } catch (error) {
      await this.prisma.listingImage.update({
        where: { id: imageId },
        data: { status: ListingImageStatus.FAILED },
      });
      throw error;
    }
  }
}
