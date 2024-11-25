// src/comment/comment.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('answer/:answerId')
  getCommentsByAnswerId(@Param('answerId') answerId: number) {
    return this.commentService.getCommentsByAnswerId(Number(answerId));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createComment(
    @Body() data: { content: string; answerId: number },
    @Request() req,
  ) {
    return this.commentService.createComment({
      ...data,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateComment(
    @Param('id') id: number,
    @Body() data: { content: string },
    @Request() req,
  ) {
    return this.commentService.updateComment(Number(id), req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteComment(@Param('id') id: number, @Request() req) {
    return this.commentService.deleteComment(Number(id), req.user.id);
  }
}
