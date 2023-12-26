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
import { MessageDTO } from './dto/message.dto';
import { JoinChatDTO } from './dto/join-payload.dto';

@WebSocketGateway({ cors: true })
export class MyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private rabbitClientService: RabbitClientService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Connected to ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    console.log(`disconnected to ${client.id}`);
  }

  @SubscribeMessage('join chat')
  joinChat(
    @MessageBody() data: JoinChatDTO,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`${client.id} join chat > ${data.chatId}`);
    client.join(data.chatId);
  }

  @SubscribeMessage('setup')
  setuUser(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`${client.id} setup > ${data.email}}`);
    client.join(data.email);
    client.emit('connected');
    // client.join(data);
  }

  @SubscribeMessage('typing')
  setTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`${client.id} typing in ${data}`);
    this.server.in(data).emit('typing');
  }

  @SubscribeMessage('stop typing')
  stopTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`${client.id} not typing in ${data}`);
    this.server.in(data).emit('stop typing');
  }

  @SubscribeMessage('testConnection')
  test(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`${client.id} joined room ${data}`);
    client.join(data);
  }

  @SubscribeMessage('emitRoom')
  emitForRoom(@MessageBody() data: MessageDTO) {
    console.log(`sending message to room ${data.receiverId}`);
    this.server.to(data.receiverId).emit('emitRoom', data);
  }
}
