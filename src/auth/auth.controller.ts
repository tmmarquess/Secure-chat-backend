import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() userDto: AuthenticateUserDto) {
    try {
      return await this.authService.login(userDto.email, userDto.password);
    } catch (e) {
      return {
        success: false,
        statusCode: 400,
        message: 'Invalid Email or Password',
      };
    }
  }
}
