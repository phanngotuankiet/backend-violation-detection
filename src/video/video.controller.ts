import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
  Get,
  Param,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Header,
  Res,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { ProcessVideoDto } from 'src/types/video';
import { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import axios from 'axios';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // Change from 'video' to 'file' to match FE
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() createVideoDto: any,
    @Request() req: any,
  ) {
    console.log('Request body:', createVideoDto);
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);

    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Use userId from request body if req.user.id is undefined
      const userId = req.user.id || createVideoDto.userId;

      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const video = await this.videoService.createVideo({
        file,
        title: createVideoDto.title,
        userId: Number(userId),
      });

      return {
        id: video.id,
        title: video.title,
        createdAt: video.createdAt,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  @Post('process')
  async processVideo(@Body() processVideoDto: ProcessVideoDto) {
    try {
      const processed = await this.videoService.processVideo({
        videoId: processVideoDto.videoId,
        confidences: processVideoDto.confidences,
        detected_crimes: processVideoDto.detected_crimes,
        processedVideoBuffer: processVideoDto.processedVideoBuffer,
      });

      return {
        id: processed.id,
        videoId: processed.videoId,
        detect: processed.detect,
        predictions: processed.predictions.map((p) => ({
          action: p.action,
          confidence: p.confidence,
        })),
      };
    } catch (error) {
      console.error('Process error:', error);
      throw error;
    }
  }

  @Get('user/:userId')
  async getUserVideos(@Param('userId') userId: string) {
    const videos = await this.videoService.getUserVideos(parseInt(userId));
    return videos.map((video) => ({
      id: video.id,
      title: video.title,
      createdAt: video.createdAt,
      processed: video.videosProcessed.map((p) => ({
        id: p.id,
        detect: p.detect,
        predictions: p.predictions,
      })),
    }));
  }

  @Get(':id')
  async streamVideo(@Param('id') id: string, @Res() res: ExpressResponse) {
    const video = await this.videoService.getVideoById(parseInt(id));
    res.header('Content-Type', 'video/mp4');
    res.header('Content-Length', video.videoData.length.toString());
    res.status(200).send(video.videoData);
  }

  @Get('processed/:id')
  async streamProcessedVideo(
    @Param('id') id: string,
    @Res() res: ExpressResponse,
  ) {
    const processed = await this.videoService.getProcessedVideoById(
      parseInt(id),
    );
    res.header('Content-Type', 'video/mp4');
    res.header('Content-Length', processed.videoData.length.toString());
    res.status(200).send(processed.videoData);
  }
}
