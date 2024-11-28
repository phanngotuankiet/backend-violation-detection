import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('update-name')
  async updateName(@Request() req, @Body() body: { name: string }) {
    console.log('Thay đổi name', req.user);

    return await this.userService.updateName(req.user.id, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMe(@Request() req) {
    console.log(req.user);
    return await this.userService.findUserById(req.user.id);
  }
}
