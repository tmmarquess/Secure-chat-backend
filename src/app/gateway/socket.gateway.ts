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
import { MessageDTO } from './dto/message.dto';
import { JoinChatDTO } from './dto/join-payload.dto';
import { UsersService } from '../users/users.service';

@WebSocketGateway({ cors: true })
export class MyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly usersService: UsersService) {}

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
  async setuUser(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`${client.id} setup > ${data.email}}`);

    client.join(data.email);
    client.emit('connected');
  }

  @SubscribeMessage('sendPubKey')
  async getPubKey(
    @MessageBody() email: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`${client.id} asked for ${email} pubkey`);
    const pubkey = await this.usersService.getPubKey(email);
    client.emit('getPubKey', pubkey.pubkey);
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

  @SubscribeMessage('emitRoom')
  emitForRoom(@MessageBody() data: MessageDTO) {
    console.log(`sending message to room ${data.receiverId}`);
    this.server.to(data.receiverId).emit('emitRoom', data);
  }
}
