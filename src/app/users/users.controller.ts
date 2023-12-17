import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createNewUser(@Body() user: Prisma.UserCreateInput) {
    return this.usersService.createUser(user);
  }
}
