import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitClientService {
  constructor(@Inject('CHAT_SERVICE') private client: ClientProxy) {}

  async sendMessage(userId: string, message: any) {
    try {
      console.log(`${userId} - ${message}`);
      this.client.emit(userId, message);

      return {
        message: 'message sent',
      };
    } catch (error) {
      console.log(error);
    }
  }
}
