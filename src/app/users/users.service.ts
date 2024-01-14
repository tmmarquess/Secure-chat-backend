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

  async getAllEmails(currentUserToken: string) {
    const jwtPayload = await this.jwtService.verifyAsync(currentUserToken, {
      secret: process.env.JWT_SECRET_KEY,
    });

    return this.prisma.user.findMany({
      where: { id: { not: jwtPayload.sub } },
      select: { email: true },
    });
  }

  // private generateKeys() {
  //   return generateKeyPairSync('rsa', {
  //     modulusLength: 2048,
  //     publicKeyEncoding: {
  //       type: 'spki',
  //       format: 'pem',
  //     },
  //     privateKeyEncoding: {
  //       type: 'pkcs8',
  //       format: 'pem',
  //     },
  //   });
  // }

  async savePubKey(pubKey: string, userEmail: string) {
    try {
      await this.prisma.user.update({
        where: { email: userEmail },
        data: { pubkey: pubKey },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getPubKey(id: string) {
    if (id.includes('@')) {
      const data = await this.prisma.user.findUnique({
        where: { email: id },
        select: { pubkey: true },
      });

      return data.pubkey;
    } else {
      return await this.prisma.groups.findUnique({
        where: { id: id },
        select: { simetricKey: true },
      });
    }
  }

  async createGroup(
    groupName: string,
    groupCreator: string,
    groupUsers: string[],
    groupKey: string,
  ) {
    groupUsers.push(groupCreator);

    const createdGroup = await this.prisma.groups.create({
      data: {
        group_name: groupName,
        simetricKey: groupKey,
      },
    });

    const usersData = [];

    for (const index in groupUsers) {
      usersData.push({
        group_id: createdGroup.id,
        user_id: (await this.findOneByEmail(groupUsers[index])).id,
      });
    }
    await this.prisma.groupUsers.createMany({ data: usersData });

    return createdGroup;
  }

  async getUserGroups(userEmail: string) {
    const userData = await this.findOneByEmail(userEmail);
    return this.prisma.groupUsers.findMany({
      where: { user_id: userData.id },
      include: { group: true },
    });
  }

  async findGroupById(groupId: string) {
    return this.prisma.groups.findUnique({
      where: { id: groupId },
      select: { group_name: true, id: true },
    });
  }
}
