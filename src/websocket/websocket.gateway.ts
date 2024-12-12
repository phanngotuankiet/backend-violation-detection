import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SensitiveSearchNotification } from './websocket.types';

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

  handleConnection(client: Socket) {
    const isAdmin = client.handshake.query.isAdmin === 'true';
    if (isAdmin) {
      this.adminSockets.set(client.id, client);
    }
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    this.adminSockets.delete(client.id);
    console.log('Client disconnected:', client.id);
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
}
