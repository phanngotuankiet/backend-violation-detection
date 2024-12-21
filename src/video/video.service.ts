import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVideoDto, ProcessVideoDto } from 'src/types/video';

@Injectable()
export class VideoService {
  constructor(private readonly prisma: PrismaService) {}

  async createVideo(createVideoDto: CreateVideoDto) {
    const { file, title, userId } = createVideoDto;
    const videoBuffer = await file.buffer;

    return this.prisma.video.create({
      data: {
        title,
        fileSize: file.size,
        mimeType: file.mimetype,
        videoData: videoBuffer,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async processVideo(processVideoDto: ProcessVideoDto) {
    const { videoId, confidences, detected_crimes, processedVideoBuffer } =
      processVideoDto;

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { user: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }
    const videoBuffer = Buffer.from(processedVideoBuffer, 'base64');
    const processed = await this.prisma.videosProcessed.create({
      data: {
        video: {
          connect: { id: videoId },
        },
        user: {
          connect: { id: video.user.id },
        },
        model: {
          connect: { id: 1 }, // Default model ID
        },
        filePath: `processed_${Date.now()}_${videoId}.mp4`,
        fileSize: processedVideoBuffer.length,
        mimeType: video.mimeType,
        videoData: videoBuffer,
        detect: detected_crimes,
        predictions: {
          create: Object.entries(confidences).map(([action, confidence]) => ({
            action,
            confidence,
            model: {
              connect: { id: 1 },
            },
          })),
        },
      },
      include: {
        predictions: true,
        video: true,
        user: true,
      },
    });

    return processed;
  }

  // lấy tất cả video đã upload và đọc bởi ML của user
  async getUserVideos(userId: number) {
    return this.prisma.video.findMany({
      where: { userId },
      include: {
        videosProcessed: {
          include: {
            predictions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getVideoById(id: number) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        videosProcessed: {
          include: {
            predictions: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async getProcessedVideoById(id: number) {
    const processed = await this.prisma.videosProcessed.findUnique({
      where: { id },
      include: {
        predictions: true,
        video: true,
      },
    });

    if (!processed) {
      throw new NotFoundException('Processed video not found');
    }

    return processed;
  }
}
