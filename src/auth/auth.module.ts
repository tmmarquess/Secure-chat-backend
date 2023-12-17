import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/app/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: `${process.env.NODE_ENV}.env` }),
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY, // openssl rand -base64 32      Linux terminal
      signOptions: { expiresIn: '2d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
})
export class AuthModule {}
