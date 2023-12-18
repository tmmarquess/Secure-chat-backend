import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RabbitClientService } from 'src/app/rabbit-client/rabbit-client.service';

@WebSocketGateway({ cors: true })
export class MyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private rabbitClientService: RabbitClientService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Connected to ${client.id} [${args}]`);
  }
  handleDisconnect(client: Socket) {
    console.log(`disconnected to ${client.id}`);
  }

  @SubscribeMessage('newMessage')
  onNewMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // client.emit('onMessage', 'Message received');
    this.rabbitClientService.sendMessage(data.receiver, data);
  }
}
