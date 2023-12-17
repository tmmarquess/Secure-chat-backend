import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './app/gateway/gateway.module';
import { RabbitClientModule } from './app/rabbit-client/rabbit-client.module';
import { UsersModule } from './app/users/users.module';
import { PrismaClientModule } from './app/prisma-client/prisma-client.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    GatewayModule,
    RabbitClientModule,
    UsersModule,
    PrismaClientModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
