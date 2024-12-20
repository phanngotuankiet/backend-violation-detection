import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QAEvent, SensitiveSearchNotification } from './websocket.types';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private adminSockets: Map<string, Socket> = new Map();
  private userSockets: Map<number, Socket[]> = new Map();

  handleConnection(client: Socket) {
    const isAdmin = client.handshake.query.isAdmin === 'true';
    if (isAdmin) {
      this.adminSockets.set(client.id, client);
    }
    console.log('Client connected:', client.id);

    const userId = Number(client.handshake.query.userId);
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      userSockets.push(client);
      this.userSockets.set(userId, userSockets);
    }
  }

  handleDisconnect(client: Socket) {
    this.adminSockets.delete(client.id);
    console.log('Client disconnected:', client.id);

    const userId = Number(client.handshake.query.userId);
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      const updatedSockets = userSockets.filter(
        (socket) => socket.id !== client.id,
      );
      this.userSockets.set(userId, updatedSockets);
    }
  }

  @SubscribeMessage('newSensitiveSearch')
  handleSensitiveSearch(client: Socket, data: any) {
    this.adminSockets.forEach((socket) => {
      socket.emit('sensitiveSearchAlert', data);
    });
  }

  notifyAdmins(data: SensitiveSearchNotification) {
    this.adminSockets.forEach((socket) => {
      socket.emit('sensitiveSearchAlert', data);
    });
  }

  emitQAEvent(event: QAEvent) {
    this.server.emit('qaEvent', event);
  }
}
