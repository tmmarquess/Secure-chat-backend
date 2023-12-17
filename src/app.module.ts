import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.module';
import { RabbitClientModule } from './rabbit-client/rabbit-client.module';

@Module({
  imports: [GatewayModule, RabbitClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
