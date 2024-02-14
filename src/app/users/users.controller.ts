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
    return this.usersService.createUser(user);
  }

  @UseGuards(AuthGuard)
  @Get('/get/:email')
  async getUser(@Param('email') userEmail: string) {
    const userData = await this.usersService.findOneByEmail(userEmail);

    return { name: userData.name, id: userData.email };
  }

  @UseGuards(AuthGuard)
  @Get('groups/get/:id')
  async getGroupName(@Param('id') groupId: string) {
    const groupData = await this.usersService.findGroupById(groupId);

    return { name: groupData.group_name, id: groupData.id };
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

  @UseGuards(AuthGuard)
  @Get('emails')
  async getAllUsersEmails(@Req() request: Request) {
    const currentUserToken = request.headers.authorization.split(' ')[1];
    return (await this.usersService.getAllEmails(currentUserToken)).map(
      (user) => {
        return user.email;
      },
    );
  }

  @UseGuards(AuthGuard)
  @Get('pubkey/:value')
  async getUserPubKey(@Param('value') userEmail: string) {
    try {
      const pubkey = await this.usersService.getPubKey(userEmail);
      return pubkey;
    } catch (error) {
      return '';
    }
  }
}
