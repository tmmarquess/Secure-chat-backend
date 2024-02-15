import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './app/gateway/gateway.module';
import { UsersModule } from './app/users/users.module';
import { PrismaClientModule } from './app/prisma-client/prisma-client.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './app/mail/mail.module';

@Module({
  imports: [
    GatewayModule,
    UsersModule,
    PrismaClientModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
