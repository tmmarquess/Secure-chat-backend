import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitClientService } from './rabbit-client.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CHAT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'chat',
          noAck: true,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  providers: [RabbitClientService],
  exports: [RabbitClientService],
})
export class RabbitClientModule {}
