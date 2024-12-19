import { Prisma } from '@prisma/client';

export interface CreateVideoDto {
  title: string;
  file: Express.Multer.File;
  userId: number;
}

export interface ProcessVideoDto {
  videoId: number;
  confidences: {
    [key: string]: number;
  };
  detected_crimes: string[];
  processedVideoBuffer: string;
}
export type VideoCreate = Prisma.VideoCreateInput;
export type VideosProcessedCreate = Prisma.VideosProcessedCreateInput;
export type PredictionCreate = Prisma.PredictionCreateInput;
