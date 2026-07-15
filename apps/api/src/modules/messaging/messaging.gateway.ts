import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { AccessTokenPayload } from '../auth/token.service';

export interface MessageNotificationPayload {
  conversationId: string;
  message: {
    id: string;
    body: string;
    senderId: string;
    conversationId: string;
    createdAt: Date;
  };
  listingTitle?: string | null;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly messaging: MessagingService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization?.replace('Bearer ', '') ?? '');

      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'access') throw new Error('Invalid token');

      client.data.userId = payload.sub;
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(client.id);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; body: string },
  ) {
    const userId = client.data.userId as string;
    const { message, conversation, recipientId, listingTitle } = await this.messaging.sendMessage(
      userId,
      data.conversationId,
      data.body,
    );

    this.publishMessage(data.conversationId, message, recipientId, listingTitle);
    return message;
  }

  publishMessage(
    conversationId: string,
    message: MessageNotificationPayload['message'],
    recipientId: string,
    listingTitle?: string | null,
  ) {
    this.server.to(`conversation:${conversationId}`).emit('message', message);
    this.emitToUser(recipientId, 'notification', {
      conversationId,
      message,
      listingTitle: listingTitle ?? null,
    } satisfies MessageNotificationPayload);
  }

  private emitToUser(userId: string, event: string, payload: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, payload);
    }
  }
}
