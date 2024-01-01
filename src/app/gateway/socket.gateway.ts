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
import { CreateGroupDTO } from './dto/join-payload.dto';
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

  @SubscribeMessage('createGroup')
  async joinChat(
    @MessageBody() data: CreateGroupDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const createdGroup = await this.usersService.createGroup(
      data.groupName,
      data.creatorEmail,
      data.selectedEmails,
    );
    client.emit('groupCreated', createdGroup);
    for (const index in data.selectedEmails) {
      this.server
        .to(data.selectedEmails[index])
        .emit('connected', [createdGroup]);
    }
  }

  @SubscribeMessage('joinRoom')
  async joinGroup(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`${client.id} setup > ${data}}`);
    client.join(data);
  }

  @SubscribeMessage('setup')
  async setuUser(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`${client.id} setup > ${data.email}}`);

    client.join(data.email);
    const userGroups = await this.usersService.getUserGroups(data.email);
    client.emit(
      'connected',
      userGroups.map((groupInfo) => {
        return groupInfo.group;
      }),
    );
  }

  @SubscribeMessage('sendPubKey')
  async getPubKey(
    @MessageBody() id: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`${client.id} asked for ${id} pubkey`);
    const pubkey = await this.usersService.getPubKey(id);
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
