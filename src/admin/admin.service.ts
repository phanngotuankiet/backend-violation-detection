/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!users || users.length === 0) {
        throw new NotFoundException('No users found');
      }

      return users;
    } catch (error) {
      throw new NotFoundException('Failed to fetch users');
    }
  }

  async addUser(user: User) {
    const defaultPassword = '123123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    try {
      const addUser = this.prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
          password: hashedPassword,
        },
      });
      console.log(
        'Added User Successfully',
        user.email + user.name + user.role,
      );
      return addUser;
    } catch (error) {
      console.error('Error added user:', error);
      throw new Error('Could not add user');
    }
  }
  async deleteUser(userId: number) {
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    try {
      const deletedUser = await this.prisma.user.delete({
        where: {
          id: id,
        },
      });
      console.log(`Deleted user with id: ${id}`);
      return deletedUser;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Could not delete user');
    }
  }
  async updateUser(userId: number, userData: User) {
    try {
      const parsedUserId =
        typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(parsedUserId)) {
        throw new Error('Invalid user ID');
      }
      const updatedUser = await this.prisma.user.update({
        where: { id: parsedUserId },
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
      });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Could not update user');
    }
  }
}
