import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  getAllQuestions() {
    return this.questionService.getAllQuestions();
  }

  @Get(':id')
  getQuestionById(@Param('id') id: number) {
    return this.questionService.getQuestionById(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createQuestion(
    @Body() data: { title: string; content: string },
    @Request() req: RequestWithUser,
  ) {
    return this.questionService.createQuestion({
      ...data,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateQuestion(
    @Param('id') id: number,
    @Body() data: { title: string; content: string },
    @Request() req: RequestWithUser,
  ) {
    // Add detailed logging
    console.log('Request user:', req.user);
    console.log('Authorization header:', req.headers['authorization']); // Use bracket notation

    const userId = req.user.id; // Use id directly since it's set by JwtStrategy

    return this.questionService.updateQuestion(
      Number(id),
      Number(userId),
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteQuestion(
    @Param('id') id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.questionService.deleteQuestion(Number(id), req.user.id);
  }
}
