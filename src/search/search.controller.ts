import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { SearchStatus } from 'src/websocket/websocket.types';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { PaginatedResult, PaginationParams } from 'src/constants/pagination';
import { SensitiveSearch } from '@prisma/client';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private websocketGateway: WebsocketGateway,
  ) {}

  @Post('videos')
  @UseGuards(JwtAuthGuard)
  async searchVideos(@Body() data: { searchTerm: string }, @Request() req) {
    const result = await this.searchService.searchVideos(
      data.searchTerm,
      req.user.id,
    );
    return result;
  }
  @Post('check')
  @UseGuards(JwtAuthGuard)
  async checkSearch(@Body() data: { searchTerm: string }, @Request() req) {
    return this.searchService.checkSensitiveContent(
      data.searchTerm,
      req.user.id,
    );
  }

  @Get('sensitive')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  // async getSensitiveSearches() {
  //   return this.searchService.getSensitiveSearches();
  // }
  async getSensitiveSearches(
    @Query() paginationParams: PaginationParams,
  ): Promise<PaginatedResult<SensitiveSearch>> {
    return this.searchService.getSensitiveSearches(paginationParams);
  }

  @Put('sensitive/:id/status')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async updateSearchStatus(
    @Param('id', new ParseIntPipe()) id: number,
    @Body('status') status: SearchStatus,
  ) {
    // Validate status
    const validStatuses: SearchStatus[] = ['pending', 'reviewed', 'flagged'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    // ParseIntPipe ensures id is a number
    return this.searchService.updateSearchStatus(Number(id), status);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async getStats() {
    return this.searchService.getSearchStats();
  }
}
