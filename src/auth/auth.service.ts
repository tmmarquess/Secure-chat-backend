import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/app/users/users.service';
import { compareSync } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    let user: User;
    try {
      user = await this.usersService.findOneByEmail(email);
    } catch (error) {
      throw new UnauthorizedException();
    }

    if (!compareSync(password, user.password)) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      success: true,
      statusCode: 200,
      id: user.id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: this.jwtService.sign(payload),
      message: 'Authenticated Successfully',
    };
  }
}
