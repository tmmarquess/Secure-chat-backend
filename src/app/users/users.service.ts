import { Injectable } from '@nestjs/common';
import { PrismaClientService } from '../prisma-client/prisma-client.service';
import { hashSync } from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaClientService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { email: email } });
  }

  async createUser(user: Prisma.UserCreateInput) {
    user.password = hashSync(user.password, 10);
    return this.prisma.user.create({ data: user });
  }
}
