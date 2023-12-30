import { Module } from '@nestjs/common';
import { MyGateway } from './socket.gateway';

@Module({ imports: [], providers: [MyGateway] })
export class GatewayModule {}
