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
        orderBy: {
          createdAt: 'desc',
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
  async getAllQuestions() {
    return this.prisma.question.findMany({
      include: {
        user: true,
        answers: {
          include: {
            user: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteQuestion(id: number) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.question.delete({ where: { id } });
  }
  async getAllAnswers() {
    return this.prisma.answer.findMany({
      include: {
        user: true,
        question: true,
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAnswer(id: number) {
    const answer = await this.prisma.answer.findUnique({ where: { id } });
    if (!answer) throw new NotFoundException('Answer not found');

    return this.prisma.answer.delete({ where: { id } });
  }

  async toggleAnswerAcceptance(id: number) {
    const answer = await this.prisma.answer.findUnique({ where: { id } });
    if (!answer) throw new NotFoundException('Answer not found');

    return this.prisma.answer.update({
      where: { id },
      data: { isAccepted: !answer.isAccepted },
    });
  }

  async getAllComments() {
    return this.prisma.comment.findMany({
      include: {
        user: true,
        answer: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteComment(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.comment.delete({ where: { id } });
  }
}
