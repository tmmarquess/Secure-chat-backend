import { Module } from '@nestjs/common';
import { MyGateway } from './socket.gateway';
import { RabbitClientModule } from 'src/app/rabbit-client/rabbit-client.module';

@Module({ imports: [RabbitClientModule], providers: [MyGateway] })
export class GatewayModule {}
