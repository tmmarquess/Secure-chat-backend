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
import { MailService } from '../mail/mail.service';

@Controller('users')
export class UsersController {
  usersToConfirm: { email: string; token: string }[] = [];

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Post()
  async createNewUser(
    @Body() user: Prisma.UserCreateInput,
    @Req() req: Request,
  ) {
    this.usersService.createUser(user);
    const token = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`${req.protocol}://${req.get('Host')}${req.originalUrl}`);
    await this.mailService.sendUserConfirmation(
      user,
      token,
      `${req.protocol}://${req.get('Host')}${req.originalUrl}`,
    );
    this.usersToConfirm.push({ email: user.email, token: token });
    return;
  }

  @Get('/confirm/:token')
  async confirmUser(@Param('token') token: string) {
    let userConfirmed = false;
    this.usersToConfirm.filter((user) => {
      if (user.token === token) {
        this.usersService.confirmUser(user.email);
        userConfirmed = true;
      }
      return user.token !== token;
    });
    return userConfirmed
      ? 'Usuário ativado no sistema'
      : 'Token expirado ou inexistente';
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
