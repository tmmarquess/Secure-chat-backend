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
    return this.prisma.user.findUniqueOrThrow({
      where: { email: email, activated: true },
    });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: id } });
  }

  async confirmUser(userEmail: string) {
    return this.prisma.user.update({
      data: { activated: true },
      where: { email: userEmail },
    });
  }

  async createUser(user: Prisma.UserCreateInput) {
    const regexSenha = new RegExp(
      '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$',
    );
    if (!regexSenha.test(user.password)) {
      throw new ForbiddenException('A senha não atende aos requisitos mínimos');
    }
    user.password = hashSync(user.password, 10);
    user.activated = false;
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
      where: {
        name: { contains: userName },
        id: { not: jwtPayload.sub },
        activated: true,
      },
      select: { email: true, name: true, id: true },
    });
  }

  async getAllEmails(currentUserToken: string) {
    const jwtPayload = await this.jwtService.verifyAsync(currentUserToken, {
      secret: process.env.JWT_SECRET_KEY,
    });

    return this.prisma.user.findMany({
      where: { id: { not: jwtPayload.sub }, activated: true },
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

  async getPubKey(userEmail: string) {
    const data = await this.prisma.user.findUnique({
      where: { email: userEmail },
      select: { pubkey: true },
    });

    return data.pubkey;
  }

  async createGroup(
    groupName: string,
    groupCreator: string,
    groupUsers: string[],
  ) {
    groupUsers.push(groupCreator);

    const createdGroup = await this.prisma.groups.create({
      data: {
        group_name: groupName,
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

  async getGroupUsers(groupId: string) {
    const users = await this.prisma.groupUsers.findMany({
      select: { user: { select: { email: true } } },
      where: { group_id: groupId },
    });
    return users;
  }

  async deleteUserFromGroup(groupId: string, userEmail: string) {
    const userData = await this.findOneByEmail(userEmail);
    console.log(`${groupId} - ${userData.id}`);
    await this.prisma.groupUsers.delete({
      where: { group_id_user_id: { group_id: groupId, user_id: userData.id } },
    });

    if ((await this.getGroupUsers(groupId)).length === 0) {
      this.prisma.groups.delete({ where: { id: groupId } });
    }
  }

  async findGroupById(groupId: string) {
    return this.prisma.groups.findUnique({
      where: { id: groupId },
      select: { group_name: true, id: true },
    });
  }
}
