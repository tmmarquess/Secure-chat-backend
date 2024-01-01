import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientService } from '../prisma-client/prisma-client.service';
import { hashSync } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync } from 'crypto';

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

  private generateKeys() {
    return generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
  }

  async generateKeyPair(userEmail: string) {
    const userData = await this.findOneByEmail(userEmail);

    const currentKey = await this.prisma.keyPairs.findUnique({
      where: { user_id: userData.id },
    });

    if (currentKey === null) {
      const { publicKey, privateKey } = this.generateKeys();

      const newKeys = await this.prisma.keyPairs.create({
        data: {
          user_id: userData.id,
          pubkey: publicKey,
          privKey: privateKey,
        },
      });

      return {
        publicKey: await newKeys.pubkey,
        privateKey: await newKeys.privKey,
      };
    } else {
      return {
        publicKey: await currentKey.pubkey,
        privateKey: await currentKey.privKey,
      };
    }
  }

  async getPubKey(id: string) {
    if (id.includes('@')) {
      const userData = await this.findOneByEmail(id);

      const pubkey = await this.prisma.keyPairs.findUnique({
        where: { user_id: userData.id },
        select: { pubkey: true },
      });

      if (pubkey == null) {
        const newKeys = await this.generateKeyPair(id);
        return { pubkey: newKeys.publicKey };
      }
      return pubkey;
    } else {
      return await this.prisma.groups.findUnique({
        where: { id: id },
        select: { pubkey: true },
      });
    }
  }

  async createGroup(
    groupName: string,
    groupCreator: string,
    groupUsers: string[],
  ) {
    groupUsers.push(groupCreator);
    const { publicKey, privateKey } = this.generateKeys();

    const createdGroup = await this.prisma.groups.create({
      data: {
        group_name: groupName,
        pubkey: publicKey,
        privKey: privateKey,
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
