import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async getCommentsByAnswerId(answerId: number) {
    return this.prisma.comment.findMany({
      where: { answerId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // async createComment(data: {
  //   content: string;
  //   userId: number;
  //   answerId: number;
  // }) {
  //   return this.prisma.comment.create({
  //     data,
  //     include: {
  //       user: true,
  //     },
  //   });
  // }
  async createComment(data: {
    content: string;
    userId: number;
    answerId: number;
  }) {
    const comment = await this.prisma.comment.create({
      data,
      include: { user: true },
    });

    this.websocketGateway.emitQAEvent({
      type: 'comment',
      action: 'create',
      data: comment,
    });

    return comment;
  }

  async updateComment(id: number, userId: number, data: { content: string }) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: data.content,
        isEdited: true, // Set edited flag
      },
      include: {
        user: true,
      },
    });
  }

  async deleteComment(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }
}
