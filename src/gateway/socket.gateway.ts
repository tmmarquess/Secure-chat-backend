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
import { RabbitClientService } from 'src/rabbit-client/rabbit-client.service';
import { MessageTemplate } from './message.entity';

@WebSocketGateway({})
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
  onNewMessage(
    @MessageBody() data: MessageTemplate,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(data);
    client.emit('onMessage', 'Message received');
    this.rabbitClientService.sendMessage(data.userId, data.message);
  }
}
