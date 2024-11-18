import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateName(userId: number, name: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async findUserById(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}
