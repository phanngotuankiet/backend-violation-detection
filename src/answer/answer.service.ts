// src/answer/answer.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnswerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnswersByQuestionId(questionId: number) {
    return this.prisma.answer.findMany({
      where: { questionId },
      include: {
        user: true,
        comments: true,
      },
      orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createAnswer(data: {
    content: string;
    userId: number;
    questionId: number;
  }) {
    return this.prisma.answer.create({
      data,
      include: {
        user: true,
        comments: true,
      },
    });
  }

  async updateAnswer(id: number, userId: number, data: { content: string }) {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
    });

    if (!answer) {
      throw new NotFoundException(`Answer #${id} not found`);
    }

    if (answer.userId !== userId) {
      throw new ForbiddenException('You can only edit your own answers');
    }

    return this.prisma.answer.update({
      where: { id },
      data: {
        content: data.content,
        isEdited: true, // Set edited flag
      },
      include: {
        user: true,
        comments: true,
      },
    });
  }

  // src/answer/answer.service.ts
  async deleteAnswer(id: number, userId: number) {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
      include: {
        comments: true, // Include comments for logging
      },
    });

    console.log('database', answer.userId);
    console.log('request', userId);

    if (!answer) {
      throw new NotFoundException(`Answer #${id} not found`);
    }

    if (answer.userId !== userId) {
      throw new ForbiddenException('You can only delete your own answers');
    }

    // Delete answer and cascade delete comments
    await this.prisma.answer.delete({
      where: { id },
    });

    return { message: 'Answer and related comments deleted successfully' };
  }

  async acceptAnswer(id: number, userId: number) {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
      include: { question: true },
    });

    if (!answer) {
      throw new NotFoundException(`Answer #${id} not found`);
    }

    // Only question owner can accept answers
    if (answer.question.userId !== userId) {
      throw new ForbiddenException('Only question owner can accept answers');
    }

    // Reset other accepted answers for this question
    await this.prisma.answer.updateMany({
      where: {
        questionId: answer.questionId,
        isAccepted: true,
      },
      data: { isAccepted: false },
    });

    // Accept the selected answer
    return this.prisma.answer.update({
      where: { id },
      data: { isAccepted: true },
      include: {
        user: true,
        comments: true,
      },
    });
  }
}
