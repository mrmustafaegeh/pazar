import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Public()
  @Get(':id/profile')
  @ApiOperation({ summary: 'Public seller profile' })
  getProfile(@Param('id') id: string) {
    return this.users.getPublicProfile(id);
  }
}
