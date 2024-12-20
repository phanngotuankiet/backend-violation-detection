import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async getAllQuestions() {
    return this.prisma.question.findMany({
      include: {
        user: true,
        answers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getQuestionById(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        user: true,
        answers: {
          include: {
            user: true,
            comments: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question #${id} not found`);
    }

    return question;
  }

  // async createQuestion(data: {
  //   title: string;
  //   content: string;
  //   userId: number;
  // }) {
  //   return this.prisma.question.create({
  //     data,
  //     include: {
  //       user: true,
  //     },
  //   });
  // }
  async createQuestion(data: {
    title: string;
    content: string;
    userId: number;
  }) {
    const question = await this.prisma.question.create({
      data,
      include: { user: true },
    });

    this.websocketGateway.emitQAEvent({
      type: 'question',
      action: 'create',
      data: question,
    });

    return question;
  }

  async updateQuestion(
    id: number,
    userId: number,
    data: { title: string; content: string },
  ) {
    // Add logging to debug
    console.log('Updating question:', { questionId: id, userId });

    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // Add logging to compare IDs
    console.log('Question owner:', question.userId);
    console.log('Current user:', userId);

    // Check if user is owner or admin
    const isOwner = question.userId === userId;
    // Add admin check if needed
    // const isAdmin = user.role === 'admin';

    if (!isOwner) {
      throw new ForbiddenException('You can only edit your own questions');
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
      },
      include: {
        user: true,
        answers: {
          include: {
            user: true,
            comments: true,
          },
        },
      },
    });
  }

  async deleteQuestion(id: number, userId: number) {
    try {
      // Log the deletion attempt
      console.log(`Attempting to delete question ${id} by user ${userId}`);

      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          answers: {
            include: {
              comments: true,
            },
          },
        },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      if (question.userId !== userId) {
        throw new ForbiddenException('You can only delete your own questions');
      }

      // Delete comments first
      for (const answer of question.answers) {
        await this.prisma.comment.deleteMany({
          where: { answerId: answer.id },
        });
      }

      // Delete answers
      await this.prisma.answer.deleteMany({
        where: { questionId: id },
      });

      // Finally delete the question
      await this.prisma.question.delete({
        where: { id },
      });

      return { message: 'Question and related content deleted successfully' };
    } catch (error) {
      console.error('Error during question deletion:', error);
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }
}
