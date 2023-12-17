import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitClientService {
  constructor(@Inject('CHAT_SERVICE') private client: ClientProxy) {}

  async sendMessage(userId: string, message: string) {
    try {
      this.client.emit(userId, {
        id: `${userId}-${Math.random() * 100}}`,
        data: {
          message: message,
        },
      });

      return {
        message: 'message sent',
      };
    } catch (error) {
      console.log(error);
    }
  }
}
