import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createNewUser(@Body() user: Prisma.UserCreateInput) {
    const newUser = await this.usersService.createUser(user);
    return {
      success: true,
      statusCode: 200,
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      pic: newUser.pic,
      message: 'User created Successfully, now login',
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUser(@Param('id') userId: string) {
    return this.usersService.findOneById(userId);
  }

  @UseGuards(AuthGuard)
  @Get('search/:value')
  async getUsers(@Param('value') searchName: string, @Req() request: Request) {
    const currentUserToken = request.headers.authorization.split(' ')[1];
    if (searchName.length === 0) {
      return [];
    }
    return this.usersService.queryUsers(searchName, currentUserToken);
  }
}
