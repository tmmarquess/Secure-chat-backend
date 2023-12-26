import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientService } from '../prisma-client/prisma-client.service';
import { hashSync } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaClientService,
    private readonly jwtService: JwtService,
  ) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { email: email } });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: id } });
  }

  async createUser(user: Prisma.UserCreateInput) {
    user.password = hashSync(user.password, 10);
    try {
      return await this.prisma.user.create({ data: user });
    } catch (error) {
      throw new ForbiddenException('Email already exists');
    }
  }

  async queryUsers(userName: string, currentUserToken: string) {
    const jwtPayload = await this.jwtService.verifyAsync(currentUserToken, {
      secret: process.env.JWT_SECRET_KEY,
    });

    return this.prisma.user.findMany({
      where: { name: { contains: userName }, id: { not: jwtPayload.sub } },
      select: { email: true, name: true, id: true },
    });
  }
}
