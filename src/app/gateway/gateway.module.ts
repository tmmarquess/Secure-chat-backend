import { Module } from '@nestjs/common';
import { MyGateway } from './socket.gateway';
import { UsersModule } from '../users/users.module';

@Module({ imports: [UsersModule], providers: [MyGateway] })
export class GatewayModule {}
