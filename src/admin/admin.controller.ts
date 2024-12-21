/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Question, User } from '@prisma/client';
import { PaginatedResult, PaginationParams } from 'src/constants/pagination';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  // async getAllUsers() {
  //   return this.adminService.getAllUsers();
  // }
  async getAllUsers(@Query() query: PaginationParams) {
    return this.adminService.getAllUsers(query);
  }
  @Post('add-user')
  async addUser(@Body() userData: User): Promise<User> {
    return this.adminService.addUser(userData);
  }
  @Delete('delete-user/:id')
  async deleteUser(@Param('id') id: number) {
    const deletedUser = await this.adminService.deleteUser(id);
    return deletedUser;
  }
  @Put('update-user/:id')
  async updateUser(
    @Param('id') userId: number,
    @Body() userData: User,
  ): Promise<User> {
    return this.adminService.updateUser(userId, userData);
  }
  @Get('questions')
  // async getAllQuestions() {
  //   return this.adminService.getAllQuestions();
  // }
  async getAllQuestions(
    @Query() query: PaginationParams,
  ): Promise<PaginatedResult<Question>> {
    return this.adminService.getAllQuestions(query);
  }

  @Delete('questions/:id')
  async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteQuestion(id);
  }
  @Get('answers')
  async getAllAnswers() {
    return this.adminService.getAllAnswers();
  }

  @Delete('answers/:id')
  async deleteAnswer(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteAnswer(id);
  }

  @Put('answers/:id/toggle-acceptance')
  async toggleAnswerAcceptance(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleAnswerAcceptance(id);
  }

  @Get('comments')
  async getAllComments() {
    return this.adminService.getAllComments();
  }
  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteComment(id);
  }
  @Get('stats/users')
  @UseGuards(JwtAuthGuard)
  async getUserStats() {
    return this.adminService.getUserStats();
  }
  @Get('stats/forum')
  @UseGuards(JwtAuthGuard)
  async getForumStats() {
    return this.adminService.getForumStats();
  }
  @Get('stats/contributors')
  @UseGuards(JwtAuthGuard)
  async getTopContributors() {
    return this.adminService.getTopContributors();
  }

  @Get('users/search')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async searchUsers(
    @Query('q') query: string,
    @Query() params: PaginationParams,
  ) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return this.adminService.searchUsers(query, params);
  }
}
