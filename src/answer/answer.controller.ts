// src/answer/answer.controller.ts
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
import { AnswerService } from './answer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('answers')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Get('question/:questionId')
  getAnswersByQuestionId(@Param('questionId') questionId: number) {
    return this.answerService.getAnswersByQuestionId(Number(questionId));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAnswer(
    @Body() data: { content: string; questionId: number },
    @Request() req,
  ) {
    return this.answerService.createAnswer({
      ...data,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateAnswer(
    @Param('id') id: number,
    @Body() data: { content: string },
    @Request() req,
  ) {
    return this.answerService.updateAnswer(Number(id), req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteAnswer(@Param('id') id: number, @Request() req) {
    return this.answerService.deleteAnswer(Number(id), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/accept')
  async acceptAnswer(@Param('id') id: number, @Request() req) {
    return this.answerService.acceptAnswer(Number(id), req.user.id);
  }
}
