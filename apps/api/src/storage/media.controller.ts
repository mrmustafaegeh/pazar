import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { StorageService } from '../storage/storage.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get('*')
  @ApiOperation({ summary: 'Serve public media files (dev/local)' })
  async serve(@Param() params: Record<string, string>, @Res() res: Response) {
    const key = params['0'];
    if (!key) throw new NotFoundException();

    try {
      const buffer = await this.storage.downloadPublic(key);
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.type('image/jpeg').send(buffer);
    } catch {
      throw new NotFoundException('Medya bulunamadı');
    }
  }
}
