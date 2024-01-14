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
import { SetupDTO } from './dto/setup.dto';

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
      if (user.socket.id === client.id) {
        this.server
          .to(`${user.email}-online`)
          .emit('isOnline', { email: user.email, online: false });
      }
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
      data.groupKey,
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
  async setupUser(
    @MessageBody() data: SetupDTO,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`${client.id} setup > ${data.userData.email}`);
    this.connectedUsers.push({ socket: client, email: data.userData.email });
    this.usersService.savePubKey(data.publicKey, data.userData.email);

    client.join(data.userData.email);
    const userGroups = await this.usersService.getUserGroups(
      data.userData.email,
    );
    client.emit(
      'connected',
      userGroups.map((groupInfo) => {
        return groupInfo.group;
      }),
    );
    this.server.to(`${data.userData.email}-online`).emit('isOnline', {
      email: data.userData.email,
      online: true,
      pubkey: data.publicKey,
    });
  }

  // @SubscribeMessage('sendPubKey')
  // async getPubKey(
  //   @MessageBody() id: string,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   console.log(`${client.id} asked for ${id} pubkey`);
  //   const pubkey = await this.usersService.getPubKey(id);
  //   client.emit('getPubKey', pubkey.pubkey);
  // }

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
    this.connectedUsers.forEach(async (user) => {
      if (user.email === email) {
        const pubkey = await this.usersService.getPubKey(email);
        client.emit('isOnline', { email: email, online: true, pubkey });
      }
    });
  }

  @SubscribeMessage('emitRoom')
  emitForRoom(@MessageBody() data: MessageDTO) {
    console.log(
      `${data.senderEmail} sending message to room ${data.receiverId} ==> \n ${data.message}`,
    );
    this.server.to(data.receiverId).emit('emitRoom', data);
  }
}
