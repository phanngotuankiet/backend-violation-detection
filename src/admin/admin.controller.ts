/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
}
