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

  connectedUsers: { socket: Socket; email: string }[] = [];

  handleConnection(client: Socket) {
    console.log(`Connected to ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    console.log(`disconnected to ${client.id}`);
    this.connectedUsers = this.connectedUsers.filter((user) => {
      return user.socket.id !== client.id;
    });
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
    console.log(`${client.id} joinRoom > ${data}`);
    client.join(data);
  }

  @SubscribeMessage('setup')
  async setupUser(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`${client.id} setup > ${data.email}`);
    this.connectedUsers.push({ socket: client, email: data.email });

    client.join(data.email);
    const userGroups = await this.usersService.getUserGroups(data.email);
    client.emit(
      'connected',
      userGroups.map((groupInfo) => {
        return groupInfo.group;
      }),
    );
    this.server
      .to(`${data.email}-online`)
      .emit('isOnline', { email: data.email, online: true });
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

  @SubscribeMessage('logout')
  async logOutUser(@MessageBody() email: string) {
    this.server
      .to(`${email}-online`)
      .emit('isOnline', { email: email, online: false });
  }

  @SubscribeMessage('isOnline')
  async isOnline(
    @MessageBody() email: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`${email}-online`);
    this.connectedUsers.forEach((user) => {
      if (user.email === email) {
        client.emit('isOnline', { email: email, online: true });
      }
    });
  }

  // @SubscribeMessage('typing')
  // setTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
  //   console.log(`${client.id} typing in ${data}`);
  //   this.server.in(data).emit('typing');
  // }

  // @SubscribeMessage('stop typing')
  // stopTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
  //   console.log(`${client.id} not typing in ${data}`);
  //   this.server.in(data).emit('stop typing');
  // }

  @SubscribeMessage('emitRoom')
  emitForRoom(@MessageBody() data: MessageDTO) {
    console.log(
      `${data.senderEmail} sending message to room ${data.receiverId} ==> \n ${data.message}`,
    );
    this.server.to(data.receiverId).emit('emitRoom', data);
  }
}
