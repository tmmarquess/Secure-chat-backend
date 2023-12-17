import { Module } from '@nestjs/common';
import { MyGateway } from './socket.gateway';
import { RabbitClientModule } from 'src/rabbit-client/rabbit-client.module';

@Module({ imports: [RabbitClientModule], providers: [MyGateway] })
export class GatewayModule {}
