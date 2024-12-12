/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from '@prisma/client';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
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
  async getAllQuestions() {
    return this.adminService.getAllQuestions();
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
}
