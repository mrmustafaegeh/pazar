import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';

const startConversationSchema = z.object({
  sellerId: z.string().cuid(),
  listingId: z.string().uuid().optional(),
});

const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

@ApiTags('messaging')
@Controller('messaging')
@ApiBearerAuth()
export class MessagingController {
  constructor(
    private readonly messaging: MessagingService,
    private readonly gateway: MessagingGateway,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List user conversations' })
  getConversations(@CurrentUser() user: { id: string }) {
    return this.messaging.getConversations(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.messaging.getUnreadCount(user.id).then((count) => ({ count }));
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start or get existing conversation' })
  startConversation(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = startConversationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message ?? 'Invalid request');
    }

    return this.messaging.startConversation(user.id, parsed.data.sellerId, parsed.data.listingId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  getMessages(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.messaging.getMessages(user.id, id);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation messages as read' })
  markRead(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.messaging.markConversationRead(user.id, id).then(() => ({ ok: true }));
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message (REST fallback)' })
  async sendMessage(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message ?? 'Invalid request');
    }

    const { message, conversation, recipientId, listingTitle } = await this.messaging.sendMessage(
      user.id,
      id,
      parsed.data.body,
    );

    this.gateway.publishMessage(id, message, recipientId, listingTitle);
    return message;
  }
}
