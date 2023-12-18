import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitClientService } from './rabbit-client.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

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
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [],
      uri: 'amqp://localhost:5672',
    }),
  ],
  providers: [RabbitClientService],
  exports: [RabbitClientService],
})
export class RabbitClientModule {}
